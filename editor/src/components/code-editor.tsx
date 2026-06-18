import Editor, { type OnMount } from "@monaco-editor/react";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import type { editor } from "monaco-editor";
import { useEditor } from "@/context/editor-context";
import { saveFileContent } from "@/lib/file-api";
import { getLanguageFromPath } from "@/lib/utils";

export function CodeEditorPanel() {
  const {
    getActiveTab,
    updateTabContent,
    markTabSaved,
    setCursor,
  } = useEditor();
  const activeTab = getActiveTab();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const saveMutation = useMutation({
    mutationFn: ({ path, content }: { path: string; content: string }) =>
      saveFileContent(path, content),
    onSuccess: (_, variables) => {
      markTabSaved(variables.path, variables.content);
    },
  });

  const handleSave = useCallback(() => {
    if (!activeTab) {
      return;
    }
    saveMutation.mutate({ path: activeTab.path, content: activeTab.content });
  }, [activeTab, saveMutation]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSave]);

  const handleMount: OnMount = (monacoEditor) => {
    editorRef.current = monacoEditor;

    monacoEditor.onDidChangeCursorPosition(({ position }) => {
      setCursor({ line: position.lineNumber, column: position.column });
    });

    monacoEditor.focus();
  };

  if (!activeTab) {
    return (
      <div className="flex h-full items-center justify-center bg-vscode-bg text-sm text-vscode-muted">
        Select a file from the explorer to start editing
      </div>
    );
  }

  return (
    <div className="relative h-full bg-vscode-bg">
      <Editor
        key={activeTab.path}
        height="100%"
        language={getLanguageFromPath(activeTab.path)}
        theme="vs-dark"
        value={activeTab.content}
        onChange={(value) => updateTabContent(activeTab.path, value ?? "")}
        onMount={handleMount}
        options={{
          fontSize: 14,
          fontFamily: '"Cascadia Code", "Fira Code", Consolas, monospace',
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          automaticLayout: true,
          tabSize: 4,
          insertSpaces: true,
          renderWhitespace: "selection",
          smoothScrolling: true,
          cursorBlinking: "smooth",
          padding: { top: 12 },
          lineNumbers: "on",
          folding: true,
          bracketPairColorization: { enabled: true },
        }}
      />
    </div>
  );
}

export function useSaveActiveFile() {
  const { getActiveTab, markTabSaved } = useEditor();

  return useMutation({
    mutationFn: async () => {
      const activeTab = getActiveTab();
      if (!activeTab) {
        throw new Error("No active file");
      }
      await saveFileContent(activeTab.path, activeTab.content);
      return activeTab;
    },
    onSuccess: (activeTab) => {
      markTabSaved(activeTab.path, activeTab.content);
    },
  });
}
