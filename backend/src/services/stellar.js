import { Horizon, Networks, StrKey, TransactionBuilder } from "@stellar/stellar-sdk";

const NETWORKS = {
  mainnet: { passphrase: Networks.PUBLIC, horizonUrl: "https://horizon.stellar.org" },
  testnet: { passphrase: Networks.TESTNET, horizonUrl: "https://horizon-testnet.stellar.org" },
};

/**
 * Network selection comes from STELLAR_NETWORK ("testnet" | "mainnet").
 * Defaults to mainnet so existing deployments keep their behaviour; use
 * testnet for local development (see backend/.env.example).
 */
function resolveNetworkName() {
  const requested = (process.env.STELLAR_NETWORK || "mainnet").toLowerCase();
  if (requested === "mainnet" || requested === "testnet") return requested;
  console.warn(`[stellar] Unknown STELLAR_NETWORK "${process.env.STELLAR_NETWORK}", falling back to mainnet`);
  return "mainnet";
}

export const NETWORK_NAME = resolveNetworkName();
export const NETWORK_PASSPHRASE = NETWORKS[NETWORK_NAME].passphrase;
export const HORIZON_URL = NETWORKS[NETWORK_NAME].horizonUrl;

const server = new Horizon.Server(HORIZON_URL);

export function isValidPublicKey(address) {
  return typeof address === "string" && StrKey.isValidEd25519PublicKey(address);
}

function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

export async function getAccountBalance(address) {
  try {
    const account = await server.loadAccount(address);
    const xlm = account.balances.find((b) => b.asset_type === "native");
    return parseFloat(xlm.balance);
  } catch {
    return 0;
  }
}

/**
 * Decode a signed transaction envelope and return the one thing we support:
 * a single native XLM payment. The amount and destination come from the
 * signed transaction itself, never from fields the client sends alongside it,
 * so a caller cannot claim a different amount than the one actually paid.
 */
export function parsePaymentTransaction(xdr) {
  if (typeof xdr !== "string" || xdr.length === 0) throw httpError(400, "Signed transaction required");

  let tx;
  try {
    tx = TransactionBuilder.fromXDR(xdr, NETWORK_PASSPHRASE);
  } catch {
    throw httpError(400, "Invalid transaction");
  }

  // Fee-bump envelopes have no `operations` of their own
  if (!Array.isArray(tx.operations) || tx.operations.length !== 1) {
    throw httpError(400, "Transaction must contain exactly one payment operation");
  }

  const [op] = tx.operations;
  if (op.type !== "payment" || !op.asset.isNative()) {
    throw httpError(400, "Only native XLM payments are supported");
  }

  const amount = Number(op.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw httpError(400, "Invalid payment amount");

  return {
    source: tx.source,
    destination: op.destination,
    amount,
    memo: tx.memo?.value ? String(tx.memo.value) : null,
  };
}

/** Submit an already-signed transaction (XDR, base64) to Horizon and return its hash. */
export async function submitSignedTransaction(xdr) {
  try {
    const tx = TransactionBuilder.fromXDR(xdr, NETWORK_PASSPHRASE);
    const result = await server.submitTransaction(tx);
    return result.hash;
  } catch (err) {
    const codes = err?.response?.data?.extras?.result_codes;
    console.error("[stellar] submit failed:", codes || err.message);
    throw httpError(502, "The Stellar network rejected the transaction");
  }
}

export { server as stellarServer };
