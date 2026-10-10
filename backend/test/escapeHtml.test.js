import test from "node:test";
import assert from "node:assert/strict";
import { escapeHtml } from "../src/utils/escapeHtml.js";

test("escapes markup so user text cannot inject HTML", () => {
  assert.equal(escapeHtml('<a href="x">hi</a>'), "&lt;a href=&quot;x&quot;&gt;hi&lt;/a&gt;");
});

test("escapes ampersands and single quotes", () => {
  assert.equal(escapeHtml("Tom & Jerry's"), "Tom &amp; Jerry&#39;s");
});

test("handles null and undefined", () => {
  assert.equal(escapeHtml(null), "");
  assert.equal(escapeHtml(undefined), "");
});
