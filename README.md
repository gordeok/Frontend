# GO르덕

## 📁 폴더 구조

```
GO르덕
├─ FE/        # 프론트엔드 (React Native)
├─ BE/        # 백엔드 (Spring Boot)
├─ AI/        # AI 서버
├─ docs/      # 문서 및 기획
```

---

## 🌿 Branch 규칙

* 브랜치는 기능 단위로 생성
* 형식: `FE-기능명`, `BE-기능명`, `AI-기능명`

예시:

* FE-login
* BE-chat
* AI-recommend

생성 방법:

```bash
git checkout -b FE-login
git push -u origin FE-login
```

---

## 💬 Commit 규칙

형식:

```
타입: 작업 내용
```

타입:

* feat : 기능 추가
* fix : 버그 수정
* design : UI/UX 변경
* refactor : 코드 개선
* docs : 문서 수정

예시:

* feat: 로그인 기능 구현
* fix: 채팅 오류 수정
* design: 홈 화면 UI 수정
