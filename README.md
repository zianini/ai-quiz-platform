# AI 퀴즈 플랫폼

교수자가 Gemini로 4지선다 퀴즈를 만들고, 학습자가 방 코드로 입장해 응시·점수를 확인하는 웹 앱입니다. 실시간 리더보드는 Firestore `onSnapshot`으로 갱신됩니다.

## 사전 준비

1. [Google AI Studio](https://aistudio.google.com/apikey)에서 API 키를 발급합니다.
2. [Firebase 콘솔](https://console.firebase.google.com/)에서 프로젝트를 만들고, **웹 앱**을 추가합니다.
3. Firebase에서 **Authentication** → **시작하기** → **로그인 방법** → **이메일/비밀번호** → **사용 설정**을 켭니다. (이 단계를 빼면 `auth/admin-restricted-operation` 또는 `auth/operation-not-allowed` 오류가 날 수 있습니다.) 앱에서는 **회원가입**으로 첫 계정을 만든 뒤 **로그인**합니다.
4. **Firestore Database**를 만든 뒤, 이 저장소의 [`firestore.rules`](firestore.rules) 내용을 콘솔의 **규칙**에 붙여 넣고 배포합니다.
5. **관리자·교수 권한 (필수)**  
   - Firestore에 **`adminUsers`** 컬렉션을 만들고, 관리자로 쓸 계정의 **UID**를 문서 ID로 한 문서를 추가합니다. (Authentication → 사용자에서 UID 복사, 내용은 빈 객체 `{}`여도 됩니다.)  
   - 앱에서 **관리자 로그인**(`/admin/login`) 후 **교수 허가** 화면에서 퀴즈를 만들 교수 이메일을 등록합니다. 등록된 이메일 계정만 **교수자** 메뉴가 열립니다.

## 환경 변수

1. `.env.example`을 복사해 `.env.local` 파일을 만듭니다.
2. Firebase 웹 앱 설정값과 Gemini 키를 채웁니다.
3. `VITE_GEMINI_MODEL`은 `gemini-2.5-flash` 또는 `gemini-2.0-flash` 중 하나로 설정합니다. 생략 시 앱 코드에서 기본값 `gemini-2.5-flash`를 사용합니다.

```bash
npm install
npm run dev
```

브라우저에서 표시되는 주소(보통 `http://localhost:5173`)로 접속합니다.

## 빌드

```bash
npm run build
npm run preview
```

## 보안 참고

Gemini API 키는 Vite를 통해 **클라이언트 번들에 포함될 수 있습니다**. 공개 배포 전에 키 제한·재발급, Firebase App Check 등을 검토하세요.

## Firestore 인덱스

- `attempts` 컬렉션에서 `score` 기준 정렬 시 콘솔에서 복합 인덱스 생성 링크가 뜰 수 있습니다.
- **내 퀴즈 목록**(`rooms`에서 `creatorUid` 같음 + `createdAt` 내림차순), **공개 퀴즈 목록**(`status` + `createdAt`)을 처음 열 때 인덱스 안내 링크가 뜰 수 있습니다. 안내에 따라 인덱스를 추가하면 됩니다.
