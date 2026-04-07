import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { fetchRoom } from "../lib/firestoreRooms";
import { normalizeRoomCode } from "../lib/roomCode";
import { useAuth, persistNickname } from "../context/AuthContext";
import styles from "./pages.module.css";

const nickKey = (roomId: string) => `quiz_nick_${roomId}`;

export function Join() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const c = searchParams.get("code");
    if (c) setCode(normalizeRoomCode(c));
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const roomId = normalizeRoomCode(code);
    const nick = nickname.trim();
    if (!roomId) {
      setError("방 코드를 입력하세요.");
      return;
    }
    if (!nick) {
      setError("닉네임을 입력하세요.");
      return;
    }
    setLoading(true);
    try {
      if (!user) return;
      await persistNickname(user.uid, nick);
      const room = await fetchRoom(roomId);
      if (!room) {
        setError("방을 찾을 수 없습니다. 코드를 확인하세요.");
        return;
      }
      if (room.status !== "open") {
        setError("이 방은 닫혀 있습니다.");
        return;
      }
      sessionStorage.setItem(nickKey(roomId), nick);
      navigate(`/quiz/${roomId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "입장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.main}>
      <p>
        <Link to="/">← 학습자 홈</Link>
      </p>
      <h1 className={styles.title}>방 입장</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.label}>
          방 코드
          <input
            className={styles.input}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="예: ABC12X"
            autoCapitalize="characters"
          />
        </label>
        <label className={styles.label}>
          닉네임
          <input
            className={styles.input}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="순위에 표시될 이름"
            autoComplete="nickname"
          />
        </label>
        {error && <p className={styles.error}>{error}</p>}
        <button className={styles.btn} type="submit" disabled={loading}>
          {loading ? "확인 중…" : "입장"}
        </button>
      </form>
    </main>
  );
}

export function readStoredNickname(roomId: string): string | null {
  return sessionStorage.getItem(nickKey(roomId));
}
