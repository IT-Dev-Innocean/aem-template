import { useCallback, useMemo, useState, type ReactNode } from "react";
import { EditorContext, type EditorContextValue } from "@/context/editor-context";
import type { CursorPosition, EditorTab, PanelView, SidebarView } from "@/types/editor";

export function EditorProvider({ children }: { children: ReactNode }) {
  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeTabPath, setActiveTabPath] = useState<string | null>(null);
  const [sidebarView, setSidebarView] = useState<SidebarView>("explorer");
  const [panelView, setPanelView] = useState<PanelView>("split");
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [previewVisible, setPreviewVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [cursor, setCursor] = useState<CursorPosition>({ line: 1, column: 1 });

  const openFile = useCallback((path: string, content: string) => {
    setTabs((current) => {
      const existing = current.find((tab) => tab.path === path);
      if (existing) {
        return current;
      }
      return [
        ...current,
        {
          path,
          content,
          originalContent: content,
          isDirty: false,
        },
      ];
    });
    setActiveTabPath(path);
  }, []);

  const closeTab = useCallback((path: string) => {
    setTabs((current) => {
      const nextTabs = current.filter((tab) => tab.path !== path);
      setActiveTabPath((active) => {
        if (active !== path) {
          return active;
        }
        const closedIndex = current.findIndex((tab) => tab.path === path);
        const fallback = nextTabs[closedIndex] ?? nextTabs[closedIndex - 1] ?? null;
        return fallback?.path ?? null;
      });
      return nextTabs;
    });
  }, []);

  const setActiveTab = useCallback((path: string) => {
    setActiveTabPath(path);
  }, []);

  const updateTabContent = useCallback((path: string, content: string) => {
    setTabs((current) =>
      current.map((tab) =>
        tab.path === path
          ? {
              ...tab,
              content,
              isDirty: content !== tab.originalContent,
            }
          : tab,
      ),
    );
  }, []);

  const markTabSaved = useCallback((path: string, content: string) => {
    setTabs((current) =>
      current.map((tab) =>
        tab.path === path
          ? {
              ...tab,
              content,
              originalContent: content,
              isDirty: false,
            }
          : tab,
      ),
    );
  }, []);

  const getActiveTab = useCallback(() => {
    return tabs.find((tab) => tab.path === activeTabPath) ?? null;
  }, [tabs, activeTabPath]);

  const value = useMemo<EditorContextValue>(
    () => ({
      tabs,
      activeTabPath,
      sidebarView,
      panelView,
      sidebarVisible,
      previewVisible,
      cursor,
      searchQuery,
      setSidebarView,
      setPanelView,
      setSidebarVisible,
      setPreviewVisible,
      setSearchQuery,
      setCursor,
      openFile,
      closeTab,
      setActiveTab,
      updateTabContent,
      markTabSaved,
      getActiveTab,
    }),
    [
      tabs,
      activeTabPath,
      sidebarView,
      panelView,
      sidebarVisible,
      previewVisible,
      cursor,
      searchQuery,
      openFile,
      closeTab,
      setActiveTab,
      updateTabContent,
      markTabSaved,
      getActiveTab,
    ],
  );

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}
