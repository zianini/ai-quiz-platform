import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchOpenRooms } from "../lib/firestoreRooms";
import { useAuth } from "../context/AuthContext";
import { useProfessorAccess } from "../hooks/useProfessorAccess";
import { isAdminUser } from "../lib/firestoreRoles";
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

export function Home() {
  const navigate = useNavigate();
  const { user, ready, signOutUser } = useAuth();
  const { accessReady, professorAllowed } = useProfessorAccess();
  const [openRooms, setOpenRooms] = useState<Array<{ id: string; data: RoomDoc }>>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminReady, setAdminReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!ready || !user) {
      setAdminReady(true);
      return;
    }
    isAdminUser(user.uid).then((v) => {
      if (!cancelled) {
        setIsAdmin(v);
        setAdminReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user, ready]);

  useEffect(() => {
    let cancelled = false;
    setListLoading(true);
    setListError(null);
    fetchOpenRooms(40)
      .then((rows) => {
        if (!cancelled) setOpenRooms(rows);
      })
      .catch((e) => {
        if (!cancelled) setListError(e instanceof Error ? e.message : "목록을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    await signOutUser();
  }

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>학습자 · 퀴즈 입장</h1>

      {ready && user && (
        <p className={styles.muted}>
          <strong>{user.email}</strong>
          {" · "}
          <button type="button" className={styles.linkBtn} onClick={handleLogout}>
            로그아웃
          </button>
        </p>
      )}

      <p className={styles.lead}>
        공개된 퀴즈를 고르거나 방 코드를 입력해 응시할 수 있습니다. (응시·순위 확인은 로그인 필요)
      </p>

      <section className={styles.sectionBlock}>
        <h2 className={styles.subTitle}>공개된 퀴즈</h2>
        {listLoading && <p className={styles.muted}>목록 불러오는 중…</p>}
        {listError && <p className={styles.error}>{listError}</p>}
        {!listLoading && !listError && openRooms.length === 0 && (
          <p className={styles.muted}>진행 중인 공개 퀴즈가 없습니다.</p>
        )}
        {!listLoading && openRooms.length > 0 && (
          <ul className={styles.openQuizList}>
            {openRooms.map(({ id, data }) => (
              <li key={id} className={styles.openQuizCard}>
                <div className={styles.openQuizHead}>
                  <code className={styles.roomCode}>{id}</code>
                  <span className={styles.openQuizNick}>{data.professorNickname}</span>
                </div>
                <p className={styles.openQuizTopic}>{data.topic}</p>
                <p className={styles.openQuizMeta}>
                  난이도 {data.difficulty} · 문항 {data.questionCount} · {formatDate(data.createdAt)}
                </p>
                <Link className={styles.btn} to={`/join?code=${encodeURIComponent(id)}`}>
                  이 퀴즈로 입장
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.sectionBlock}>
        <h2 className={styles.subTitle}>방 코드로 입장</h2>
        <p className={styles.muted}>코드를 알고 있다면 직접 입력해 입장할 수 있습니다.</p>
        <Link className={`${styles.btn} ${styles.btnSecondary}`} to="/join">
          방 코드 입력하기
        </Link>
      </section>

      {ready && !user && (
        <p className={styles.muted}>
          <Link to="/login">로그인</Link> 또는 <Link to="/login">회원가입</Link> 후 입장·응시할 수
          있습니다.
        </p>
      )}

      <footer className={styles.footerLinks}>
        <p className={styles.muted}>관리·제작</p>
        <div className={styles.footerRow}>
          {ready && accessReady && professorAllowed && (
            <>
              <Link to="/teacher">교수자 · 퀴즈 만들기</Link>
              <span aria-hidden="true">·</span>
              <Link to="/teacher/quizzes">내가 만든 퀴즈</Link>
              <span aria-hidden="true">·</span>
            </>
          )}
          {ready && accessReady && !professorAllowed && user && (
            <span className={styles.muted}>교수 제작은 관리자 허가 후 이용 가능</span>
          )}
          <div className={styles.footerBtnGroup}>
            {!user ? (
              <>
                <button
                  type="button"
                  className={styles.btn}
                  onClick={() => navigate("/teacher/login")}
                >
                  교수자 로그인
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={() => navigate("/admin/login")}
                >
                  관리자 로그인
                </button>
              </>
            ) : (
              <>
                {adminReady && isAdmin && (
                  <Link to="/admin/settings" className={`${styles.btn} ${styles.btnSecondary}`}>
                    관리자 페이지
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </footer>
    </main>
  );
}
