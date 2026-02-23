import type { JSX } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { CrossCulturalPage } from "./pages/CrossCulturalPage";
import { ImageInputPage } from "./pages/ImageInputPage";
import { RedesignPage } from "./pages/RedesignPage";
import { WorkspaceLayout } from "./pages/WorkspaceLayout";

function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<WorkspaceLayout />}>
        <Route index element={<Navigate to="/image-input" replace />} />
        <Route path="image-input" element={<ImageInputPage />} />
        <Route path="cross-cultural" element={<CrossCulturalPage />} />
        <Route path="redesign" element={<RedesignPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/image-input" replace />} />
    </Routes>
  );
}

export default App;
