import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchQuestions, fetchRoom, saveQuizEdits } from "../lib/firestoreRooms";
import { isAdminUser } from "../lib/firestoreRoles";
import { useAuth } from "../context/AuthContext";
import type { QuestionDoc, RoomStatus } from "../types";
import styles from "./pages.module.css";

type EditableQuestion = {
  id: string;
  text: string;
  choices: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
};

function toEditable(
  rows: Array<{ id: string; data: QuestionDoc }>,
): EditableQuestion[] {
  return rows.map((r) => ({
    id: r.id,
    text: r.data.text,
    choices: [...r.data.choices] as [string, string, string, string],
    correctIndex: r.data.correctIndex,
  }));
}

function validateQuestions(items: EditableQuestion[]): string | null {
  for (let i = 0; i < items.length; i++) {
    const q = items[i]!;
    if (!q.text.trim()) return `문항 ${i + 1}: 문제를 입력하세요.`;
    for (let c = 0; c < 4; c++) {
      if (!q.choices[c]!.trim()) return `문항 ${i + 1}: 선택지 ${c + 1}을 입력하세요.`;
    }
  }
  return null;
}

export function EditQuiz() {
  const { roomId = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadOk, setLoadOk] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("보통");
  const [professorNickname, setProfessorNickname] = useState("");
  const [status, setStatus] = useState<RoomStatus>("open");
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!roomId || !user) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const admin = await isAdminUser(user.uid);
        if (cancelled) return;
        setIsAdmin(admin);
        const room = await fetchRoom(roomId);
        if (cancelled) return;
        if (!room) {
          setError("방을 찾을 수 없습니다.");
          return;
        }
        if (room.creatorUid !== user.uid && !admin) {
          setError("이 퀴즈를 수정할 권한이 없습니다.");
          return;
        }
        setTopic(room.topic);
        setDifficulty(room.difficulty);
        setProfessorNickname(room.professorNickname);
        setStatus(room.status);
        const qs = await fetchQuestions(roomId);
        if (cancelled) return;
        setQuestions(toEditable(qs));
        setLoadOk(true);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "불러오기 실패");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roomId, user]);

  function updateChoice(qIndex: number, choiceIndex: number, value: string) {
    setQuestions((prev) => {
      const next = [...prev];
      const q = { ...next[qIndex]! };
      const ch = [...q.choices] as [string, string, string, string];
      ch[choiceIndex] = value;
      q.choices = ch;
      next[qIndex] = q;
      return next;
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    setError(null);
    const v = validateQuestions(questions);
    if (v) {
      setError(v);
      return;
    }
    if (!roomId || !user) return;
    setSaving(true);
    try {
      const roomSnap = await fetchRoom(roomId);
      const admin = await isAdminUser(user.uid);
      if (!roomSnap || (roomSnap.creatorUid !== user.uid && !admin)) {
        setError("권한이 없거나 방이 삭제되었습니다.");
        return;
      }
      const payload = questions.map((q, order) => ({
        id: q.id,
        data: {
          order,
          text: q.text.trim(),
          choices: q.choices.map((c) => c.trim()) as [string, string, string, string],
          correctIndex: q.correctIndex,
        },
      }));
      await saveQuizEdits({
        roomId,
        roomPatch: {
          topic: topic.trim(),
          difficulty,
          professorNickname: professorNickname.trim(),
          status,
        },
        questions: payload,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className={styles.main}>
        <p className={styles.muted}>불러오는 중…</p>
      </main>
    );
  }

  if (!loading && !loadOk && error) {
    return (
      <main className={styles.main}>
        <p className={styles.error}>{error}</p>
        <p className={styles.row}>
          <Link to="/">학습자 홈</Link>
          {isAdmin ? (
            <Link to="/admin/settings">관리자 설정</Link>
          ) : (
            <Link to="/teacher/quizzes">내 퀴즈 목록</Link>
          )}
        </p>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <p className={styles.row}>
        <Link to="/">← 학습자 홈</Link>
        {isAdmin ? (
          <Link to="/admin/settings">관리자 설정</Link>
        ) : (
          <Link to="/teacher/quizzes">내 퀴즈 목록</Link>
        )}
        <span className={styles.muted}>
          방 코드: <code>{roomId}</code>
        </span>
      </p>
      <h1 className={styles.title}>퀴즈 수정</h1>

      <form className={styles.form} onSubmit={handleSave}>
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>방 정보</legend>
          <label className={styles.label}>
            주제
            <input
              className={styles.input}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
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
            교수자 표시 이름
            <input
              className={styles.input}
              value={professorNickname}
              onChange={(e) => setProfessorNickname(e.target.value)}
              required
            />
          </label>
          <label className={styles.label}>
            상태
            <select
              className={styles.select}
              value={status}
              onChange={(e) => setStatus(e.target.value as RoomStatus)}
            >
              <option value="open">진행 중 (학습자 입장 가능)</option>
              <option value="closed">종료 (입장 불가)</option>
            </select>
          </label>
        </fieldset>

        <h2 className={styles.subTitle}>문항 ({questions.length})</h2>
        {questions.map((q, qi) => (
          <fieldset key={q.id} className={styles.fieldset}>
            <legend className={styles.legend}>문항 {qi + 1}</legend>
            <label className={styles.label}>
              문제
              <textarea
                className={styles.textarea}
                value={q.text}
                onChange={(e) => {
                  const v = e.target.value;
                  setQuestions((prev) => {
                    const n = [...prev];
                    n[qi] = { ...n[qi]!, text: v };
                    return n;
                  });
                }}
                rows={3}
                required
              />
            </label>
            {[0, 1, 2, 3].map((ci) => (
              <label key={ci} className={styles.label}>
                선택지 {ci + 1}
                <input
                  className={styles.input}
                  value={q.choices[ci]}
                  onChange={(e) => updateChoice(qi, ci, e.target.value)}
                  required
                />
              </label>
            ))}
            <label className={styles.label}>
              정답
              <select
                className={styles.select}
                value={q.correctIndex}
                onChange={(e) => {
                  const idx = Number(e.target.value) as 0 | 1 | 2 | 3;
                  setQuestions((prev) => {
                    const n = [...prev];
                    n[qi] = { ...n[qi]!, correctIndex: idx };
                    return n;
                  });
                }}
              >
                <option value={0}>1번</option>
                <option value={1}>2번</option>
                <option value={2}>3번</option>
                <option value={3}>4번</option>
              </select>
            </label>
          </fieldset>
        ))}

        {error && <p className={styles.error}>{error}</p>}
        {saved && <p className={styles.successInline}>저장했습니다.</p>}

        <div className={styles.row}>
          <button className={styles.btn} type="submit" disabled={saving}>
            {saving ? "저장 중…" : "변경 사항 저장"}
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={() => navigate(`/room/${roomId}/leaderboard`)}
          >
            리더보드
          </button>
        </div>
      </form>
    </main>
  );
}
