# 🧗 CLIM - 클라이밍 커뮤니티 플랫폼

> 클라이머들을 위한 암장 정보, 실시간 혼잡도, 커뮤니티 서비스

---

## 소개

**CLIM**은 클라이밍을 즐기는 사람들을 위한 통합 커뮤니티 플랫폼입니다.
주변 클라이밍장 정보 탐색부터 실시간 혼잡도 제보, 같이 클라이밍할 파트너 모집까지 한 곳에서 해결할 수 있습니다.

---

## 주요 기능

### 🏢 클라이밍장 정보
- 지역별 클라이밍장 검색 및 필터링
- 운영시간, 요금, 연락처 등 상세 정보 제공
- 사용자 평점 및 리뷰 시스템

### 📊 실시간 혼잡도
- 사용자 참여형 실시간 혼잡도 제보 (여유 / 보통 / 혼잡 / 매우혼잡)
- 평균 혼잡도 통계 제공

### 💬 커뮤니티 게시판
- **후기** - 클라이밍장 방문 후기 공유
- **질문** - 클라이밍 관련 궁금한 점 질문
- **모임** - 함께 클라이밍할 파트너 모집 (날짜, 장소, 인원 설정)
- 댓글 및 대댓글 지원

### 👤 사용자 프로필
- 볼더링 레벨 설정 (V0 ~ V8)
- 선호 기술 태그 (static, dynamic, lunge 등)
- 지도자 자격증 뱃지
- 즐겨찾기 암장 관리

---

## 기술 스택

### Frontend
| 기술 | 버전 |
|------|------|
| Vue.js | 3.x |
| Vuetify | 3.x |
| Vuex | 4.x |
| Vue Router | 4.x |
| Axios | 1.x |
| Chart.js | 4.x |

### Backend
| 기술 | 버전 |
|------|------|
| Node.js | - |
| Express | 4.x |
| MySQL2 | 3.x |
| Sequelize | 6.x |
| express-session | 1.x |
| bcrypt | 6.x |

---

## 프로젝트 구조

```
clim/
├── front/                  # Vue.js 프론트엔드
│   └── src/
│       ├── views/          # 페이지 컴포넌트
│       ├── components/     # 공통 컴포넌트
│       ├── router/         # 라우팅 설정
│       └── store/          # Vuex 상태 관리
│
└── backend/                # Express 백엔드
    ├── routes/             # API 라우터
    │   ├── users.js        # 사용자 관련 API
    │   ├── gyms.js         # 클라이밍장 API
    │   ├── posts.js        # 게시판 API
    │   └── recommendations.js
    ├── model.js            # Sequelize 모델 정의
    └── app.js              # Express 앱 설정
```

---

## 시작하기

### 요구사항
- Node.js 16+
- MySQL 8+

### 백엔드 실행

```bash
cd backend
npm install
npm start
```

### 프론트엔드 실행

```bash
cd front
npm install
npm run serve
```

---

## 페이지 구성

| 경로 | 페이지 |
|------|--------|
| `/` | 로그인 |
| `/signup` | 회원가입 |
| `/main` | 홈 |
| `/gyms` | 클라이밍장 목록 |
| `/gyms/:id` | 클라이밍장 상세 |
| `/board` | 커뮤니티 게시판 |
| `/board/:id` | 게시글 상세 |
| `/board/write` | 게시글 작성 |
| `/mypage` | 마이페이지 |
