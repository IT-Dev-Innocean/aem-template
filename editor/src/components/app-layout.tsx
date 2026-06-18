import { ActivityBar } from "@/components/activity-bar";
import { CodeEditorPanel } from "@/components/code-editor";
import { EditorTabs } from "@/components/editor-tabs";
import { PreviewPanel } from "@/components/preview-panel";
import { Sidebar } from "@/components/sidebar";
import { StatusBar } from "@/components/status-bar";
import { useEditor } from "@/context/editor-context";
import { cn, getFileName } from "@/lib/utils";

export function AppLayout() {
  const { sidebarVisible, previewVisible, panelView, getActiveTab } = useEditor();
  const activeTab = getActiveTab();

  const showEditor = panelView !== "preview";
  const showPreview = previewVisible && panelView !== "editor";

  return (
    <div className="flex h-full flex-col bg-vscode-bg text-vscode-text">
      <header className="flex h-10 shrink-0 items-center justify-between border-b border-vscode-border bg-[#323233] px-4 text-sm">
        <div className="flex items-center gap-2 text-vscode-muted">
          <span className="text-vscode-text">AEM Template</span>
          <span>/</span>
          <span>{activeTab ? getFileName(activeTab.path) : "Welcome"}</span>
        </div>
        <div className="text-xs text-vscode-muted">VS Code Theme · Monaco Editor</div>
      </header>

      <div className="flex min-h-0 flex-1">
        <ActivityBar />
        {sidebarVisible && <Sidebar />}

        <main className="flex min-w-0 flex-1 flex-col">
          <EditorTabs />

          {activeTab && (
            <div className="border-b border-vscode-border px-4 py-1 text-xs text-vscode-muted">
              aem-template / {activeTab.path.replace(/\//g, " / ")}
            </div>
          )}

          <div className="grid min-h-0 flex-1" style={{
            gridTemplateColumns: showEditor && showPreview ? "1fr 1fr" : "1fr",
          }}>
            {showEditor && (
              <section className={cn("min-h-0 min-w-0 border-r border-vscode-border", !showPreview && "border-r-0")}>
                <CodeEditorPanel />
              </section>
            )}
            {showPreview && (
              <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
                <PreviewPanel />
              </section>
            )}
          </div>
        </main>
      </div>

      <StatusBar />
    </div>
  );
}
