import { Columns2, ExternalLink, LayoutPanelTop, Save } from "lucide-react";
import { ShimmerButton } from "@/components/magic-ui/shimmer-button";
import { useSaveActiveFile } from "@/components/code-editor";
import { useEditor } from "@/context/editor-context";
import { openPreviewWindow } from "@/lib/preview";
import { cn, getFileName, getLanguageFromPath } from "@/lib/utils";

export function StatusBar() {
  const {
    cursor,
    getActiveTab,
    panelView,
    setPanelView,
    previewVisible,
    setPreviewVisible,
  } = useEditor();
  const activeTab = getActiveTab();
  const saveMutation = useSaveActiveFile();

  const handleOpenPreview = () => {
    if (!activeTab) {
      return;
    }
    const opened = openPreviewWindow(activeTab.content, getFileName(activeTab.path));
    if (!opened) {
      window.alert("Popup blocked. Please allow popups for this site.");
    }
  };

  return (
    <footer className="flex h-6 shrink-0 items-center justify-between bg-vscode-status px-2 text-[12px] text-white">
      <div className="flex items-center gap-3">
        <span>AEM Template Editor</span>
        {activeTab?.isDirty && <span>Unsaved changes</span>}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setPanelView("editor")}
          className={cn(
            "inline-flex items-center gap-1 rounded px-2 py-0.5 hover:bg-white/10",
            panelView === "editor" && "bg-white/15",
          )}
        >
          <LayoutPanelTop size={12} />
          Editor
        </button>
        <button
          type="button"
          onClick={() => {
            setPanelView("split");
            setPreviewVisible(true);
          }}
          className={cn(
            "inline-flex items-center gap-1 rounded px-2 py-0.5 hover:bg-white/10",
            panelView === "split" && previewVisible && "bg-white/15",
          )}
        >
          <Columns2 size={12} />
          Split
        </button>
        <button
          type="button"
          onClick={() => {
            setPanelView("preview");
            setPreviewVisible(true);
          }}
          className={cn(
            "inline-flex items-center gap-1 rounded px-2 py-0.5 hover:bg-white/10",
            panelView === "preview" && previewVisible && "bg-white/15",
          )}
        >
          Preview
        </button>
        <ShimmerButton
          type="button"
          onClick={handleOpenPreview}
          disabled={!activeTab}
          className="ml-2 h-5 rounded px-2 text-[11px]"
        >
          <ExternalLink size={12} />
          Open Preview
        </ShimmerButton>
        <button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={!activeTab || saveMutation.isPending}
          className="ml-2 inline-flex items-center gap-1 rounded px-2 py-0.5 hover:bg-white/10 disabled:opacity-50"
        >
          <Save size={12} />
          Save
        </button>
      </div>

      <div className="flex items-center gap-4">
        <span>
          Ln {cursor.line}, Col {cursor.column}
        </span>
        <span>Spaces: 4</span>
        <span>UTF-8</span>
        <span>LF</span>
        <span>{activeTab ? getLanguageFromPath(activeTab.path).toUpperCase() : "Plain Text"}</span>
      </div>
    </footer>
  );
}
