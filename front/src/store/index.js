import { createStore } from 'vuex'

export default createStore({
  state: {
    loginUser: null
  },
  
  getters: {
    isLoggedIn: (state) => state.loginUser !== null,
    userNickname: (state) => state.loginUser?.nickname || '게스트'
  },
  
  mutations: {
    login(state, user) {
      state.loginUser = user
      // localStorage에도 저장 (새로고침 대비)
      localStorage.setItem('loginUser', JSON.stringify(user))
      localStorage.setItem('isLoggedIn', 'true')
    },
    
    logout(state) {
      state.loginUser = null
      // localStorage에서도 삭제
      localStorage.removeItem('loginUser')
      localStorage.removeItem('isLoggedIn')
    },
    
    // 새로고침 시 localStorage에서 복원
    restoreLogin(state) {
      const savedUser = localStorage.getItem('loginUser')
      const isLoggedIn = localStorage.getItem('isLoggedIn')
      
      if (savedUser && isLoggedIn === 'true') {
        try {
          state.loginUser = JSON.parse(savedUser)
        } catch (error) {
          console.error('저장된 로그인 정보 복원 실패:', error)
          // 잘못된 데이터면 삭제
          localStorage.removeItem('loginUser')
          localStorage.removeItem('isLoggedIn')
        }
      }
    }
  }
})