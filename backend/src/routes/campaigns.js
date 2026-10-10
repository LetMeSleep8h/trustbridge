import { Router } from "express";
import { listCampaigns, findCampaignById, createCampaign, recordDonation } from "../models/Campaign.js";
import { getDB } from "../config/database.js";
import { createTransaction, listTransactions } from "../models/Transaction.js";
import { createComment, getCommentsByCampaign, deleteComment, deleteCommentByCreator } from "../models/Comment.js";
import { authMiddleware } from "../middleware/auth.js";
import { uploadSingle, handleImageUpload } from "../middleware/upload.js";
import { isValidPublicKey, parsePaymentTransaction, submitSignedTransaction } from "../services/stellar.js";
import { sendDonationConfirmation, sendFundingMilestone } from "../services/email.js";

const router = Router();

// List campaigns
router.get("/", async (req, res) => {
  try {
    const { category, status, q } = req.query;
    // Only "active" and "funded" can be requested publicly; deactivated
    // campaigns never appear in the public listing.
    const publicStatus = status === "active" || status === "funded" ? status : undefined;
    const campaigns = listCampaigns({
      category: typeof category === "string" ? category : undefined,
      status: publicStatus,
      q: typeof q === "string" ? q : undefined,
    });
    res.json({ campaigns });
  } catch (err) {
    res.status(500).json({ error: "Failed to load campaigns" });
  }
});

// Validate the fields of a new campaign. Returns an error message or null.
function validateNewCampaign({ title, description, organization, category, goal, endDate, walletAddress }) {
  const text = (v) => (typeof v === "string" ? v.trim() : "");
  if (text(title).length < 6 || text(title).length > 120) return "Title must be 6 to 120 characters";
  if (text(description).length < 30 || text(description).length > 5000) return "Description must be 30 to 5000 characters";
  if (text(organization).length < 2 || text(organization).length > 120) return "Organization must be 2 to 120 characters";
  if (text(category).length < 1 || text(category).length > 60) return "Category is required";
  if (!Number.isFinite(goal) || goal < 100 || goal > 1_000_000_000) return "Goal must be between 100 and 1,000,000,000 XLM";
  const end = new Date(endDate);
  if (!endDate || Number.isNaN(end.getTime()) || end.getTime() <= Date.now()) return "End date must be a valid date in the future";
  if (walletAddress && !isValidPublicKey(walletAddress)) return "Invalid Stellar wallet address";
  return null;
}

// Create campaign
router.post("/", authMiddleware, uploadSingle, handleImageUpload, async (req, res) => {
  try {
    const { title, description, organization, category, image, endDate, urgent, walletAddress } = req.body;
    const goal = Number(req.body.goal);
    const error = validateNewCampaign({ title, description, organization, category, goal, endDate, walletAddress });
    if (error) return res.status(400).json({ error });

    const campaign = createCampaign({
      title: title.trim(),
      description: description.trim(),
      organization: organization.trim(),
      category: category.trim(),
      goal,
      image: image || null,
      end_date: endDate,
      // Form fields arrive as strings, so Boolean("false") would be true
      urgent: urgent === true || urgent === "true" || urgent === "1",
      creator_id: req.user.id,
      // Donations go to this wallet; default to the creator's linked wallet
      wallet_address: walletAddress || req.user.walletAddress || null,
    });
    res.status(201).json({ campaign });
  } catch (err) {
    console.error("Create campaign error:", err);
    res.status(500).json({ error: "Failed to create campaign" });
  }
});

// Donate to campaign.
// The client sends a signed Stellar transaction. The amount, destination and
// sender are read from that transaction and checked, never taken from
// separate request fields.
router.post("/:id/donate", authMiddleware, async (req, res) => {
  try {
    const campaign = findCampaignById(Number(req.params.id));
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    if (campaign.status !== "active") return res.status(409).json({ error: "This campaign is not accepting donations" });
    if (!campaign.wallet_address) return res.status(409).json({ error: "This campaign has no donation wallet yet" });
    if (!req.user.walletAddress) return res.status(400).json({ error: "Connect a wallet before donating" });

    const payment = parsePaymentTransaction(req.body.xdr);
    if (payment.destination !== campaign.wallet_address) {
      return res.status(400).json({ error: "Transaction destination does not match the campaign wallet" });
    }
    if (payment.source !== req.user.walletAddress) {
      return res.status(400).json({ error: "Transaction was not signed by your connected wallet" });
    }

    const hash = await submitSignedTransaction(req.body.xdr);

    // Record the donation and update totals together
    const db = getDB();
    const record = db.transaction(() => {
      const transaction = createTransaction({
        hash,
        from: payment.source,
        to: payment.destination,
        amount: payment.amount,
        type: "donation",
        status: "confirmed",
        memo: payment.memo,
        campaign_id: campaign.id,
        user_id: req.user.id,
      });
      const updated = recordDonation(campaign.id, payment.amount);
      return { transaction, updated };
    });
    const { transaction, updated } = record();

    // Email notifications (fire-and-forget; never block the donation response)
    sendDonationConfirmation({ donorId: req.user.id, campaignId: campaign.id, amount: payment.amount, hash }).catch((err) => {
      console.error("[email] donation confirmation failed:", err.message);
    });
    if (updated.status === "funded" && campaign.status !== "funded" && updated.creator_id) {
      sendFundingMilestone({ creatorId: updated.creator_id, campaignId: campaign.id }).catch((err) => {
        console.error("[email] funding milestone failed:", err.message);
      });
    }

    res.json({ hash, campaign: updated, transaction });
  } catch (err) {
    const status = err.status || 500;
    if (status === 500) console.error("Donation error:", err);
    res.status(status).json({ error: status === 500 ? "Donation failed" : err.message });
  }
});

// Single campaign with donations
router.get("/:id", async (req, res) => {
  try {
    const campaign = findCampaignById(Number(req.params.id));
    if (!campaign) return res.status(404).json({ error: "Not found" });
    const donations = listTransactions({ campaign_id: campaign.id });
    const comments = getCommentsByCampaign(campaign.id);
    res.json({ campaign, donations, comments });
  } catch (err) {
    res.status(500).json({ error: "Failed to load campaign" });
  }
});

// Comments
router.post("/:id/comments", authMiddleware, async (req, res) => {
  try {
    const campaign = findCampaignById(Number(req.params.id));
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    const { text } = req.body;
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ error: "Comment text is required" });
    }
    const comment = createComment({
      campaign_id: campaign.id,
      user_id: req.user.id,
      text: text.trim(),
    });
    res.status(201).json({ comment });
  } catch (err) {
    res.status(500).json({ error: "Failed to create comment" });
  }
});

router.delete("/:campaignId/comments/:commentId", authMiddleware, async (req, res) => {
  try {
    const { campaignId, commentId } = req.params;
    const deleted = deleteComment(Number(commentId), req.user.id);
    if (!deleted) {
      const campaign = findCampaignById(Number(campaignId));
      if (campaign && campaign.creator_id === req.user.id) {
        const byCreator = deleteCommentByCreator(Number(commentId), req.user.id);
        if (!byCreator) return res.status(404).json({ error: "Comment not found" });
        return res.json({ success: true });
      }
      return res.status(404).json({ error: "Comment not found or not authorized" });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

export default router;
