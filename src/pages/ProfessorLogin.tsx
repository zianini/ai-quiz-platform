import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getFirebaseAuth } from "../lib/firebase";
import { isProfessorApproved } from "../lib/firestoreRoles";
import { pathFromRedirectState } from "../lib/navigation";
import styles from "./pages.module.css";

export function ProfessorLogin() {
  const { signIn, user, ready, signOutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const nextPath =
    searchParams.get("redirect") || pathFromRedirectState(location.state) || "/teacher";

  useEffect(() => {
    if (!ready || !user) return;
    let cancelled = false;
    setChecking(true);
    isProfessorApproved(user.email).then((ok) => {
      if (cancelled) return;
      setChecking(false);
      if (ok) navigate(nextPath, { replace: true });
    });
    return () => {
      cancelled = true;
    };
  }, [ready, user, navigate, nextPath]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const em = email.trim();
    if (!em || !password) {
      setError("이메일과 비밀번호를 입력하세요.");
      return;
    }
    setLoading(true);
    try {
      await signIn(em, password);
      const current = getFirebaseAuth().currentUser;
      const mail = current?.email;
      if (!mail || !(await isProfessorApproved(mail))) {
        await signOutUser();
        setError("교수로 허가된 계정이 아닙니다. 관리자에게 문의하세요.");
        return;
      }
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogoutOther() {
    setError(null);
    await signOutUser();
  }

  if (!ready) {
    return (
      <main className={styles.main}>
        <p className={styles.muted}>준비 중…</p>
      </main>
    );
  }

  if (user && checking) {
    return (
      <main className={styles.main}>
        <p className={styles.muted}>권한 확인 중…</p>
      </main>
    );
  }

  if (user && !checking) {
    return (
      <main className={styles.main}>
        <h1 className={styles.title}>교수자 로그인</h1>
        <p className={styles.error}>
          현재 로그인한 계정은 교수로 허가되지 않았습니다. 허가된 계정으로 다시 로그인하세요.
        </p>
        <button type="button" className={styles.btn} onClick={handleLogoutOther}>
          로그아웃
        </button>
        <p className={styles.muted}>
          <Link to="/">학습자 홈으로</Link>
        </p>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <p>
        <Link to="/">← 학습자 홈</Link>
      </p>
      <h1 className={styles.title}>교수자 로그인</h1>
      <p className={styles.muted}>
        관리자가 허가한 이메일로 가입한 계정만 퀴즈를 만들 수 있습니다.
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.label}>
          이메일
          <input
            className={styles.input}
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className={styles.label}>
          비밀번호
          <input
            className={styles.input}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className={styles.error}>{error}</p>}
        <button className={styles.btn} type="submit" disabled={loading}>
          {loading ? "처리 중…" : "교수자로 로그인"}
        </button>
      </form>
    </main>
  );
}
