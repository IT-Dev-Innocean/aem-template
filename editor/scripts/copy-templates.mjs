import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const editorRoot = path.resolve(__dirname, "..");
const projectRoot = path.resolve(editorRoot, "..");
const dest = path.join(editorRoot, "netlify/functions/templates");

function copyDir(src, destPath) {
  fs.mkdirSync(destPath, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(destPath, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, dstPath);
    } else {
      fs.copyFileSync(srcPath, dstPath);
    }
  }
}

if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true, force: true });
}

fs.mkdirSync(dest, { recursive: true });

for (const folder of ["hmid", "kia"]) {
  const src = path.join(projectRoot, folder);
  if (!fs.existsSync(src)) {
    console.warn(`Warning: template folder not found: ${src}`);
    continue;
  }
  copyDir(src, path.join(dest, folder));
  console.log(`Copied ${folder}/ → netlify/functions/templates/${folder}/`);
}
