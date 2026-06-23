import fs from "node:fs";
import path from "node:path";
import { isAllowedFilePath, isEditableFile, isExcludedRoot } from "./template-roots.ts";

export type FileNode = {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
};

function sortEntries<T extends { name: string; isDirectory(): boolean }>(entries: T[]): T[] {
  return entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });
}

function buildTree(dirPath: string, relativePath: string): FileNode[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const nodes: FileNode[] = [];

  for (const entry of sortEntries(fs.readdirSync(dirPath, { withFileTypes: true }))) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const entryRelative = path.join(relativePath, entry.name);
    const entryAbsolute = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        path: entryRelative.replace(/\\/g, "/"),
        type: "folder",
        children: buildTree(entryAbsolute, entryRelative),
      });
      continue;
    }

    if (entry.isFile() && isEditableFile(entry.name)) {
      nodes.push({
        name: entry.name,
        path: entryRelative.replace(/\\/g, "/"),
        type: "file",
      });
    }
  }

  return nodes;
}

export function buildFileTree(projectRoot: string): FileNode[] {
  if (!fs.existsSync(projectRoot)) {
    return [];
  }

  const nodes: FileNode[] = [];

  for (const entry of sortEntries(fs.readdirSync(projectRoot, { withFileTypes: true }))) {
    if (isExcludedRoot(entry.name)) {
      continue;
    }

    const entryAbsolute = path.join(projectRoot, entry.name);

    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        path: entry.name,
        type: "folder",
        children: buildTree(entryAbsolute, entry.name),
      });
      continue;
    }

    if (entry.isFile() && isEditableFile(entry.name)) {
      nodes.push({
        name: entry.name,
        path: entry.name,
        type: "file",
      });
    }
  }

  return nodes;
}

export function resolveSafePath(projectRoot: string, relativePath: string): string | null {
  const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, "");
  const fullPath = path.resolve(projectRoot, normalized);
  const relative = path.relative(projectRoot, fullPath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }

  if (!isAllowedFilePath(relative.replace(/\\/g, "/"))) {
    return null;
  }

  return fullPath;
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
