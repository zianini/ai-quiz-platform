import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchRoomsByCreator } from "../lib/firestoreRooms";
import { useAuth } from "../context/AuthContext";
import type { RoomDoc } from "../types";
import styles from "./pages.module.css";

function formatDate(ts: { toDate?: () => Date } | null | undefined): string {
  if (!ts || typeof ts.toDate !== "function") return "—";
  try {
    return ts.toDate().toLocaleString("ko-KR");
  } catch {
    return "—";
  }
}

export function MyQuizzes() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Array<{ id: string; data: RoomDoc }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchRoomsByCreator(user.uid)
      .then((list) => {
        if (!cancelled) setRows(list);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "목록을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <main className={styles.main}>
      <p className={styles.row}>
        <Link to="/">← 학습자 홈</Link>
        <Link to="/teacher">퀴즈 만들기</Link>
      </p>
      <h1 className={styles.title}>내가 만든 퀴즈</h1>
      <p className={styles.muted}>방 코드를 눌러 수정하거나, 리더보드를 열 수 있습니다.</p>

      {loading && <p className={styles.muted}>불러오는 중…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && !error && rows.length === 0 && (
        <p className={styles.muted}>아직 만든 퀴즈가 없습니다.</p>
      )}

      {!loading && rows.length > 0 && (
        <ul className={styles.quizAdminList}>
          {rows.map(({ id, data }) => (
            <li key={id} className={styles.quizAdminCard}>
              <div className={styles.quizAdminHead}>
                <code className={styles.roomCode}>{id}</code>
                <span className={styles.statusPill} data-status={data.status}>
                  {data.status === "open" ? "진행 중" : "종료"}
                </span>
              </div>
              <p className={styles.quizAdminTopic}>{data.topic}</p>
              <p className={styles.quizAdminMeta}>
                난이도 {data.difficulty} · 문항 {data.questionCount} · {formatDate(data.createdAt)}
              </p>
              <div className={styles.quizAdminActions}>
                <Link className={styles.btn} to={`/teacher/room/${id}/edit`}>
                  수정
                </Link>
                <Link className={`${styles.btn} ${styles.btnSecondary}`} to={`/room/${id}/leaderboard`}>
                  리더보드
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
