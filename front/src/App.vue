<template>
  <div id="app">
    <!-- 로그인/회원가입 페이지가 아닐 때만 네비게이션 바 표시 -->
    <NavigationBar v-if="showNavigation" />
    
    <!-- 페이지 콘텐츠 -->
    <router-view />
  </div>
</template>

<script>
// 네비게이션 바 컴포넌트 import
import NavigationBar from '@/components/NavigationBar.vue'

export default {
  name: 'App',
  
  components: {
    NavigationBar
  },
  
  computed: {
    // 네비게이션 바를 보여줄지 결정
    showNavigation() {
      const hiddenRoutes = ['/', '/signup']
      return !hiddenRoutes.includes(this.$route.path)
    }
  },
  
  created() {
    // 앱 시작 시 저장된 로그인 정보 복원
    this.$store.commit('restoreLogin')
    
    console.log('앱 시작 - 로그인 상태:', this.$store.getters?.isLoggedIn)
    console.log('로그인 사용자:', this.$store.state.loginUser)
  }
}
</script>

<style>
/* 전역 스타일 */
#app {
  font-family: 'Noto Sans KR', Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: #f8f9fa;
}
</style>