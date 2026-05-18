# 🐥 GO르덕 Frontend

---

## 🛠 기술 스택

| 구분 | 기술 |
| ---- | ---- |
| Framework | React Native |
| Platform | Expo |
| Language | TypeScript |
| Routing | Expo Router |
| Styling | React Native StyleSheet |
| Icon | Expo Vector Icons |

---

## 🚀 실행 방법

### 1. 프로젝트 폴더로 이동

```bash
cd gordeok
```

### 2. 패키지 설치

```bash
npm install
```

### 3. Expo 실행

```bash
npx expo start
```

실행 후 터미널에 표시되는 QR 코드를 Expo Go 앱으로 스캔하면 모바일에서 확인할 수 있습니다.

---

## 🌿 Branch 규칙

기능 단위로 브랜치를 생성합니다.

### 📌 형식

```text
FE-기능명
```

### 📎 예시

```text
FE-home
FE-chat
FE-community
FE-onboarding
FE-mypage
```

---

## 💬 Commit 규칙

커밋 메시지는 아래 형식을 사용합니다.

### 📌 형식

```text
타입: 작업 내용
```

### 📎 타입 종류

| 타입 | 설명 |
| ---- | ---- |
| feat | 기능 추가 |
| fix | 버그 수정 |
| design | UI/UX 수정 |
| refactor | 코드 구조 개선 |
| docs | 문서 수정 |
| chore | 기타 설정 및 환경 작업 |

### 📎 예시

```bash
git commit -m "design: 홈 화면 UI 구현"
git commit -m "design: 채팅 목록 화면 수정"
git commit -m "feat: 알림 화면 추가"
git commit -m "fix: 라우팅 오류 수정"
git commit -m "docs: README 수정"
```

---

## 📌 작업 방식

1. `main` 브랜치는 프론트엔드 프로젝트의 기준 브랜치로 사용합니다.
2. 새로운 화면 또는 기능 작업 시 기능별 브랜치를 생성합니다.
3. 작업 완료 후 해당 브랜치에 커밋하고 원격 레포지토리에 push합니다.
4. 이후 Pull Request를 통해 `main` 브랜치에 병합합니다.