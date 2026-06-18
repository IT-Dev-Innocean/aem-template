import type { FileNode } from "../../vite-plugin-file-api";

export async function fetchFileTree(): Promise<FileNode[]> {
  const response = await fetch("/api/files");
  if (!response.ok) {
    throw new Error("Failed to load file tree");
  }
  return response.json();
}

export async function fetchFileContent(path: string): Promise<string> {
  const response = await fetch(`/api/files/content?path=${encodeURIComponent(path)}`);
  if (!response.ok) {
    throw new Error(`Failed to load file: ${path}`);
  }
  const data = (await response.json()) as { content: string };
  return data.content;
}

export async function saveFileContent(path: string, content: string): Promise<void> {
  const response = await fetch(`/api/files/content?path=${encodeURIComponent(path)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? `Failed to save file: ${path}`);
  }
}
