import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProfessorAccess } from "../hooks/useProfessorAccess";
import styles from "../pages/pages.module.css";

export function RequireProfessor({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const { accessReady, professorAllowed } = useProfessorAccess();
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

  if (!accessReady) {
    return (
      <main className={styles.main}>
        <p className={styles.muted}>권한 확인 중…</p>
      </main>
    );
  }

  if (!professorAllowed) {
    return (
      <main className={styles.main}>
        <h1 className={styles.title}>교수 권한 필요</h1>
        <p className={styles.lead}>
          퀴즈 제작은 관리자가 부여한 교수 계정만 사용할 수 있습니다.
        </p>
        <p className={styles.muted}>
          <Link to="/">학습자 홈으로</Link>
        </p>
      </main>
    );
  }

  return <>{children}</>;
}
