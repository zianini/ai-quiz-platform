import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAllRooms } from "../lib/firestoreRooms";
import {
  listProfessorGrants,
  setProfessorGrant,
  type ProfessorGrantRow,
} from "../lib/firestoreRoles";
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

export function AdminDashboard() {
  const [rows, setRows] = useState<ProfessorGrantRow[]>([]);
  const [rooms, setRooms] = useState<Array<{ id: string; data: RoomDoc }>>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const list = await listProfessorGrants();
    setRows(list.filter((r) => r.granted));
  }

  async function refreshRooms() {
    const list = await fetchAllRooms(80);
    setRooms(list);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    refresh()
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "목록을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setRoomsLoading(true);
    refreshRooms()
      .catch(() => {
        /* 목록 오류는 별도 표시 */
      })
      .finally(() => {
        if (!cancelled) setRoomsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleGrant(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await setProfessorGrant(emailInput, true);
      setEmailInput("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRevoke(email: string) {
    setError(null);
    setSaving(true);
    try {
      await setProfessorGrant(email, false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "처리에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className={styles.main}>
      <p>
        <Link to="/">← 학습자 홈</Link>
      </p>
      <h1 className={styles.title}>관리자 설정</h1>
      <p className={styles.lead}>
        아래 이메일로 가입한 계정만 &quot;교수자&quot; 메뉴에서 퀴즈를 만들 수 있습니다.
      </p>

      <form className={styles.form} onSubmit={handleGrant}>
        <label className={styles.label}>
          교수로 허가할 이메일
          <input
            className={styles.input}
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="user@school.edu"
          />
        </label>
        {error && <p className={styles.error}>{error}</p>}
        <button className={styles.btn} type="submit" disabled={saving || !emailInput.trim()}>
          {saving ? "처리 중…" : "허가 추가"}
        </button>
      </form>

      <h2 className={styles.subTitle}>허가된 교수 이메일</h2>
      {loading && <p className={styles.muted}>불러오는 중…</p>}
      {!loading && rows.length === 0 && (
        <p className={styles.muted}>아직 허가된 교수가 없습니다.</p>
      )}
      {!loading && rows.length > 0 && (
        <table className={styles.leaderTable}>
          <thead>
            <tr>
              <th>이메일</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <code>{r.email}</code>
                </td>
                <td>
                  <button
                    type="button"
                    className={`${styles.btn} ${styles.btnSecondary}`}
                    disabled={saving}
                    onClick={() => handleRevoke(r.email)}
                  >
                    허가 취소
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 className={styles.subTitle} id="admin-quizzes">
        전체 퀴즈 (수정)
      </h2>
      <p className={styles.muted}>
        교수가 만든 모든 방을 관리자가 수정할 수 있습니다.
      </p>
      {roomsLoading && <p className={styles.muted}>퀴즈 목록 불러오는 중…</p>}
      {!roomsLoading && rooms.length === 0 && (
        <p className={styles.muted}>등록된 퀴즈가 없습니다.</p>
      )}
      {!roomsLoading && rooms.length > 0 && (
        <table className={styles.leaderTable}>
          <thead>
            <tr>
              <th>방 코드</th>
              <th>주제</th>
              <th>상태</th>
              <th>만든 시각</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rooms.map(({ id, data }) => (
              <tr key={id}>
                <td>
                  <code>{id}</code>
                </td>
                <td>{data.topic}</td>
                <td>{data.status === "open" ? "진행 중" : "종료"}</td>
                <td className={styles.muted}>{formatDate(data.createdAt)}</td>
                <td>
                  <Link className={styles.btn} to={`/teacher/room/${id}/edit`}>
                    수정
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
