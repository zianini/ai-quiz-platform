import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDb } from "./firebase";

export async function saveUserNickname(uid: string, nickname: string): Promise<void> {
  await setDoc(
    doc(getDb(), "users", uid),
    {
      nickname: nickname.trim(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
