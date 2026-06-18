import { X } from "lucide-react";
import { useEditor } from "@/context/editor-context";
import { cn, getFileName } from "@/lib/utils";

export function EditorTabs() {
  const { tabs, activeTabPath, setActiveTab, closeTab } = useEditor();

  if (tabs.length === 0) {
    return (
      <div className="flex h-9 items-center border-b border-vscode-border bg-vscode-tab-inactive px-4 text-sm text-vscode-muted">
        No file open
      </div>
    );
  }

  return (
    <div className="flex h-9 overflow-x-auto border-b border-vscode-border bg-vscode-tab-inactive">
      {tabs.map((tab) => {
        const isActive = tab.path === activeTabPath;
        return (
          <div
            key={tab.path}
            className={cn(
              "group flex min-w-[140px] max-w-[220px] items-center border-r border-vscode-border",
              isActive ? "bg-vscode-tab-active" : "bg-vscode-tab-inactive hover:bg-[#323232]",
            )}
          >
            <button
              type="button"
              onClick={() => setActiveTab(tab.path)}
              className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left text-sm"
            >
              <span className="truncate">{getFileName(tab.path)}</span>
              {tab.isDirty && <span className="text-vscode-accent">●</span>}
            </button>
            <button
              type="button"
              aria-label={`Close ${tab.path}`}
              onClick={() => closeTab(tab.path)}
              className="mr-1 rounded p-1 opacity-0 transition-opacity hover:bg-vscode-hover group-hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
