import fs from "node:fs";
import path from "node:path";
import { isTemplateRoot } from "./template-roots.ts";

export type FileNode = {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
};

export function getTemplateRoots(projectRoot: string): string[] {
  if (!fs.existsSync(projectRoot)) {
    return [];
  }

  return fs
    .readdirSync(projectRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && isTemplateRoot(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

export function resolveSafePath(projectRoot: string, relativePath: string): string | null {
  const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, "");
  const fullPath = path.resolve(projectRoot, normalized);
  const relative = path.relative(projectRoot, fullPath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }

  const rootFolder = relative.split(path.sep)[0];
  if (!isTemplateRoot(rootFolder)) {
    return null;
  }

  return fullPath;
}

function buildTree(dirPath: string, relativePath: string): FileNode[] {
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
      const entryRelative = path.join(relativePath, entry.name);
      const entryAbsolute = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        return {
          name: entry.name,
          path: entryRelative.replace(/\\/g, "/"),
          type: "folder" as const,
          children: buildTree(entryAbsolute, entryRelative),
        };
      }

      return {
        name: entry.name,
        path: entryRelative.replace(/\\/g, "/"),
        type: "file" as const,
      };
    });
}

export function buildFileTree(projectRoot: string): FileNode[] {
  return getTemplateRoots(projectRoot).map((folder) => ({
    name: folder,
    path: folder,
    type: "folder" as const,
    children: buildTree(path.join(projectRoot, folder), folder),
  }));
}

export function readFileContent(
  projectRoot: string,
  filePath: string,
): { path: string; content: string } | null {
  const safePath = resolveSafePath(projectRoot, filePath);
  if (!safePath || !fs.existsSync(safePath) || !fs.statSync(safePath).isFile()) {
    return null;
  }

  return {
    path: filePath,
    content: fs.readFileSync(safePath, "utf-8"),
  };
}

export function writeFileContent(
  projectRoot: string,
  filePath: string,
  content: string,
): { path: string; saved: true } | null {
  const safePath = resolveSafePath(projectRoot, filePath);
  if (!safePath) {
    return null;
  }

  fs.mkdirSync(path.dirname(safePath), { recursive: true });
  fs.writeFileSync(safePath, content, "utf-8");
  return { path: filePath, saved: true };
}
