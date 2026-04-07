import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { isProfessorApproved } from "../lib/firestoreRoles";

/** 로그인·교수 허가 여부까지 반영된 준비 상태 */
export function useProfessorAccess() {
  const { user, ready } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!user?.email) {
      setAllowed(false);
      return;
    }
    let cancelled = false;
    setAllowed(null);
    isProfessorApproved(user.email).then((v) => {
      if (!cancelled) setAllowed(v);
    });
    return () => {
      cancelled = true;
    };
  }, [user, ready]);

  const accessReady = ready && allowed !== null;
  return { accessReady, professorAllowed: allowed === true };
}
