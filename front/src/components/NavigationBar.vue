<template>
  <!-- 네비게이션 바 컴포넌트 -->
  <nav class="navbar">
    <div class="nav-container">
      <!-- 로고 -->
      <router-link to="/" class="logo">🧗‍♀️ 붙잡아줘요</router-link>
      
      <!-- 네비게이션 링크들 -->
      <div class="nav-links">
        <router-link to="/gyms" class="nav-link">클라이밍장</router-link>
        <router-link to="/board" class="nav-link">게시판</router-link>
        <router-link to="/mypage" class="nav-link">마이페이지</router-link>
        
        <!-- 사용자 정보 및 로그아웃 -->
        <div class="user-menu">
          <span v-if="currentUser" class="user-greeting">
            안녕하세요, {{ currentUser.nickname }}님! 👋
          </span>
          <button @click="logout" class="logout-btn">로그아웃</button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'NavigationBar',
  
  computed: {
    // Vuex store에서 현재 로그인된 사용자 정보 가져오기
    currentUser() {
      return this.$store.state.loginUser
    }
  },
  
  methods: {
    /**
     * 로그아웃 처리
     */
    logout() {
      if (confirm('로그아웃 하시겠습니까?')) {
        console.log('로그아웃 처리 시작')
        
        // Vuex store에서 로그인 정보 삭제 + localStorage 정리
        this.$store.commit('logout')
        
        console.log('로그아웃 완료 - 로그인 페이지로 이동')
        
        // 로그인 페이지로 이동
        this.$router.push('/')
      }
    }
  }
}
</script>

<style scoped>
/* 네비게이션 바 스타일 */
.navbar {
  background: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 로고 스타일 */
.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: #667eea;
  text-decoration: none;
  transition: color 0.2s;
}

.logo:hover {
  color: #5a67d8;
}

/* 네비게이션 링크들 */
.nav-links {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.nav-link {
  text-decoration: none;
  color: #333;
  font-weight: 500;
  transition: all 0.2s;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  position: relative;
}

.nav-link:hover {
  color: white;
  background: #667eea;
  transform: translateY(-1px);
}

/* Vue Router의 active 클래스 스타일 */
.nav-link.router-link-active {
  color: white;
  background: #667eea;
}

/* 사용자 메뉴 */
.user-menu {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-greeting {
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

/* 로그아웃 버튼 */
.logout-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: #5a67d8;
  transform: translateY(-1px);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .nav-container {
    padding: 1rem 15px;
  }
  
  .nav-links {
    gap: 1rem;
  }
  
  .nav-link {
    padding: 0.4rem 0.8rem;
    font-size: 14px;
  }
  
  .user-greeting {
    display: none; /* 모바일에서는 인사말 숨김 */
  }
  
  .logout-btn {
    padding: 6px 12px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .nav-links {
    gap: 0.5rem;
  }
  
  .nav-link {
    padding: 0.3rem 0.6rem;
    font-size: 12px;
  }
  
  .logo {
    font-size: 1.2rem;
  }
}
</style>