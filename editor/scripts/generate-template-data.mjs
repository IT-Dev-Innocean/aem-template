import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const editorRoot = path.resolve(__dirname, "..");
const projectRoot = path.resolve(editorRoot, "..");
const outputPath = path.join(editorRoot, "netlify/functions/template-data.json");

const ALLOWED_ROOTS = ["hmid", "kia"];

function buildTree(dirPath, relativePath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith("."))
    .sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    })
    .map((entry) => {
      const entryRelative = path.join(relativePath, entry.name).replace(/\\/g, "/");
      const entryAbsolute = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        return {
          name: entry.name,
          path: entryRelative,
          type: "folder",
          children: buildTree(entryAbsolute, entryRelative),
        };
      }

      return {
        name: entry.name,
        path: entryRelative,
        type: "file",
      };
    });
}

function buildFileTree(root) {
  return ALLOWED_ROOTS.map((folder) => ({
    name: folder,
    path: folder,
    type: "folder",
    children: buildTree(path.join(root, folder), folder),
  }));
}

function flattenFiles(nodes) {
  return nodes.flatMap((node) =>
    node.type === "folder" ? flattenFiles(node.children ?? []) : [node],
  );
}

const tree = buildFileTree(projectRoot);
const files = {};

for (const file of flattenFiles(tree)) {
  const absolutePath = path.join(projectRoot, file.path);
  files[file.path] = fs.readFileSync(absolutePath, "utf-8");
}

fs.writeFileSync(outputPath, JSON.stringify({ tree, files }));

const fileCount = Object.keys(files).length;
console.log(
  `Generated template-data.json with ${fileCount} files from hmid/ & kia/ (repo root: ${projectRoot})`,
);
