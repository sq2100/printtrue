import test from "node:test";
import assert from "node:assert/strict";
import { layout, printDocument } from "../src/core.js";
test("A4 physical sizes and repeated positions stay within margins", () => {
  const p = layout({ copies: 4 });
  assert.equal(p.pageWidth, 210);
  assert.equal(p.positions.length, 4);
  for (const x of p.positions) {
    assert.ok(x.x + p.width <= 198);
    assert.ok(x.y + p.height < p.ruler.y);
  }
});
test("rejects oversized, invalid and overflowing sheets", () => {
  assert.throws(() => layout({ width: 220 }));
  assert.throws(() => layout({ copies: 100 }));
  assert.throws(() => layout({ width: NaN }));
  assert.throws(() => layout({ margin: 0 }));
});
test("print document has explicit physical page and image sizes", () => {
  const doc = printDocument(
    layout({ copies: 1 }),
    "data:image/png;base64,YQ==",
  );
  assert.ok(doc.includes("@page{size:210mm 297mm;margin:0}"));
  assert.ok(doc.includes("width:85.6mm;height:54mm"));
  assert.ok(doc.includes("100 mm"));
  assert.throws(() => printDocument(layout({}), "javascript:alert(1)"));
});
