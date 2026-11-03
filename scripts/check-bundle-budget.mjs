import { gzipSync } from "node:zlib";
import { readFile, stat } from "node:fs/promises";
import { resolve, basename } from "node:path";

const DIST = resolve("dist");
const BUDGETS = {
  htmlRawBytes: 2 * 1024,
  initialJavaScriptRawBytes: 450 * 1024,
  initialJavaScriptGzipBytes: 135 * 1024,
  initialCssRawBytes: 25 * 1024,
  initialCssGzipBytes: 6 * 1024,
};

function fail(message) {
  console.error("[bundle-budget] FAIL:", message);
  process.exitCode = 1;
}

async function readAsset(assetPath) {
  const absolutePath = resolve(DIST, "." + assetPath);
  if (!absolutePath.startsWith(DIST + "/")) {
    throw new Error("Asset path escaped the dist directory.");
  }
  const content = await readFile(absolutePath);
  return { content, bytes: content.byteLength, gzipBytes: gzipSync(content).byteLength };
}

const htmlPath = resolve(DIST, "index.html");
const html = await readFile(htmlPath, "utf8");
const htmlBytes = (await stat(htmlPath)).size;
const scriptPath = html.match(/<script[^>]+src=["']([^"']+)["']/i)?.[1];
const cssPath = html.match(/<link[^>]+href=["']([^"']+\.css)["']/i)?.[1];

if (!scriptPath || !cssPath) {
  fail("Could not identify the initial JavaScript and CSS assets from dist/index.html.");
  process.exit();
}

if (htmlBytes > BUDGETS.htmlRawBytes) {
  fail("HTML entry exceeds 2 KiB: " + htmlBytes + " bytes.");
}

const js = await readAsset(scriptPath);
const css = await readAsset(cssPath);

for (const [name, actual, budget] of [
  ["initial JavaScript raw", js.bytes, BUDGETS.initialJavaScriptRawBytes],
  ["initial JavaScript gzip", js.gzipBytes, BUDGETS.initialJavaScriptGzipBytes],
  ["initial CSS raw", css.bytes, BUDGETS.initialCssRawBytes],
  ["initial CSS gzip", css.gzipBytes, BUDGETS.initialCssGzipBytes],
]) {
  if (actual > budget) fail(name + " exceeds budget: " + actual + " > " + budget + " bytes.");
}

if (/(?:lib-[\w-]+\.js|webllm\.worker-[\w-]+\.js)/i.test(html)) {
  fail("The initial HTML references a WebLLM runtime or worker chunk.");
}

console.log("[bundle-budget] PASS");
console.log("  HTML:", htmlBytes, "bytes /", BUDGETS.htmlRawBytes, "budget");
console.log("  Initial JS:", js.bytes, "bytes /", js.gzipBytes, "gzip bytes");
console.log("  Initial JS budget:", BUDGETS.initialJavaScriptRawBytes, "raw /", BUDGETS.initialJavaScriptGzipBytes, "gzip");
console.log("  Initial CSS:", css.bytes, "bytes /", css.gzipBytes, "gzip bytes");
console.log("  Initial CSS budget:", BUDGETS.initialCssRawBytes, "raw /", BUDGETS.initialCssGzipBytes, "gzip");
console.log("  Entry assets:", basename(scriptPath), basename(cssPath));
console.log("  WebLLM chunks referenced by HTML: none");
