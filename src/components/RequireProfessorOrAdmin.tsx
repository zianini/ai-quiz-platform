import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProfessorAccess } from "../hooks/useProfessorAccess";
import { isAdminUser } from "../lib/firestoreRoles";
import styles from "../pages/pages.module.css";

/** 교수 허가 또는 관리자 계정만 하위 페이지 접근 */
export function RequireProfessorOrAdmin({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const { accessReady, professorAllowed } = useProfessorAccess();
  const location = useLocation();
  const [adminOk, setAdminOk] = useState<boolean | null>(null);

  useEffect(() => {
    if (!ready || !user) {
      setAdminOk(false);
      return;
    }
    let cancelled = false;
    isAdminUser(user.uid).then((v) => {
      if (!cancelled) setAdminOk(v);
    });
    return () => {
      cancelled = true;
    };
  }, [user, ready]);

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

  if (adminOk === null) {
    return (
      <main className={styles.main}>
        <p className={styles.muted}>권한 확인 중…</p>
      </main>
    );
  }

  if (adminOk) {
    return <>{children}</>;
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
