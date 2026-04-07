import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { addAttempt, fetchQuestions, fetchRoom } from "../lib/firestoreRooms";
import type { QuestionDoc } from "../types";
import { useAuth } from "../context/AuthContext";
import { readStoredNickname } from "./Join";
import styles from "./pages.module.css";

export function Quiz() {
  const { roomId = "" } = useParams();
  const navigate = useNavigate();
  const { ready, user } = useAuth();
  const [questions, setQuestions] = useState<Array<{ id: string; data: QuestionDoc }>>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{
    score: number;
    total: number;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!roomId) return;
      setLoading(true);
      setError(null);
      try {
        const nick = readStoredNickname(roomId);
        if (!nick) {
          navigate("/join", { replace: true });
          return;
        }
        const room = await fetchRoom(roomId);
        if (!room) {
          setError("방을 찾을 수 없습니다.");
          return;
        }
        const qs = await fetchQuestions(roomId);
        if (cancelled) return;
        if (qs.length === 0) {
          setError("문항이 없습니다.");
          return;
        }
        setQuestions(qs);
        setAnswers(Array(qs.length).fill(null));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "불러오기 실패");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [roomId, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!roomId || questions.length === 0) return;
    const nick = readStoredNickname(roomId);
    if (!nick) {
      navigate("/join");
      return;
    }
    if (answers.some((a) => a === null)) {
      setError("모든 문항에 답을 선택하세요.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      if (!user) {
        navigate("/login", { state: { from: { pathname: `/quiz/${roomId}` } } });
        return;
      }
      let score = 0;
      questions.forEach((q, i) => {
        if (answers[i] === q.data.correctIndex) score += 1;
      });
      const total = questions.length;
      await addAttempt({
        roomId,
        nickname: nick,
        uid: user.uid,
        score,
        total,
      });
      setSubmitted({ score, total });
    } catch (err) {
      setError(err instanceof Error ? err.message : "제출에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready || loading) {
    return (
      <main className={styles.main}>
        <p className={styles.muted}>문항을 불러오는 중…</p>
      </main>
    );
  }

  if (error && questions.length === 0) {
    return (
      <main className={styles.main}>
        <p className={styles.error}>{error}</p>
        <p>
          <Link to="/join">입장 화면으로</Link>
        </p>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className={styles.main}>
        <h1 className={styles.title}>제출 완료</h1>
        <p>
          점수: <strong>{submitted.score}</strong> / {submitted.total}
        </p>
        <p className={styles.row}>
          <Link className={styles.btn} to={`/room/${roomId}/leaderboard`}>
            실시간 리더보드
          </Link>
          <Link className={`${styles.btn} ${styles.btnSecondary}`} to="/">
            처음으로
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <p>
        <Link to="/join">← 입장 화면</Link>
      </p>
      <h1 className={styles.title}>퀴즈</h1>
      <p className={styles.muted}>방 코드: {roomId}</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <ol className={styles.quizList}>
          {questions.map((q, qi) => (
            <li key={q.id} className={styles.qBlock}>
              <p className={styles.qText}>
                {qi + 1}. {q.data.text}
              </p>
              <div className={styles.options}>
                {q.data.choices.map((c, ci) => (
                  <label key={ci} className={styles.optionLabel}>
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      checked={answers[qi] === ci}
                      onChange={() => {
                        const next = [...answers];
                        next[qi] = ci;
                        setAnswers(next);
                      }}
                    />
                    <span>{c}</span>
                  </label>
                ))}
              </div>
            </li>
          ))}
        </ol>
        {error && <p className={styles.error}>{error}</p>}
        <button className={styles.btn} type="submit" disabled={submitting}>
          {submitting ? "제출 중…" : "답안 제출"}
        </button>
      </form>
    </main>
  );
}
