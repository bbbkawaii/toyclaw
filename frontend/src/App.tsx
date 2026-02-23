import { Suspense, lazy, type JSX } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { LoadingPulse } from "./shared/ui/LoadingPulse";

const WorkspaceLayout = lazy(() =>
  import("./pages/WorkspaceLayout").then((module) => ({ default: module.WorkspaceLayout })),
);
const ImageInputPage = lazy(() =>
  import("./pages/ImageInputPage").then((module) => ({ default: module.ImageInputPage })),
);
const CrossCulturalPage = lazy(() =>
  import("./pages/CrossCulturalPage").then((module) => ({ default: module.CrossCulturalPage })),
);
const RedesignPage = lazy(() =>
  import("./pages/RedesignPage").then((module) => ({ default: module.RedesignPage })),
);

function RouteFallback(): JSX.Element {
  return (
    <div style={{ padding: "24px" }}>
      <LoadingPulse label="页面加载中..." />
    </div>
  );
}

function App(): JSX.Element {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<WorkspaceLayout />}>
          <Route index element={<Navigate to="/image-input" replace />} />
          <Route path="image-input" element={<ImageInputPage />} />
          <Route path="cross-cultural" element={<CrossCulturalPage />} />
          <Route path="redesign" element={<RedesignPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/image-input" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
