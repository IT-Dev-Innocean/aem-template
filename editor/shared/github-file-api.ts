import type { FileNode } from "./file-api-core.ts";
import { isAllowedFilePath, isExcludedRoot } from "./template-roots.ts";
const CACHE_TTL_MS = 30_000;

type GitHubConfig = {
  owner: string;
  repo: string;
  branch: string;
  token?: string;
};

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

let treeCache: CacheEntry<FileNode[]> | null = null;
const contentCache = new Map<string, CacheEntry<string>>();

function getConfig(): GitHubConfig {
  return {
    owner: process.env.GITHUB_OWNER ?? "IT-Dev-Innocean",
    repo: process.env.GITHUB_REPO ?? "aem-template",
    branch: process.env.GITHUB_BRANCH ?? "main",
    token: process.env.GITHUB_TOKEN,
  };
}

function githubHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "aem-template-editor",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function githubFetch<T>(url: string, token?: string): Promise<T> {
  const response = await fetch(url, { headers: githubHeaders(token) });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${text}`);
  }

  return response.json() as Promise<T>;
}

function sortNode(node: FileNode) {
  if (!node.children) {
    return;
  }

  node.children.sort((a, b) => {
    if (a.type === "folder" && b.type !== "folder") return -1;
    if (a.type !== "folder" && b.type === "folder") return 1;
    return a.name.localeCompare(b.name);
  });

  for (const child of node.children) {
    if (child.type === "folder") {
      sortNode(child);
    }
  }
}

function buildTreeFromPaths(filePaths: string[]): FileNode[] {
  const rootFolders = new Map<string, FileNode>();
  const rootFiles: FileNode[] = [];

  for (const filePath of [...filePaths].sort()) {
    if (!isAllowedFilePath(filePath)) {
      continue;
    }

    const parts = filePath.split("/");

    if (parts.length === 1) {
      rootFiles.push({ name: parts[0], path: parts[0], type: "file" });
      continue;
    }

    const rootName = parts[0];
    if (isExcludedRoot(rootName)) {
      continue;
    }

    let current: FileNode = rootFolders.get(rootName) ?? {
      name: rootName,
      path: rootName,
      type: "folder",
      children: [],
    };

    if (!rootFolders.has(rootName)) {
      rootFolders.set(rootName, current);
    }

    let currentPath = rootName;

    for (let index = 1; index < parts.length; index += 1) {
      const part = parts[index];
      const isFile = index === parts.length - 1;
      currentPath = `${currentPath}/${part}`;

      if (!current.children) {
        current.children = [];
      }

      if (isFile) {
        current.children.push({ name: part, path: currentPath, type: "file" });
        break;
      }

      let folder = current.children.find(
        (child): child is FileNode & { type: "folder" } =>
          child.name === part && child.type === "folder",
      );

      if (!folder) {
        folder = { name: part, path: currentPath, type: "folder", children: [] };
        current.children.push(folder);
      }

      current = folder;
    }
  }

  const folders = [...rootFolders.values()].sort((a, b) => a.name.localeCompare(b.name));
  for (const folder of folders) {
    sortNode(folder);
  }

  return [
    ...folders,
    ...rootFiles.sort((a, b) => a.name.localeCompare(b.name)),
  ];
}

export async function fetchGitHubFileTree(): Promise<FileNode[]> {
  if (treeCache && Date.now() < treeCache.expiresAt) {
    return treeCache.value;
  }

  const config = getConfig();
  const data = await githubFetch<{ tree: Array<{ path: string; type: string }> }>(
    `https://api.github.com/repos/${config.owner}/${config.repo}/git/trees/${config.branch}?recursive=1`,
    config.token,
  );

  const filePaths = data.tree
    .filter((item) => item.type === "blob")
    .map((item) => item.path)
    .filter((filePath) => isAllowedFilePath(filePath));

  const tree = buildTreeFromPaths(filePaths);
  treeCache = { value: tree, expiresAt: Date.now() + CACHE_TTL_MS };
  return tree;
}

export async function fetchGitHubFileContent(filePath: string): Promise<string> {
  const cached = contentCache.get(filePath);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.value;
  }

  const config = getConfig();
  const encodedPath = filePath.split("/").map(encodeURIComponent).join("/");
  const data = await githubFetch<{ content: string; encoding: string }>(
    `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${encodedPath}?ref=${config.branch}`,
    config.token,
  );

  if (data.encoding !== "base64") {
    throw new Error("Unexpected GitHub content encoding");
  }

  const content = Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf-8");
  contentCache.set(filePath, { value: content, expiresAt: Date.now() + CACHE_TTL_MS });
  return content;
}

export function clearGitHubFileCache() {
  treeCache = null;
  contentCache.clear();
}
