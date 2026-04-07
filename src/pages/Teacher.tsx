import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { generateQuizQuestions } from "../lib/gemini";
import {
  createRoomWithQuestions,
  fetchRoomsByCreator,
  roomExists,
} from "../lib/firestoreRooms";
import { generateRoomCode } from "../lib/roomCode";
import { useAuth, persistNickname } from "../context/AuthContext";
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

export function Teacher() {
  const { user } = useAuth();
  const [myRooms, setMyRooms] = useState<Array<{ id: string; data: RoomDoc }>>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [nickname, setNickname] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("보통");
  const [questionCount, setQuestionCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setRoomsLoading(true);
    fetchRoomsByCreator(user.uid, 30)
      .then((list) => {
        if (!cancelled) setMyRooms(list);
      })
      .finally(() => {
        if (!cancelled) setRoomsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const nick = nickname.trim();
    if (!nick) {
      setError("닉네임을 입력하세요.");
      return;
    }
    if (!topic.trim()) {
      setError("주제를 입력하세요.");
      return;
    }
    setLoading(true);
    try {
      if (!user) return;
      await persistNickname(user.uid, nick);

      const questions = await generateQuizQuestions({
        topic: topic.trim(),
        difficulty,
        questionCount,
      });

      let roomId = generateRoomCode(6);
      for (let i = 0; i < 5; i++) {
        if (!(await roomExists(roomId))) break;
        roomId = generateRoomCode(6);
      }

      const room: Omit<RoomDoc, "createdAt"> = {
        topic: topic.trim(),
        difficulty,
        questionCount,
        creatorUid: user.uid,
        professorNickname: nick,
        status: "open",
      };

      await createRoomWithQuestions({ roomId, room, questions });
      setCreatedCode(roomId);
      const list = await fetchRoomsByCreator(user.uid, 30);
      setMyRooms(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "퀴즈 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.main}>
      <p className={styles.row}>
        <Link to="/">← 학습자 홈</Link>
        <Link to="/teacher/quizzes">전체 목록</Link>
      </p>
      <h1 className={styles.title}>교수자 · 퀴즈 만들기</h1>

      <h2 className={styles.subTitle}>내가 만든 퀴즈</h2>
      {roomsLoading && <p className={styles.muted}>불러오는 중…</p>}
      {!roomsLoading && myRooms.length === 0 && (
        <p className={styles.muted}>아직 만든 퀴즈가 없습니다. 아래에서 새로 만들 수 있습니다.</p>
      )}
      {!roomsLoading && myRooms.length > 0 && (
        <ul className={styles.quizAdminList}>
          {myRooms.map(({ id, data }) => (
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
                <Link
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  to={`/room/${id}/leaderboard`}
                >
                  리더보드
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.sectionBlock}>
        <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.label}>
          닉네임
          <input
            className={styles.input}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="표시될 이름"
            autoComplete="nickname"
          />
        </label>
        <label className={styles.label}>
          주제
          <input
            className={styles.input}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="예: 자료구조 — 이진 탐색 트리"
          />
        </label>
        <label className={styles.label}>
          난이도
          <select
            className={styles.select}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="쉬움">쉬움</option>
            <option value="보통">보통</option>
            <option value="어려움">어려움</option>
          </select>
        </label>
        <label className={styles.label}>
          문항 수
          <input
            className={styles.input}
            type="number"
            min={1}
            max={20}
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
          />
        </label>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.row}>
          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? "생성 중…" : "AI로 퀴즈 생성"}
          </button>
        </div>
      </form>
      </div>

      {createdCode && (
        <div className={styles.successBox}>
          <p>
            <strong>방 코드:</strong> <code>{createdCode}</code>
          </p>
          <p className={styles.muted}>
            학습자에게 코드를 알려 주세요. 리더보드:{" "}
            <Link to={`/room/${createdCode}/leaderboard`}>
              /room/{createdCode}/leaderboard
            </Link>
          </p>
        </div>
      )}
    </main>
  );
}
