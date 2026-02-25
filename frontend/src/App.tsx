import { Suspense, lazy, type JSX } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

const LandingPage = lazy(() =>
  import("./pages/LandingPage").then((m) => ({ default: m.LandingPage })),
);
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const WorkflowLayout = lazy(() =>
  import("./pages/WorkflowLayout").then((m) => ({ default: m.WorkflowLayout })),
);
const Step1UploadPage = lazy(() =>
  import("./pages/workflow/Step1UploadPage").then((m) => ({ default: m.Step1UploadPage })),
);
const Step2MarketPage = lazy(() =>
  import("./pages/workflow/Step2MarketPage").then((m) => ({ default: m.Step2MarketPage })),
);
const Step3GeneratePage = lazy(() =>
  import("./pages/workflow/Step3GeneratePage").then((m) => ({ default: m.Step3GeneratePage })),
);
const ProjectDetailPage = lazy(() =>
  import("./pages/ProjectDetailPage").then((m) => ({ default: m.ProjectDetailPage })),
);

function RouteFallback(): JSX.Element {
  return (
    <div className="min-h-screen mesh-gradient flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-toy-secondary text-sm">页面加载中...</p>
      </div>
    </div>
  );
}

function App(): JSX.Element {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<Navigate to="/workflow/step1" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/workflow" element={<WorkflowLayout />}>
          <Route index element={<Navigate to="step1" replace />} />
          <Route path="step1" element={<Step1UploadPage />} />
          <Route path="step2" element={<Step2MarketPage />} />
          <Route path="step3" element={<Step3GeneratePage />} />
        </Route>
        <Route path="/project/:id" element={<ProjectDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
