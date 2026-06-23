import * as Collapsible from "@radix-ui/react-collapsible";
import {
  ChevronDown,
  ChevronRight,
  FileCode2,
  FileJson2,
  FileText,
  Folder,
  FolderOpen,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type ElementType } from "react";
import type { FileNode } from "../../vite-plugin-file-api";
import { useEditor } from "@/context/editor-context";
import { fetchFileContent, fetchFileTree } from "@/lib/file-api";
import { cn, getFileName, getLanguageFromPath } from "@/lib/utils";

function getFileIcon(filePath: string): ElementType {
  const language = getLanguageFromPath(filePath);

  switch (language) {
    case "html":
    case "css":
    case "javascript":
    case "typescript":
      return FileCode2;
    case "json":
      return FileJson2;
    default:
      return FileText;
  }
}

function FileTreeItem({ node, depth = 0 }: { node: FileNode; depth?: number }) {
  const [open, setOpen] = useState(depth < 1);
  const { activeTabPath, openFile } = useEditor();
  const queryClient = useQueryClient();

  const openFileMutation = useMutation({
    mutationFn: fetchFileContent,
    onSuccess: (content, path) => {
      openFile(path, content);
      queryClient.setQueryData(["file-content", path], content);
    },
  });

  if (node.type === "folder") {
    return (
      <Collapsible.Root open={open} onOpenChange={setOpen}>
        <Collapsible.Trigger
          className="flex w-full items-center gap-1 rounded px-2 py-1 text-left text-sm text-vscode-text hover:bg-vscode-hover"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {open ? (
            <FolderOpen size={15} className="text-[#dcb67a]" />
          ) : (
            <Folder size={15} className="text-[#dcb67a]" />
          )}
          <span className="truncate">{node.name}</span>
        </Collapsible.Trigger>
        <Collapsible.Content>
          {node.children?.map((child) => (
            <FileTreeItem key={child.path} node={child} depth={depth + 1} />
          ))}
        </Collapsible.Content>
      </Collapsible.Root>
    );
  }

  const isActive = activeTabPath === node.path;
  const FileIcon = getFileIcon(node.path);

  return (
    <button
      type="button"
      onClick={() => openFileMutation.mutate(node.path)}
      className={cn(
        "flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-vscode-hover",
        isActive ? "bg-vscode-selection text-white" : "text-vscode-text",
      )}
      style={{ paddingLeft: `${depth * 12 + 24}px` }}
    >
      <FileIcon size={15} className="shrink-0 text-[#519aba]" />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

function flattenFiles(nodes: FileNode[]): FileNode[] {
  return nodes.flatMap((node) =>
    node.type === "folder" ? flattenFiles(node.children ?? []) : [node],
  );
}

function SearchPanel({ tree }: { tree: FileNode[] }) {
  const { searchQuery, setSearchQuery, activeTabPath, openFile } = useEditor();
  const queryClient = useQueryClient();

  const openFileMutation = useMutation({
    mutationFn: fetchFileContent,
    onSuccess: (content, path) => {
      openFile(path, content);
      queryClient.setQueryData(["file-content", path], content);
    },
  });

  const results = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return [];
    }
    return flattenFiles(tree).filter((file) => file.name.toLowerCase().includes(query));
  }, [searchQuery, tree]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-vscode-border px-3 py-3">
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search files..."
          className="w-full rounded border border-vscode-border bg-vscode-bg px-2 py-1.5 text-sm text-vscode-text outline-none focus:border-vscode-accent"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="p-2">
          {results.length === 0 ? (
            <p className="px-2 py-4 text-xs text-vscode-muted">No matching files</p>
          ) : (
            results.map((file) => (
              <button
                key={file.path}
                type="button"
                onClick={() => openFileMutation.mutate(file.path)}
                className={cn(
                  "flex w-full flex-col rounded px-2 py-2 text-left hover:bg-vscode-hover",
                  activeTabPath === file.path && "bg-vscode-selection",
                )}
              >
                <span className="text-sm">{file.name}</span>
                <span className="text-xs text-vscode-muted">{file.path}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { sidebarView } = useEditor();
  const { data: tree = [], isLoading, error } = useQuery({
    queryKey: ["file-tree"],
    queryFn: fetchFileTree,
    refetchInterval: import.meta.env.PROD ? 30_000 : false,
    staleTime: import.meta.env.PROD ? 15_000 : 30_000,
  });

  const fileCount = tree.reduce((count, node) => count + flattenFiles([node]).length, 0);

  return (
    <aside className="flex h-full min-h-0 w-72 shrink-0 flex-col border-r border-vscode-border bg-vscode-sidebar">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-vscode-border px-4 text-[11px] font-semibold uppercase tracking-wide text-vscode-muted">
        <span>{sidebarView === "explorer" ? "Explorer" : "Search"}</span>
      </div>

      {sidebarView === "search" ? (
        <SearchPanel tree={tree} />
      ) : (
        <div className="explorer-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="py-2">
            {isLoading && <p className="px-4 py-2 text-xs text-vscode-muted">Loading files...</p>}
            {error && <p className="px-4 py-2 text-xs text-red-400">Failed to load files</p>}
            {!isLoading && tree.map((node) => <FileTreeItem key={node.path} node={node} />)}
          </div>
        </div>
      )}

      <div className="shrink-0 border-t border-vscode-border px-3 py-2 text-[11px] text-vscode-muted">
        {fileCount} template files
      </div>
    </aside>
  );
}

export { getFileName };
