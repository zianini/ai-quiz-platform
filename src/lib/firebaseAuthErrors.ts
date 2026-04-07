import type { FirebaseError } from "firebase/app";

/** Firebase Auth 오류 코드를 사용자용 한글 메시지로 바꿉니다. */
export function formatAuthError(err: unknown): string {
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as FirebaseError).code)
      : "";

  switch (code) {
    case "auth/admin-restricted-operation":
    case "auth/operation-not-allowed":
      return "이메일/비밀번호 로그인이 허용되지 않았습니다. Firebase 콘솔 → Authentication → 로그인 방법에서 「이메일/비밀번호」를 사용 설정한 뒤 다시 시도하세요.";
    case "auth/invalid-email":
      return "이메일 형식이 올바르지 않습니다.";
    case "auth/user-disabled":
      return "이 계정은 비활성화되어 있습니다.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "이메일 또는 비밀번호가 올바르지 않습니다.";
    case "auth/email-already-in-use":
      return "이미 사용 중인 이메일입니다.";
    case "auth/weak-password":
      return "비밀번호가 너무 짧습니다. 6자 이상으로 설정하세요.";
    case "auth/network-request-failed":
      return "네트워크 오류로 로그인에 실패했습니다. 연결을 확인한 뒤 다시 시도하세요.";
    default:
      if (err instanceof Error && err.message) return err.message;
      return "로그인에 실패했습니다.";
  }
}
