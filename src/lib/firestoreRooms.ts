import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import type {
  AttemptDoc,
  QuestionDoc,
  QuizQuestionPayload,
  RoomDoc,
  RoomStatus,
} from "../types";
import { getDb } from "./firebase";

export async function roomExists(roomId: string): Promise<boolean> {
  const snap = await getDoc(doc(getDb(), "rooms", roomId));
  return snap.exists();
}

export async function createRoomWithQuestions(params: {
  roomId: string;
  room: Omit<RoomDoc, "createdAt">;
  questions: QuizQuestionPayload[];
}): Promise<void> {
  const { roomId, room, questions } = params;
  const db = getDb();
  const batch = writeBatch(db);
  const roomRef = doc(db, "rooms", roomId);
  batch.set(roomRef, {
    ...room,
    createdAt: serverTimestamp(),
  });
  questions.forEach((q, i) => {
    const qRef = doc(collection(db, "rooms", roomId, "questions"));
    const payload: QuestionDoc = {
      order: i,
      text: q.text,
      choices: q.choices,
      correctIndex: q.correctIndex,
    };
    batch.set(qRef, payload);
  });
  await batch.commit();
}

export async function fetchRoom(roomId: string): Promise<RoomDoc | null> {
  const snap = await getDoc(doc(getDb(), "rooms", roomId));
  if (!snap.exists()) return null;
  return snap.data() as RoomDoc;
}

/** 진행 중인 방만, 최신순. 로그인 없이도 공개 방 메타는 규칙상 조회 가능. */
/** 관리자용: 전체 방 최신순 (인증된 클라이언트만 규칙상 조회 가능) */
export async function fetchAllRooms(max = 80): Promise<Array<{ id: string; data: RoomDoc }>> {
  const db = getDb();
  const q = query(collection(db, "rooms"), orderBy("createdAt", "desc"), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as RoomDoc }));
}

export async function fetchOpenRooms(max = 40): Promise<Array<{ id: string; data: RoomDoc }>> {
  const db = getDb();
  const q = query(
    collection(db, "rooms"),
    where("status", "==", "open"),
    orderBy("createdAt", "desc"),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as RoomDoc }));
}

export async function fetchRoomsByCreator(
  creatorUid: string,
  max = 50,
): Promise<Array<{ id: string; data: RoomDoc }>> {
  const db = getDb();
  const q = query(
    collection(db, "rooms"),
    where("creatorUid", "==", creatorUid),
    orderBy("createdAt", "desc"),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as RoomDoc }));
}

export async function saveQuizEdits(params: {
  roomId: string;
  roomPatch: {
    topic: string;
    difficulty: string;
    professorNickname: string;
    status: RoomStatus;
  };
  questions: Array<{ id: string; data: QuestionDoc }>;
}): Promise<void> {
  const { roomId, roomPatch, questions } = params;
  const db = getDb();
  const batch = writeBatch(db);
  const roomRef = doc(db, "rooms", roomId);
  batch.update(roomRef, {
    topic: roomPatch.topic.trim(),
    difficulty: roomPatch.difficulty,
    professorNickname: roomPatch.professorNickname.trim(),
    status: roomPatch.status,
    questionCount: questions.length,
  });
  questions.forEach((q, i) => {
    const qRef = doc(db, "rooms", roomId, "questions", q.id);
    batch.update(qRef, {
      order: i,
      text: q.data.text.trim(),
      choices: q.data.choices,
      correctIndex: q.data.correctIndex,
    });
  });
  await batch.commit();
}

export async function fetchQuestions(roomId: string): Promise<
  Array<{ id: string; data: QuestionDoc }>
> {
  const q = query(
    collection(getDb(), "rooms", roomId, "questions"),
    orderBy("order", "asc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as QuestionDoc }));
}

export async function addAttempt(params: {
  roomId: string;
  nickname: string;
  uid: string;
  score: number;
  total: number;
}): Promise<void> {
  const { roomId, nickname, uid, score, total } = params;
  const attemptRef = doc(getDb(), "rooms", roomId, "attempts", uid);
  await setDoc(
    attemptRef,
    {
      nickname,
      uid,
      score,
      total,
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function subscribeLeaderboard(
  roomId: string,
  maxRows: number,
  onNext: (rows: Array<{ id: string; data: AttemptDoc }>) => void,
  onError: (e: Error) => void,
): Unsubscribe {
  const q = query(
    collection(getDb(), "rooms", roomId, "attempts"),
    orderBy("score", "desc"),
    limit(maxRows),
  );
  return onSnapshot(
    q,
    (snap) => {
      onNext(
        snap.docs.map((d) => ({
          id: d.id,
          data: d.data() as AttemptDoc,
        })),
      );
    },
    (err) => onError(err as Error),
  );
}
