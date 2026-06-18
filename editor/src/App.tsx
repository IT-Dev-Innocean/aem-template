import { AppLayout } from "@/components/app-layout";
import { EditorProvider } from "@/context/editor-provider";

function App() {
  return (
    <EditorProvider>
      <AppLayout />
    </EditorProvider>
  );
}

export default App;
