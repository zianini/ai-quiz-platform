import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isAdminUser } from "../lib/firestoreRoles";
import styles from "../pages/pages.module.css";

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
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
    return (
      <Navigate to="/admin/login" state={{ from: location }} replace />
    );
  }

  if (adminOk === null) {
    return (
      <main className={styles.main}>
        <p className={styles.muted}>권한 확인 중…</p>
      </main>
    );
  }

  if (!adminOk) {
    return (
      <main className={styles.main}>
        <h1 className={styles.title}>관리자 전용</h1>
        <p className={styles.lead}>이 페이지는 관리자만 이용할 수 있습니다.</p>
        <p className={styles.muted}>
          <Link to="/">처음으로</Link>
        </p>
      </main>
    );
  }

  return <>{children}</>;
}
