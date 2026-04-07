import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getDb } from "./firebase";

export function normalizeEmailKey(email: string): string {
  return email.trim().toLowerCase();
}

export async function isAdminUser(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(getDb(), "adminUsers", uid));
  return snap.exists();
}

export async function isProfessorApproved(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const snap = await getDoc(
    doc(getDb(), "professorGrantsByEmail", normalizeEmailKey(email)),
  );
  if (!snap.exists()) return false;
  const d = snap.data() as { granted?: boolean };
  return d.granted === true;
}

export async function setProfessorGrant(email: string, granted: boolean): Promise<void> {
  const key = normalizeEmailKey(email);
  if (!key.includes("@")) {
    throw new Error("올바른 이메일을 입력하세요.");
  }
  const ref = doc(getDb(), "professorGrantsByEmail", key);
  if (granted) {
    await setDoc(ref, {
      granted: true,
      email: key,
      updatedAt: serverTimestamp(),
    });
  } else {
    await deleteDoc(ref);
  }
}

export type ProfessorGrantRow = { id: string; email: string; granted: boolean };

export async function listProfessorGrants(): Promise<ProfessorGrantRow[]> {
  const snap = await getDocs(collection(getDb(), "professorGrantsByEmail"));
  return snap.docs.map((d) => {
    const data = d.data() as { granted?: boolean; email?: string };
    return {
      id: d.id,
      email: data.email ?? d.id,
      granted: data.granted === true,
    };
  });
}
