import test from "node:test";
import assert from "node:assert/strict";
import { Account, Asset, Keypair, Networks, Operation, TransactionBuilder } from "@stellar/stellar-sdk";

// The service reads STELLAR_NETWORK when it loads, so set it before importing.
process.env.STELLAR_NETWORK = "testnet";
const { parsePaymentTransaction } = await import("../src/services/stellar.js");

function buildXdr({ amount = "10", asset = Asset.native(), operations = 1 } = {}) {
  const signer = Keypair.random();
  const destination = Keypair.random().publicKey();
  const builder = new TransactionBuilder(new Account(signer.publicKey(), "1"), {
    fee: "100",
    networkPassphrase: Networks.TESTNET,
  }).setTimeout(30);
  for (let i = 0; i < operations; i++) {
    builder.addOperation(Operation.payment({ destination, asset, amount }));
  }
  const tx = builder.build();
  tx.sign(signer);
  return { xdr: tx.toXDR(), source: signer.publicKey(), destination };
}

test("reads source, destination and amount from the signed transaction", () => {
  const { xdr, source, destination } = buildXdr({ amount: "12.5" });
  const parsed = parsePaymentTransaction(xdr);
  assert.equal(parsed.source, source);
  assert.equal(parsed.destination, destination);
  assert.equal(parsed.amount, 12.5);
});

test("rejects garbage input", () => {
  assert.throws(() => parsePaymentTransaction("not-xdr"), { status: 400 });
  assert.throws(() => parsePaymentTransaction(undefined), { status: 400 });
});

test("rejects transactions with more than one operation", () => {
  const { xdr } = buildXdr({ operations: 2 });
  assert.throws(() => parsePaymentTransaction(xdr), { status: 400 });
});

test("rejects non-native assets", () => {
  const issued = new Asset("USD", Keypair.random().publicKey());
  const { xdr } = buildXdr({ asset: issued });
  assert.throws(() => parsePaymentTransaction(xdr), { status: 400 });
});
