import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { pathFromRedirectState } from "../lib/navigation";
import styles from "./pages.module.css";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, user, ready } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = pathFromRedirectState(location.state);

  if (ready && user) {
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const em = email.trim();
    if (!em || !password) {
      setError("이메일과 비밀번호를 입력하세요.");
      return;
    }
    if (mode === "register") {
      if (password.length < 6) {
        setError("비밀번호는 6자 이상이어야 합니다.");
        return;
      }
      if (password !== password2) {
        setError("비밀번호 확인이 일치하지 않습니다.");
        return;
      }
    }
    setLoading(true);
    try {
      if (mode === "login") {
        await signIn(em, password);
      } else {
        await signUp(em, password);
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "처리에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <main className={styles.main}>
        <p className={styles.muted}>준비 중…</p>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <p>
        <Link to="/">← 처음으로</Link>
      </p>
      <h1 className={styles.title}>{mode === "login" ? "로그인" : "회원가입"}</h1>
      <p className={styles.muted}>Firebase 이메일/비밀번호로 인증합니다.</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.label}>
          이메일
          <input
            className={styles.input}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className={styles.label}>
          비밀번호
          <input
            className={styles.input}
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {mode === "register" && (
          <label className={styles.label}>
            비밀번호 확인
            <input
              className={styles.input}
              type="password"
              autoComplete="new-password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
            />
          </label>
        )}
        {error && <p className={styles.error}>{error}</p>}
        <button className={styles.btn} type="submit" disabled={loading}>
          {loading ? "처리 중…" : mode === "login" ? "로그인" : "가입하기"}
        </button>
      </form>

      <p className={styles.muted}>
        {mode === "login" ? (
          <>
            계정이 없으면{" "}
            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => {
                setMode("register");
                setError(null);
              }}
            >
              회원가입
            </button>
          </>
        ) : (
          <>
            이미 계정이 있으면{" "}
            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => {
                setMode("login");
                setError(null);
              }}
            >
              로그인
            </button>
          </>
        )}
      </p>
    </main>
  );
}
