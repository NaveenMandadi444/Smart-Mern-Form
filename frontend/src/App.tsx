import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "sonner";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DataVault from "./pages/DataVault";
import FormAssistant from "./pages/FormAssistant";
import { useAuth } from "./hooks/useAuth";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  if (!isAuthenticated) return <Navigate to="/auth" replace />;

  return <>{children}</>;
}

export default function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vault"
          element={
            <ProtectedRoute>
              <DataVault />
            </ProtectedRoute>
          }
        />
        <Route
          path="/form-assist"
          element={
            <ProtectedRoute>
              <FormAssistant />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}
