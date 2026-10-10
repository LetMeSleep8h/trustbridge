import { Router } from "express";
import { listTransactions, createTransaction } from "../models/Transaction.js";
import { authMiddleware } from "../middleware/auth.js";
import { toCsv } from "../utils/csv.js";
import { getAccountBalance, isValidPublicKey, parsePaymentTransaction, submitSignedTransaction, HORIZON_URL } from "../services/stellar.js";

const router = Router();

// Get user's transactions (paginated, filterable by type)
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const { type, q, page, limit } = req.query;
    const result = listTransactions({ user_id: req.user.id, type, q, page, limit });
    res.json({
      transactions: result.transactions,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load transactions" });
  }
});

// Submit a signed send transaction. Destination and amount are read from the
// signed transaction itself.
router.post("/send", authMiddleware, async (req, res) => {
  try {
    if (!req.user.walletAddress) return res.status(400).json({ error: "Connect a wallet before sending" });
    const payment = parsePaymentTransaction(req.body.xdr);
    if (payment.source !== req.user.walletAddress) {
      return res.status(400).json({ error: "Transaction was not signed by your connected wallet" });
    }
    const hash = await submitSignedTransaction(req.body.xdr);
    const tx = createTransaction({
      hash,
      from: payment.source,
      to: payment.destination,
      amount: payment.amount,
      asset: "XLM",
      type: "send",
      status: "confirmed",
      memo: payment.memo,
      user_id: req.user.id,
    });
    res.status(201).json({ hash, transaction: tx });
  } catch (err) {
    const status = err.status || 500;
    if (status === 500) console.error("Send error:", err);
    res.status(status).json({ error: status === 500 ? "Transaction failed" : err.message });
  }
});

// Export transactions CSV
router.get("/export/csv", authMiddleware, async (req, res) => {
  try {
    const { type, q } = req.query;
    const result = listTransactions({ user_id: req.user.id, type, q, page: 1, limit: 1000 });
    const transactions = result.transactions || [];
    const rows = transactions.map((tx) => {
      const date = tx.created_at ? new Date(tx.created_at).toISOString() : "";
      const counterparty = tx.type === "donation" ? (tx.campaign_title || `Campaign #${tx.campaign_id}`) : tx.to_address || "";
      return [date, tx.type, Number(tx.amount || 0), tx.status, counterparty, tx.hash];
    });
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=transactions.csv");
    res.send(toCsv(["Date", "Type", "Amount", "Status", "Counterparty", "Hash"], rows));
  } catch (err) {
    res.status(500).json({ error: "Failed to export CSV" });
  }
});

// Balance lookup
router.get("/balance/:address", async (req, res) => {
  if (!isValidPublicKey(req.params.address)) return res.status(400).json({ error: "Invalid Stellar address" });
  try {
    const balance = await getAccountBalance(req.params.address);
    res.json({ balance });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch balance" });
  }
});

// Balance history (derived from payment operations)
router.get("/balance-history/:address", async (req, res) => {
  try {
    const { address } = req.params;
    if (!isValidPublicKey(address)) return res.status(400).json({ error: "Invalid Stellar address" });
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365);
    
    // Get current balance from Horizon
    const balResp = await fetch(`${HORIZON_URL}/accounts/${address}`);
    if (!balResp.ok) {
      return res.status(500).json({ error: "Failed to fetch account from Horizon" });
    }
    const accountData = await balResp.json();
    const currentBalance = parseFloat(accountData.balances?.find((b) => b.asset_type === 'native')?.balance || '0');
    
    // Get payment operations for this address
    const opsResp = await fetch(`${HORIZON_URL}/accounts/${address}/payments?limit=200&order=desc`);
    if (!opsResp.ok) {
      return res.status(500).json({ error: "Failed to fetch payments from Horizon" });
    }
    const opsData = await opsResp.json();
    const payments = opsData.records || [];
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    // Build running balance from payment history
    const sampledPoints = {};
    let runningBalance = currentBalance;
    
    // Process payments in reverse chronological order
    for (const payment of payments) {
      const txDate = new Date(payment.created_at);
      if (txDate < cutoffDate) break;
      
      const dateKey = payment.created_at.split('T')[0];
      const amount = parseFloat(payment.amount || '0');
      
      // If this address sent money, add it back (going backwards in time)
      if (payment.from === address) {
        runningBalance += amount;
      }
      // If this address received money, subtract it (going backwards in time)
      else if (payment.to === address) {
        runningBalance -= amount;
      }
      
      // Store sampled point (one per day)
      if (!sampledPoints[dateKey]) {
        sampledPoints[dateKey] = runningBalance;
      }
    }
    
    // Convert to array sorted by date
    const points = Object.entries(sampledPoints)
      .map(([date, balance]) => ({ date, balance }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    res.json({ 
      history: points,
      currentBalance,
      oldestBalance: points.length > 0 ? points[0].balance : currentBalance,
    });
  } catch (err) {
    console.error("Balance history error:", err);
    res.status(500).json({ error: "Failed to fetch balance history" });
  }
});

export default router;
