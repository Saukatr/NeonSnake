import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
const frames = process.argv.slice(2).map(Number);
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browserExecutable = process.env.REMOTION_CHROME;
const composition = await selectComposition({ serveUrl, id: "Mahalaya", browserExecutable });
for (const fr of frames) {
  await renderStill({ serveUrl, composition, frame: fr, output: `work/still_${String(fr).padStart(4, "0")}.jpg`, imageFormat: "jpeg", jpegQuality: 85, scale: 0.5, browserExecutable });
  console.log("still", fr);
}
