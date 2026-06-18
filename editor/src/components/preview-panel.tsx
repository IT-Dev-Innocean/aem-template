import { ExternalLink, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DotPattern } from '@/components/magic-ui/dot-pattern';
import { ShimmerButton } from '@/components/magic-ui/shimmer-button';
import { useEditor } from '@/context/editor-context';
import { buildPreviewDocument, openPreviewWindow } from '@/lib/preview';
import { getFileName } from '@/lib/utils';

const previewFrameWrapStyle = {
  minWidth: '100%',
  display: 'table',
  height: '100%',
} as const;

export function PreviewPanel() {
  const { getActiveTab } = useEditor();
  const activeTab = getActiveTab();
  const [refreshKey, setRefreshKey] = useState(0);

  const previewDocument = useMemo(() => {
    if (!activeTab) {
      return '';
    }
    return buildPreviewDocument(activeTab.content);
  }, [activeTab, refreshKey]);

  const handleOpenPreview = () => {
    if (!activeTab) {
      return;
    }
    const opened = openPreviewWindow(
      activeTab.content,
      getFileName(activeTab.path)
    );
    if (!opened) {
      window.alert('Popup blocked. Please allow popups for this site.');
    }
  };

  if (!activeTab) {
    return (
      <div className="relative flex h-full items-center justify-center overflow-hidden bg-[#181818] text-sm text-vscode-muted">
        <DotPattern className="text-white/10" />
        <p className="relative z-10">Open an HTML file to preview output</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#181818]">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-vscode-border px-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-vscode-muted">
          <span>Preview</span>
          <span className="text-vscode-text">{getFileName(activeTab.path)}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRefreshKey((value) => value + 1)}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-vscode-text hover:bg-vscode-hover"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <ShimmerButton
            type="button"
            onClick={handleOpenPreview}
            className="h-7 px-2.5 text-xs"
          >
            <ExternalLink size={14} />
            Open Preview
          </ShimmerButton>
        </div>
      </div>

      <div className="preview-panel min-h-0 flex-1 bg-white">
        <div style={previewFrameWrapStyle}>
          <iframe
            key={`${activeTab.path}-${refreshKey}`}
            title={`Preview ${activeTab.path}`}
            srcDoc={previewDocument}
            className="block border-0 bg-white"
            style={{ height: '100%', width: '100%', minHeight: '100%' }}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}
