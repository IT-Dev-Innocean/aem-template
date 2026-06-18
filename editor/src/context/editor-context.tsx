import { createContext, useContext } from "react";
import type { CursorPosition, EditorTab, PanelView, SidebarView } from "@/types/editor";

export type EditorContextValue = {
  tabs: EditorTab[];
  activeTabPath: string | null;
  sidebarView: SidebarView;
  panelView: PanelView;
  sidebarVisible: boolean;
  previewVisible: boolean;
  cursor: CursorPosition;
  searchQuery: string;
  setSidebarView: (view: SidebarView) => void;
  setPanelView: (view: PanelView) => void;
  setSidebarVisible: (visible: boolean) => void;
  setPreviewVisible: (visible: boolean) => void;
  setSearchQuery: (query: string) => void;
  setCursor: (cursor: CursorPosition) => void;
  openFile: (path: string, content: string) => void;
  closeTab: (path: string) => void;
  setActiveTab: (path: string) => void;
  updateTabContent: (path: string, content: string) => void;
  markTabSaved: (path: string, content: string) => void;
  getActiveTab: () => EditorTab | null;
};

export const EditorContext = createContext<EditorContextValue | null>(null);

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditor must be used within EditorProvider");
  }
  return context;
}
