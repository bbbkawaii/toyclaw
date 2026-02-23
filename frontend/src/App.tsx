import { Suspense, lazy, type JSX } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { LoadingPulse } from "./shared/ui/LoadingPulse";

const WorkspaceLayout = lazy(() =>
  import("./pages/WorkspaceLayout").then((module) => ({ default: module.WorkspaceLayout })),
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
        <Route path="/" element={<WorkspaceLayout />} />
        <Route path="/image-input" element={<Navigate to="/" replace />} />
        <Route path="/cross-cultural" element={<Navigate to="/" replace />} />
        <Route path="/redesign" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
