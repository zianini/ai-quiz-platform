import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAdmin } from "./components/RequireAdmin";
import { EnvSetup } from "./components/EnvSetup";
import { RequireAuth } from "./components/RequireAuth";
import { RequireProfessor } from "./components/RequireProfessor";
import { RequireProfessorOrAdmin } from "./components/RequireProfessorOrAdmin";
import { AuthProvider } from "./context/AuthContext";
import { getMissingEnvironmentKeys } from "./lib/envCheck";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminLogin } from "./pages/AdminLogin";
import { Home } from "./pages/Home";
import { Join } from "./pages/Join";
import { Leaderboard } from "./pages/Leaderboard";
import { Login } from "./pages/Login";
import { Quiz } from "./pages/Quiz";
import { EditQuiz } from "./pages/EditQuiz";
import { MyQuizzes } from "./pages/MyQuizzes";
import { ProfessorLogin } from "./pages/ProfessorLogin";
import { Teacher } from "./pages/Teacher";

function AppRoutes() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/teacher/login" element={<ProfessorLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<Navigate to="/admin/settings" replace />} />
        <Route
          path="/admin/settings"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />
        <Route
          path="/teacher"
          element={
            <RequireAuth>
              <RequireProfessor>
                <Teacher />
              </RequireProfessor>
            </RequireAuth>
          }
        />
        <Route
          path="/teacher/quizzes"
          element={
            <RequireAuth>
              <RequireProfessor>
                <MyQuizzes />
              </RequireProfessor>
            </RequireAuth>
          }
        />
        <Route
          path="/teacher/room/:roomId/edit"
          element={
            <RequireAuth>
              <RequireProfessorOrAdmin>
                <EditQuiz />
              </RequireProfessorOrAdmin>
            </RequireAuth>
          }
        />
        <Route
          path="/join"
          element={
            <RequireAuth>
              <Join />
            </RequireAuth>
          }
        />
        <Route
          path="/quiz/:roomId"
          element={
            <RequireAuth>
              <Quiz />
            </RequireAuth>
          }
        />
        <Route
          path="/room/:roomId/leaderboard"
          element={
            <RequireAuth>
              <Leaderboard />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default function App() {
  const missing = getMissingEnvironmentKeys();
  if (missing.length > 0) {
    return <EnvSetup />;
  }
  return <AppRoutes />;
}
