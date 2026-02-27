<template>
  <!-- 전체 컨테이너: 화면 전체를 차지하며 중앙 정렬 -->
  <div class="container">
    <!-- 로그인 폼 카드: 흰색 배경의 로그인 입력 영역 -->
    <div class="login-form">
      <!-- 페이지 제목 -->
      <h2>🧗‍♀️ 붙잡아줘요 로그인</h2>
      
      <!-- 에러 메시지 표시 영역: 로그인 실패 시에만 보임 -->
      <div v-if="loginError" class="error-message">
        {{ loginError }}
      </div>
      
      <!-- 사용자 ID 입력 필드 -->
      <div class="form-group">
        <label>사용자 ID</label>
        <!-- v-model: 입력값을 user.userId와 양방향 바인딩 -->
        <!-- @keypress.enter: Enter 키 입력 시 로그인 함수 실행 -->
        <input 
          v-model="user.userId" 
          type="text" 
          placeholder="아이디를 입력해주세요"
          @keypress.enter="login"
        >
      </div>
      
      <!-- 비밀번호 입력 필드 -->
      <div class="form-group">
        <label>비밀번호</label>
        <!-- type="password": 입력 내용을 * 로 표시 -->
        <!-- @keypress.enter: Enter 키로도 로그인 가능 -->
        <input 
          v-model="user.password" 
          type="password" 
          placeholder="비밀번호를 입력해주세요"
          @keypress.enter="login"
        >
      </div>
      
      <!-- 로그인 버튼 영역 -->
      <div class="text-center">
        <!-- :disabled: 로그인 진행 중일 때 버튼 비활성화 -->
        <!-- @click: 클릭 시 login() 함수 실행 -->
        <button @click="login()" class="login-btn" :disabled="isSubmitting">
          <!-- 조건부 렌더링: 로그인 진행 상태에 따라 텍스트 변경 -->
          {{ isSubmitting ? '로그인 중...' : '로그인' }}
        </button>
      </div>
      
      <!-- 회원가입 링크 -->
      <p class="signup-link">
        아직 계정이 없으신가요? 
        <!-- router-link: Vue Router를 통한 페이지 이동 -->
        <router-link to="/signup">회원가입하기</router-link>
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoginView', // 컴포넌트 이름
  
  // 반응형 데이터 정의
  data() {
    return {
      // 사용자 입력 데이터
      user: {
        userId: "",    // 입력된 사용자 ID
        password: ""   // 입력된 비밀번호
      },
      
      loginError: "",      // 로그인 실패 시 표시할 에러 메시지
      isSubmitting: false  // 로그인 요청 진행 중 여부 (중복 클릭 방지)
    }
  },
  
  // 메서드 정의
  methods: {
    /**
     * 로그인 처리 함수
     * 1. 입력값 유효성 검사
     * 2. 서버 또는 임시 데이터와 비교
     * 3. 성공/실패에 따른 처리
     */
    async login() {
      // === 1단계: 입력값 유효성 검사 ===
      if (this.user.userId.trim() === "") {
        alert("아이디를 입력해주세요")
        return // 함수 종료
      }
      
      if (this.user.password.trim() === "") {
        alert("비밀번호를 입력해주세요")
        return // 함수 종료
      }
      
      // === 2단계: 로그인 시작 상태 설정 ===
      this.isSubmitting = true  // 버튼 비활성화 및 텍스트 변경
      this.loginError = ""      // 이전 에러 메시지 초기화
      
      try {
        // === 3단계: 실제 로그인 처리 ===
        
        // 백엔드 API에 로그인 요청 보내기
        const response = await this.$axios.post("/api/user/login", {
          userId: this.user.userId,
          password: this.user.password
        })
        
        // 서버 응답에서 사용자 정보 가져오기
        const authenticatedUser = response.data.success ? response.data.user : null
        
        // === 4단계: 로그인 결과 처리 ===
        if (authenticatedUser) {
          // ✅ 로그인 성공
          this.$store.commit('login',authenticatedUser)
          console.log('로그인 성공:', authenticatedUser)       
          alert(`🎉 ${authenticatedUser.nickname}님, 환영합니다!`)
          this.$router.push("/main") // 또는 "/" (메인페이지 라우트에 따라)
          
        } else {
          // ❌ 로그인 실패
          console.log('로그인 실패: 잘못된 계정 정보')
          this.loginError = "사용자 ID 또는 비밀번호가 올바르지 않습니다."        
          // 비밀번호 필드 초기화 (보안상 좋은 UX)
          this.user.password = ""
        }
        
      } catch (error) {
        // === 5단계: 예외 처리 ===
        console.error('로그인 중 오류 발생:', error)
        
        // 네트워크 오류 등 예상치 못한 에러 처리
        this.loginError = "로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
        
      } finally {
        // === 6단계: 로그인 완료 처리 ===
        // 성공/실패 관계없이 항상 실행되는 코드
        this.isSubmitting = false // 버튼 활성화 및 텍스트 원래대로
      }
    }
  },
  
  // 컴포넌트가 생성될 때 실행되는 라이프사이클 훅
  created() {
    // - 이미 로그인된 사용자라면 메인페이지로 자동 리다이렉트
  if (this.$store.getters.isLoggedIn) {
    console.log('이미 로그인된 사용자입니다.')
    this.$router.push('/main')
  } 
    console.log('LoginView 컴포넌트가 생성되었습니다.')
  }
}
</script>

<style scoped>
/* =================================
   전체 컨테이너 스타일
   ================================= */
.container {
  min-height: 100vh;           /* 화면 전체 높이 사용 */
  display: flex;               /* Flexbox 레이아웃 */
  justify-content: center;     /* 가로 중앙 정렬 */
  align-items: center;         /* 세로 중앙 정렬 */
  /* 클라이밍 테마의 그라데이션 배경 */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;               /* 모바일에서 여백 확보 */
}

/* =================================
   로그인 폼 카드 스타일
   ================================= */
.login-form {
  background: white;                        /* 흰색 배경 */
  padding: 40px;                           /* 내부 여백 */
  border-radius: 15px;                     /* 둥근 모서리 */
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); /* 그림자 효과 */
  width: 100%;                             /* 부모 요소의 전체 너비 */
  max-width: 400px;                        /* 최대 너비 제한 */
  transition: transform 0.3s ease;         /* 부드러운 애니메이션 */
}

/* 카드 호버 효과 (선택사항) */
.login-form:hover {
  transform: translateY(-5px); /* 살짝 위로 이동 */
}

/* =================================
   제목 스타일
   ================================= */
.login-form h2 {
  text-align: center;  /* 중앙 정렬 */
  margin-bottom: 30px; /* 아래 여백 */
  color: #333;         /* 어두운 회색 */
  font-size: 1.8rem;   /* 글자 크기 */
  font-weight: bold;   /* 굵은 글씨 */
}

/* =================================
   에러 메시지 스타일
   ================================= */
.error-message {
  background: #ffebee;    /* 연한 빨간색 배경 */
  color: #c62828;         /* 진한 빨간색 글자 */
  padding: 12px;          /* 내부 여백 */
  border-radius: 8px;     /* 둥근 모서리 */
  margin-bottom: 20px;    /* 아래 여백 */
  text-align: center;     /* 중앙 정렬 */
  font-size: 14px;        /* 작은 글자 크기 */
  border: 1px solid #ffcdd2; /* 테두리 */
  animation: shake 0.5s ease-in-out; /* 흔들림 애니메이션 */
}

/* 에러 메시지 흔들림 애니메이션 */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

/* =================================
   폼 그룹 (입력 필드 영역) 스타일
   ================================= */
.form-group {
  margin-bottom: 20px; /* 각 입력 필드 간격 */
}

/* 라벨 스타일 */
.form-group label {
  display: block;        /* 블록 요소로 표시 */
  margin-bottom: 8px;    /* 아래 여백 */
  font-weight: 500;      /* 중간 굵기 */
  color: #333;           /* 어두운 회색 */
  font-size: 14px;       /* 글자 크기 */
}

/* 입력 필드 스타일 */
.form-group input {
  width: 100%;                    /* 전체 너비 */
  padding: 12px;                  /* 내부 여백 */
  border: 2px solid #e1e5e9;      /* 연한 회색 테두리 */
  border-radius: 8px;             /* 둥근 모서리 */
  font-size: 16px;                /* 글자 크기 */
  box-sizing: border-box;         /* 패딩 포함한 크기 계산 */
  transition: border-color 0.3s ease; /* 테두리 색상 변화 애니메이션 */
}

/* 입력 필드 포커스 상태 */
.form-group input:focus {
  outline: none;              /* 기본 포커스 아웃라인 제거 */
  border-color: #667eea;      /* 포커스 시 파란색 테두리 */
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); /* 포커스 그림자 */
}

/* =================================
   버튼 영역 스타일
   ================================= */
.text-center {
  text-align: center;     /* 중앙 정렬 */
  margin: 30px 0 20px 0;  /* 위아래 여백 */
}

/* 로그인 버튼 스타일 */
.login-btn {
  /* 그라데이션 배경 */
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;              /* 흰색 글자 */
  border: none;              /* 테두리 없음 */
  padding: 12px 40px;        /* 내부 여백 */
  border-radius: 25px;       /* 둥근 모서리 (pill 모양) */
  font-size: 16px;           /* 글자 크기 */
  font-weight: bold;         /* 굵은 글씨 */
  cursor: pointer;           /* 마우스 포인터 */
  width: 100%;               /* 전체 너비 */
  max-width: 200px;          /* 최대 너비 제한 */
  transition: all 0.3s ease; /* 모든 속성 부드러운 변화 */
}

/* 버튼 호버 효과 (비활성화 상태가 아닐 때만) */
.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);        /* 위로 살짝 이동 */
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3); /* 그림자 강화 */
}

/* 버튼 비활성화 상태 */
.login-btn:disabled {
  opacity: 0.6;           /* 반투명 */
  cursor: not-allowed;    /* 금지 마우스 포인터 */
  transform: none;        /* 호버 효과 제거 */
}

/* =================================
   회원가입 링크 스타일
   ================================= */
.signup-link {
  text-align: center; /* 중앙 정렬 */
  color: #666;        /* 회색 글자 */
  margin: 0;          /* 여백 제거 */
  font-size: 14px;    /* 작은 글자 크기 */
}

/* 링크 스타일 */
.signup-link a {
  color: #667eea;         /* 파란색 */
  text-decoration: none;  /* 밑줄 제거 */
  font-weight: 500;       /* 약간 굵게 */
  transition: color 0.2s ease; /* 색상 변화 애니메이션 */
}

/* 링크 호버 효과 */
.signup-link a:hover {
  text-decoration: underline; /* 호버 시 밑줄 */
  color: #5a67d8;            /* 더 진한 파란색 */
}

/* =================================
   반응형 디자인 (모바일)
   ================================= */
@media (max-width: 768px) {
  .login-form {
    padding: 30px 20px; /* 모바일에서 패딩 줄임 */
    margin: 10px;       /* 여백 추가 */
  }
  
  .login-form h2 {
    font-size: 1.5rem;  /* 제목 크기 줄임 */
  }
  
  .login-btn {
    padding: 14px 30px; /* 버튼 패딩 조정 */
    font-size: 16px;    /* 터치하기 쉽도록 크기 유지 */
  }
}

/* 작은 모바일 (320px 이하) */
@media (max-width: 320px) {
  .container {
    padding: 10px; /* 최소 여백 */
  }
  
  .login-form {
    padding: 20px 15px; /* 더 작은 패딩 */
  }
}
</style>