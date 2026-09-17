import { layout, printDocument } from "./core.js";
import { $, init, message, stats, download, guard, ready } from "./ui.js";
init();
let imageData = null,
  plan = null;
async function accept(file) {
  if (!file || !["image/png", "image/jpeg", "image/webp"].includes(file.type))
    throw new Error("Choose a PNG, JPEG or WebP image.");
  if (file.size > 20 * 1048576)
    throw new Error("Use an image smaller than 20 MiB.");
  const candidate = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
  const img = new Image();
  img.src = candidate;
  await img.decode();
  imageData = candidate;
  $("image-label").textContent =
    `${file.name} · ${img.naturalWidth} × ${img.naturalHeight} px`;
  $("export").disabled = true;
  message(
    "Image loaded locally. Set the physical dimensions and build the sheet.",
  );
}
$("image").onchange = guard((e) => accept(e.target.files[0]));
function run() {
  if (!imageData) throw new Error("Choose an image, or try the demo first.");
  plan = layout({
    page: $("page").value,
    width: Number($("width").value),
    height: Number($("height").value),
    margin: Number($("margin").value),
    gap: Number($("gap").value),
    copies: Number($("copies").value),
  });
  const stage = $("output");
  stage.replaceChildren();
  const paper = document.createElement("div");
  paper.className = "paper-preview";
  const scale = Math.min(2, (stage.clientWidth - 44) / plan.pageWidth);
  paper.style.width = plan.pageWidth * scale + "px";
  paper.style.height = plan.pageHeight * scale + "px";
  for (const p of plan.positions) {
    const img = document.createElement("img");
    img.className = "paper-item";
    img.src = imageData;
    img.alt = "Print copy";
    Object.assign(img.style, {
      left: p.x * scale + "px",
      top: p.y * scale + "px",
      width: plan.width * scale + "px",
      height: plan.height * scale + "px",
      objectFit: $("fit").value,
    });
    paper.append(img);
  }
  const ruler = document.createElement("div");
  Object.assign(ruler.style, {
    position: "absolute",
    left: plan.ruler.x * scale + "px",
    top: plan.ruler.y * scale + "px",
    width: plan.ruler.length * scale + "px",
    borderTop: "1px solid black",
    fontSize: "9px",
  });
  ruler.textContent = plan.ruler.length + " mm calibration ruler";
  paper.append(ruler);
  stage.append(paper);
  stats([
    ["Print size", `${plan.width} × ${plan.height} mm`],
    ["Copies", plan.positions.length],
    ["Page", $("page").value.toUpperCase()],
  ]);
  message(
    "Preview is scaled to fit your screen. Export the print sheet, open it, then print at Actual size / 100%.",
  );
  ready();
}
$("run").onclick = guard(run);
$("export").onclick = () =>
  download(
    printDocument(plan, imageData, {
      fit: $("fit").value,
      guides: $("guides").checked,
    }),
    "printtrue-sheet.html",
    "text/html;charset=utf-8",
  );
$("demo").onclick = guard(() => {
  const canvas = document.createElement("canvas");
  canvas.width = 856;
  canvas.height = 540;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#e4eada";
  ctx.fillRect(0, 0, 856, 540);
  ctx.fillStyle = "#526747";
  ctx.fillRect(48, 48, 90, 90);
  ctx.font = "bold 62px Arial";
  ctx.fillText("A little keepsake.", 48, 275);
  ctx.font = "25px Arial";
  ctx.fillText("DEMO CARD / 85.6 × 54 mm", 48, 440);
  imageData = canvas.toDataURL("image/png");
  $("image-label").textContent = "Synthetic demo card";
  $("width").value = "85.6";
  $("height").value = "54";
  $("copies").value = "4";
  run();
});
