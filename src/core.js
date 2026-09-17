export function layout({
  page = "a4",
  width = 85.6,
  height = 54,
  margin = 12,
  gap = 5,
  copies = 2,
}) {
  const pages = { a4: [210, 297], letter: [215.9, 279.4] };
  if (!pages[page]) throw new Error("Choose A4 or Letter.");
  for (const [key, value] of Object.entries({
    width,
    height,
    margin,
    gap,
    copies,
  }))
    if (!Number.isFinite(value)) throw new Error(`${key} must be a number.`);
  if (
    width < 5 ||
    height < 5 ||
    margin < 5 ||
    gap < 0 ||
    !Number.isInteger(copies) ||
    copies < 1 ||
    copies > 100
  )
    throw new Error(
      "Use dimensions ≥ 5 mm, margin ≥ 5 mm, gap ≥ 0, and 1–100 copies.",
    );
  const [pageWidth, pageHeight] = pages[page],
    columns = Math.floor((pageWidth - 2 * margin + gap) / (width + gap)),
    rows = Math.floor((pageHeight - 2 * margin - 12 + gap) / (height + gap));
  if (columns < 1 || rows < 1)
    throw new Error(
      "The image does not fit with these margins and the calibration ruler.",
    );
  const capacity = columns * rows;
  if (copies > capacity)
    throw new Error(
      `Only ${capacity} copies fit on one page. Reduce copies or dimensions.`,
    );
  return {
    pageWidth,
    pageHeight,
    width,
    height,
    margin,
    positions: Array.from({ length: copies }, (_, i) => ({
      x: margin + (i % columns) * (width + gap),
      y: margin + Math.floor(i / columns) * (height + gap),
    })),
    ruler: {
      x: margin,
      y: pageHeight - margin - 5,
      length: Math.min(100, pageWidth - margin * 2),
    },
  };
}
export function printDocument(
  plan,
  dataURL,
  { fit = "contain", guides = true } = {},
) {
  if (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(dataURL))
    throw new Error("Use a decoded PNG, JPEG or WebP image.");
  if (!["contain", "cover"].includes(fit))
    throw new Error("Unsupported fit mode.");
  const images = plan.positions
    .map(
      (p) =>
        `<img alt="Print copy" src="${dataURL}" style="left:${p.x}mm;top:${p.y}mm;width:${plan.width}mm;height:${plan.height}mm;object-fit:${fit};${guides ? "outline:0.15mm dashed #999;" : ""}">`,
    )
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>PrintTrue — print at 100%</title><style>@page{size:${plan.pageWidth}mm ${plan.pageHeight}mm;margin:0}*{box-sizing:border-box}body{margin:0;font:12px Arial;background:#eee}.instructions{padding:16px;text-align:center}main{position:relative;width:${plan.pageWidth}mm;height:${plan.pageHeight}mm;background:white;margin:20px auto}img{position:absolute}.ruler{position:absolute;left:${plan.ruler.x}mm;top:${plan.ruler.y}mm;width:${plan.ruler.length}mm;height:3mm;border-top:.2mm solid black;border-left:.2mm solid black;border-right:.2mm solid black;font-size:8pt;padding-top:1mm}@media print{body{background:white}.instructions{display:none}main{margin:0}}</style></head><body><p class="instructions">Print with Actual size / 100%, no margins, headers or footers. Measure the ${plan.ruler.length} mm ruler after printing.</p><main>${images}<div class="ruler">${plan.ruler.length} mm — calibration ruler</div></main></body></html>`;
}
