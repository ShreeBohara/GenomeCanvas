import fs from "node:fs";
import path from "node:path";
import url from "node:url";


const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const candidateRoots = [
  path.resolve(__dirname, "../node_modules/molstar/build/viewer"),
  path.resolve(__dirname, "../../node_modules/molstar/build/viewer"),
];
const sourceDir = candidateRoots.find((candidate) => fs.existsSync(candidate));
if (!sourceDir) {
  throw new Error("Unable to find Molstar viewer assets in node_modules.");
}

const targetDir = path.resolve(__dirname, "../public/vendor/molstar-viewer");
fs.mkdirSync(path.dirname(targetDir), { recursive: true });
fs.rmSync(targetDir, { recursive: true, force: true });
fs.cpSync(sourceDir, targetDir, { recursive: true });

console.log(`Copied Molstar assets to ${targetDir}`);
