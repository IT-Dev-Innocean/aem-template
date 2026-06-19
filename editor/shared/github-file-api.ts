import type { FileNode } from "./file-api-core.ts";
import { isTemplateRoot } from "./template-roots.ts";
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

function getTemplateRootsFromPaths(filePaths: string[]): string[] {
  const roots = new Set<string>();

  for (const filePath of filePaths) {
    const root = filePath.split("/")[0];
    if (isTemplateRoot(root)) {
      roots.add(root);
    }
  }

  return [...roots].sort((a, b) => a.localeCompare(b));
}

function buildTreeFromPaths(filePaths: string[]): FileNode[] {
  const templateRoots = getTemplateRootsFromPaths(filePaths);
  const roots: Record<string, FileNode> = {};

  for (const root of templateRoots) {
    roots[root] = { name: root, path: root, type: "folder", children: [] };
  }

  for (const filePath of filePaths.sort()) {
    const parts = filePath.split("/");
    const rootName = parts[0];

    if (!isTemplateRoot(rootName) || !roots[rootName]) {
      continue;
    }

    let current = roots[rootName];
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
        continue;
      }

      let folder = current.children.find(
        (child) => child.name === part && child.type === "folder",
      );

      if (!folder) {
        folder = { name: part, path: currentPath, type: "folder", children: [] };
        current.children.push(folder);
      }

      current = folder;
    }
  }

  for (const root of Object.values(roots)) {
    sortNode(root);
  }

  return templateRoots.map((name) => roots[name]);
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
    .filter((filePath) => isTemplateRoot(filePath.split("/")[0]));

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
