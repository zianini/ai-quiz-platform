import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "../pages/pages.module.css";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <main className={styles.main}>
        <p className={styles.muted}>준비 중…</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
