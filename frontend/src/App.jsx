import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const DatasetPage = lazy(() => import("./pages/DatasetPage"));
const MappingPage = lazy(() => import("./pages/MappingPage"));
const DryRunPage = lazy(() => import("./pages/DryRunPage"));
const MigrationPage = lazy(() => import("./pages/MigrationPage"));
const ReconciliationPage = lazy(() => import("./pages/ReconciliationPage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));

function Loading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial, sans-serif",
        background: "#f8fafc",
        color: "#334155",
      }}
    >
      Loading...
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />

          <Route path="/dataset" element={<DatasetPage />} />

          <Route path="/mapping" element={<MappingPage />} />

          <Route path="/dry-run" element={<DryRunPage />} />

          <Route path="/migration" element={<MigrationPage />} />

          <Route
            path="/reconciliation"
            element={<ReconciliationPage />}
          />

          <Route path="/history" element={<HistoryPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;