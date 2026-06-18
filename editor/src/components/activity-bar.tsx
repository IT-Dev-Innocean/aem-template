import * as Tooltip from '@radix-ui/react-tooltip';
import {
  ExternalLink,
  Files,
  PanelLeft,
  Search,
  Settings2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditor } from '@/context/editor-context';

const items = [
  { id: 'explorer' as const, icon: Files, label: 'Explorer' },
  { id: 'search' as const, icon: Search, label: 'Search' },
];

export function ActivityBar() {
  const {
    sidebarView,
    setSidebarView,
    sidebarVisible,
    setSidebarVisible,
    previewVisible,
    setPreviewVisible,
    getActiveTab,
  } = useEditor();
  const activeTab = getActiveTab();

  return (
    <Tooltip.Provider delayDuration={300}>
      <aside className='flex w-12 shrink-0 flex-col items-center border-r border-vscode-border bg-vscode-activity py-2'>
        {items.map(({ id, icon: Icon, label }) => (
          <Tooltip.Root key={id}>
            <Tooltip.Trigger asChild>
              <button
                type='button'
                aria-label={label}
                onClick={() => {
                  if (sidebarView === id && sidebarVisible) {
                    setSidebarVisible(false);
                    return;
                  }
                  setSidebarView(id);
                  setSidebarVisible(true);
                }}
                className={cn(
                  'relative mb-1 flex h-10 w-10 items-center justify-center rounded-md text-vscode-muted transition-colors hover:text-vscode-text',
                  sidebarView === id && sidebarVisible && 'text-vscode-text'
                )}>
                {sidebarView === id && sidebarVisible && (
                  <span className='absolute left-0 top-2 h-6 w-0.5 rounded-r bg-vscode-accent' />
                )}
                <Icon size={20} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                side='right'
                className='rounded bg-[#202020] px-2 py-1 text-xs text-vscode-text shadow-lg'>
                {label}
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        ))}

        <div className='mt-auto flex flex-col items-center gap-1'>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                type='button'
                aria-label='Toggle sidebar'
                onClick={() => setSidebarVisible(!sidebarVisible)}
                className='flex h-10 w-10 items-center justify-center rounded-md text-vscode-muted transition-colors hover:text-vscode-text'>
                <PanelLeft size={20} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                side='right'
                className='rounded bg-[#202020] px-2 py-1 text-xs text-vscode-text shadow-lg'>
                Toggle Sidebar
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>

          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                type='button'
                aria-label='Toggle preview'
                onClick={() => setPreviewVisible(!previewVisible)}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:text-vscode-text',
                  previewVisible ? 'text-vscode-text' : 'text-vscode-muted'
                )}>
                <ExternalLink size={20} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                side='right'
                className='rounded bg-[#202020] px-2 py-1 text-xs text-vscode-text shadow-lg'>
                Toggle Preview
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>

          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                type='button'
                aria-label='Settings'
                className='flex h-10 w-10 items-center justify-center rounded-md text-vscode-muted transition-colors hover:text-vscode-text'>
                <Settings2 size={20} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                side='right'
                className='rounded bg-[#202020] px-2 py-1 text-xs text-vscode-text shadow-lg'>
                Settings
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>

        {activeTab && (
          <span className='sr-only'>Active file: {activeTab.path}</span>
        )}
      </aside>
    </Tooltip.Provider>
  );
}
