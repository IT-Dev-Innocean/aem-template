export type EditorTab = {
  path: string;
  content: string;
  originalContent: string;
  isDirty: boolean;
};

export type CursorPosition = {
  line: number;
  column: number;
};

export type SidebarView = "explorer" | "search";

export type PanelView = "editor" | "split" | "preview";
