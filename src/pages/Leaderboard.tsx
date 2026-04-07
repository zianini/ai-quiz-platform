import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchRoom, subscribeLeaderboard } from "../lib/firestoreRooms";
import type { AttemptDoc } from "../types";
import styles from "./pages.module.css";

export function Leaderboard() {
  const { roomId = "" } = useParams();
  const [topic, setTopic] = useState<string | null>(null);
  const [rows, setRows] = useState<Array<{ id: string; data: AttemptDoc }>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;
    let unsub: (() => void) | undefined;
    fetchRoom(roomId).then((r) => {
      if (r) setTopic(r.topic);
    });
    try {
      unsub = subscribeLeaderboard(
        roomId,
        50,
        (r) => setRows(r),
        (e) => setError(e.message),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "구독 실패");
    }
    return () => {
      unsub?.();
    };
  }, [roomId]);

  return (
    <main className={styles.main}>
      <p>
        <Link to="/">← 처음으로</Link>
      </p>
      <h1 className={styles.title}>실시간 리더보드</h1>
      {topic && <p className={styles.muted}>주제: {topic}</p>}
      <p className={styles.muted}>방 코드: {roomId}</p>

      {error && <p className={styles.error}>{error}</p>}

      <table className={styles.leaderTable}>
        <thead>
          <tr>
            <th>순위</th>
            <th>닉네임</th>
            <th>점수</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={3} className={styles.muted}>
                아직 제출 기록이 없습니다.
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={row.id}>
                <td>{i + 1}</td>
                <td>{row.data.nickname}</td>
                <td>
                  {row.data.score} / {row.data.total}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </main>
  );
}
