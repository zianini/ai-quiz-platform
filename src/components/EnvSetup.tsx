import { getMissingEnvironmentKeys } from "../lib/envCheck";

export function EnvSetup() {
  const missing = getMissingEnvironmentKeys();
  return (
    <main style={{ maxWidth: 560, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>환경 설정 필요</h1>
      <p>
        프로젝트 루트에 <code>.env.local</code> 파일을 만들고{" "}
        <code>.env.example</code>을 복사한 뒤 값을 채워 주세요.
      </p>
      {missing.length > 0 && (
        <ul>
          {missing.map((k) => (
            <li key={k}>
              <code>{k}</code>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
