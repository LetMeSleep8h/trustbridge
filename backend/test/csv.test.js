import test from "node:test";
import assert from "node:assert/strict";
import { csvCell, toCsv } from "../src/utils/csv.js";

test("quotes cells and escapes embedded quotes", () => {
  assert.equal(csvCell('He said "hi"'), '"He said ""hi"""');
});

test("keeps commas inside a single cell", () => {
  assert.equal(csvCell("Food, Water"), '"Food, Water"');
});

test("neutralises spreadsheet formulas", () => {
  for (const evil of ["=1+1", "+SUM(A1)", "-2+3", "@cmd", "\t=1"]) {
    assert.ok(csvCell(evil).startsWith(`"'`), `${JSON.stringify(evil)} should be prefixed`);
  }
});

test("renders null and undefined as empty", () => {
  assert.equal(csvCell(null), '""');
  assert.equal(csvCell(undefined), '""');
});

test("builds a header plus rows", () => {
  assert.equal(toCsv(["A", "B"], [[1, "x"]]), '"A","B"\n"1","x"');
});
