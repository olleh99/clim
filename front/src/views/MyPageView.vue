<template>
  <div class="mypage">
    <!-- 로딩 상태 -->
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <p>마이페이지를 불러오는 중...</p>
    </div>

    <!-- 마이페이지 콘텐츠 -->
    <div v-else-if="userData" class="container">
      <!-- 프로필 섹션 -->
      <div class="profile-section">
        <div class="profile-card">
          <div class="profile-header">
            <div class="profile-avatar">
              <span class="avatar-text">{{ userData.user.nickname?.charAt(0) || '?' }}</span>
            </div>
            <div class="profile-info">
              <h1 class="profile-name">{{ userData.user.nickname || '이름 없음' }}</h1>
              <div class="profile-badges">
                <span v-if="userData.user.level" class="level-badge">{{ userData.user.level }}</span>
                <span v-if="userData.user.hasInstructorLicense" class="instructor-badge">🏅 지도자</span>
              </div>
              <div v-if="userData.user.techniques && Array.isArray(userData.user.techniques) && userData.user.techniques.length > 0" class="profile-techniques">
                <span class="techniques-label">주요 기술:</span>
                <span v-for="tech in userData.user.techniques" :key="tech" class="technique-tag">
                  {{ getTechniqueName(tech) }}
                </span>
              </div>
              <p class="join-date">🎯 {{ userData.statistics?.joinDays || 0 }}일째 클라이밍 중</p>
            </div>
            <button @click="showEditModal = true" class="btn-edit-profile">✏ 프로필 편집</button>
          </div>
        </div>
      </div>

      <!-- 활동 통계 섹션 -->
      <div class="stats-section">
        <h3>📊 나의 활동 통계</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📝</div>
            <div class="stat-number">{{ userData.statistics?.postCount || 0 }}</div>
            <div class="stat-label">작성한 게시글</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⭐</div>
            <div class="stat-number">{{ userData.statistics?.reviewCount || 0 }}</div>
            <div class="stat-label">작성한 리뷰</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-number">{{ userData.statistics?.congestionReportCount || 0 }}</div>
            <div class="stat-label">혼잡도 제보</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🏆</div>
            <div class="stat-number">{{ getTotalActivityScore() }}</div>
            <div class="stat-label">활동 점수</div>
          </div>
        </div>
      </div>

      <!-- 탭 메뉴 -->
      <div class="tabs-section">
        <div class="tabs-header">
          <button v-for="tab in tabs" :key="tab.key" @click="activeTab = tab.key" 
                  :class="{ active: activeTab === tab.key }" class="tab-button">
            {{ tab.icon }} {{ tab.label }}
          </button>
        </div>

        <!-- 내가 쓴 게시글 탭 -->
        <div v-if="activeTab === 'posts'" class="tab-content">
          <div class="content-header">
            <h4>📝 내가 쓴 게시글</h4>
            <div class="filter-controls">
              <select v-model="postFilter" @change="loadMyPosts">
                <option value="all">전체</option>
                <option value="후기">후기</option>
                <option value="질문">질문</option>
                <option value="모임">모임</option>
              </select>
            </div>
          </div>

          <div v-if="myPosts && Array.isArray(myPosts) && myPosts.length > 0" class="posts-list">
            <div v-for="post in myPosts" :key="post.id" class="post-item" @click="goToPost(post.id)">
              <div class="post-header">
                <span class="post-category" :class="post.category">
                  {{ getCategoryEmoji(post.category) }} {{ post.category }}
                </span>
                <span class="post-date">{{ formatDate(post.createdAt) }}</span>
              </div>
              <h5 class="post-title">{{ post.title || '제목 없음' }}</h5>
              <div v-if="post.meetingGym" class="post-gym">🏢 {{ post.meetingGym.name }}</div>
              <div class="post-stats">
                <span>❤ {{ post.likes || 0 }}</span>
                <span>👁 {{ post.views || 0 }}</span>
                <span>💬 {{ post.comments?.length || 0 }}</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>아직 작성한 게시글이 없습니다.</p>
            <button @click="$router.push('/board/write')" class="btn-primary">첫 번째 글 작성하기</button>
          </div>
        </div>

        <!-- 내가 쓴 리뷰 탭 -->
        <div v-if="activeTab === 'reviews'" class="tab-content">
          <div class="content-header">
            <h4>⭐ 내가 쓴 리뷰</h4>
          </div>

          <div v-if="myReviews && Array.isArray(myReviews) && myReviews.length > 0" class="reviews-list">
            <div v-for="review in myReviews" :key="review.id" class="review-item" @click="goToGym(review.gym?.id)">
              <div class="review-header">
                <div class="gym-name">🏢 {{ review.gym?.name || '클라이밍장 정보 없음' }}</div>
                <div class="review-rating">
                  <span v-for="n in 5" :key="n" class="star" :class="{ filled: n <= (review.rating && typeof review.rating === 'number' ? review.rating : 0) }">★</span>
                  <span class="rating-text">({{ review.rating && typeof review.rating === 'number' ? review.rating : 0 }}점)</span>
                </div>
              </div>
              <p class="review-content">{{ review.content || '내용 없음' }}</p>
              <div class="review-meta">
                <span class="review-date">{{ formatDate(review.createdAt) }}</span>
                <span v-if="review.visitDate" class="visit-date">
                  방문일: {{ formatVisitDate(review.visitDate) }}
                </span>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>아직 작성한 리뷰가 없습니다.</p>
            <button @click="$router.push('/gyms')" class="btn-primary">클라이밍장 둘러보기</button>
          </div>
        </div>

        <!-- 혼잡도 제보 내역 탭 -->
        <div v-if="activeTab === 'reports'" class="tab-content">
          <div class="content-header">
            <h4>📊 혼잡도 제보 내역</h4>
          </div>

          <div v-if="myReports && Array.isArray(myReports) && myReports.length > 0" class="reports-list">
            <div v-for="report in myReports" :key="report.id" class="report-item" @click="goToGym(report.gym?.id)">
              <div class="report-header">
                <div class="gym-name">🏢 {{ report.gym?.name || '클라이밍장 정보 없음' }}</div>
                <div class="report-level" :class="getCongestionClass(getLevelValue(report.level))">
                  {{ report.level || '정보 없음' }}
                </div>
              </div>
              <div class="report-meta">
                <span class="report-date">{{ formatDate(report.reportedAt) }}</span>
                <span v-if="report.peopleCount" class="people-count">약 {{ report.peopleCount }}명</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>아직 혼잡도 제보 내역이 없습니다.</p>
            <button @click="$router.push('/gyms')" class="btn-primary">혼잡도 제보하기</button>
          </div>
        </div>

        <!-- 즐겨찾기 탭 -->
        <div v-if="activeTab === 'bookmarks'" class="tab-content">
          <div class="content-header">
            <h4>🔖 즐겨찾기한 클라이밍장</h4>
          </div>
          
          <!-- 로딩 상태 -->
          <div v-if="bookmarksLoading" class="loading-section">
            <div class="spinner"></div>
            <p>즐겨찾기 목록을 불러오는 중...</p>
          </div>
          
          <!-- 즐겨찾기 목록 -->
          <div v-else-if="myBookmarks && Array.isArray(myBookmarks) && myBookmarks.length > 0" class="bookmarks-list">
            <div v-for="bookmark in myBookmarks" :key="bookmark.id || bookmark.gymId" 
                 class="bookmark-item" @click="bookmark?.gym?.id && goToGym(bookmark.gym.id)">
              <div class="bookmark-image">
                <div class="placeholder-image">
                  <span class="gym-initial">{{ bookmark?.gym?.name?.charAt(0) || '?' }}</span>
                </div>
                <div v-if="bookmark?.gym?.currentCongestion" class="congestion-badge" 
                     :class="getCongestionClass(bookmark.gym.avgCongestion)">
                  {{ getCongestionText(bookmark.gym.avgCongestion) }}
                </div>
              </div>
              
              <div class="bookmark-info">
                <h5 class="gym-name">{{ bookmark?.gym?.name || '이름 없음' }}</h5>
                <p class="gym-address">📍 {{ bookmark?.gym?.address || '주소 없음' }}</p>
                
                <div class="gym-details">
                  <span class="price-info">💰 일일권: {{ formatPrice(bookmark?.gym?.dayPrice) }}</span>
                  <span v-if="bookmark?.gym?.rating && typeof bookmark.gym.rating === 'number' && bookmark.gym.rating > 0" class="rating-info">
                    ⭐ {{ bookmark.gym.rating.toFixed(1) }}점
                  </span>
                </div>
                
                <div class="bookmark-date">
                  🔖 {{ formatDate(bookmark?.createdAt) }}에 추가
                </div>
              </div>
              
              <div class="bookmark-actions">
                <button @click.stop="removeBookmark(bookmark)" class="btn-remove" 
                        :disabled="!bookmark?.gym?.name">
                  💔 제거
                </button>
                <button @click.stop="bookmark?.gym?.id && goToGym(bookmark.gym.id)" 
                        class="btn-visit" :disabled="!bookmark?.gym?.id">
                  자세히 보기
                </button>
              </div>
            </div>
          </div>
          
          <!-- 즐겨찾기 없음 -->
          <div v-else class="empty-state">
            <div class="empty-icon">🔖</div>
            <h4>아직 즐겨찾기한 클라이밍장이 없어요</h4>
            <p>마음에 드는 클라이밍장을 즐겨찾기에 추가해보세요!</p>
            <button @click="$router.push('/gyms')" class="btn-primary">
              클라이밍장 둘러보기
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 프로필 편집 모달 -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>✏ 프로필 편집</h2>
          <button @click="closeEditModal" class="close-btn">✕</button>
        </div>

        <form @submit.prevent="updateProfile" class="profile-form">
          <!-- 닉네임 -->
          <div class="form-group">
            <label>닉네임 *</label>
            <input v-model="editForm.nickname" type="text" placeholder="닉네임을 입력해주세요" required 
                   minlength="2" maxlength="20">
          </div>

          <!-- 레벨 -->
          <div class="form-group">
            <label>볼더링 레벨</label>
            <select v-model="editForm.level">
              <option value="">레벨 선택 안함</option>
              <option value="V0">V0 - 초급자</option>
              <option value="V1">V1</option>
              <option value="V2">V2</option>
              <option value="V3">V3</option>
              <option value="V4">V4</option>
              <option value="V5">V5</option>
              <option value="V6">V6</option>
              <option value="V7">V7</option>
              <option value="V8">V8 - 고급자</option>
            </select>
          </div>

          <!-- 기술 -->
          <div class="form-group">
            <label>즐겨하는 클라이밍 기술</label>
            <div class="techniques-checkboxes">
              <label v-for="technique in availableTechniques" :key="technique.value" class="technique-checkbox">
                <input type="checkbox" :value="technique.value" v-model="editForm.techniques">
                <span class="technique-name">{{ technique.name }}</span>
              </label>
            </div>
          </div>

          <!-- 지도자격증 -->
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="editForm.hasInstructorLicense">
              클라이밍 지도자격증 보유
            </label>
          </div>

          <!-- 제출 버튼 -->
          <div class="form-actions">
            <button type="button" @click="closeEditModal" class="btn-cancel">취소</button>
            <button type="submit" :disabled="isUpdating" class="btn-submit">
              {{ isUpdating ? '수정 중...' : '프로필 수정' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 성공 메시지 토스트 -->
    <div v-if="showSuccessMessage" class="success-toast">
      <span>{{ successMessage }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MyPageView',
  data() {
    return {
      userData: null,
      isLoading: true,
      activeTab: 'posts',
      showEditModal: false,
      isUpdating: false,
      showSuccessMessage: false,
      successMessage: '',
      
      // 탭 메뉴
      tabs: [
        { key: 'posts', label: '내 게시글', icon: '📝' },
        { key: 'reviews', label: '내 리뷰', icon: '⭐' },
        { key: 'reports', label: '제보 내역', icon: '📊' },
        { key: 'bookmarks', label: '즐겨찾기', icon: '🔖' }
      ],

      // 필터
      postFilter: 'all',

      // 활동 데이터
      myPosts: [],
      myReviews: [],
      myReports: [],
      
      // 🔖 즐겨찾기 관련 추가
      myBookmarks: [],
      bookmarksLoading: false,

      // 프로필 편집 폼
      editForm: {
        nickname: '',
        level: '',
        techniques: [],
        hasInstructorLicense: false
      },

      // 기술 목록
      availableTechniques: [
        { value: "static", name: "스태틱" },
        { value: "dynamic", name: "다이나믹" },
        { value: "lunge", name: "런지" },
        { value: "campus", name: "캠퍼싱" },
        { value: "counter_balance", name: "카운터밸런스" },
        { value: "dead_point", name: "데드포인트" }
      ]
    }
  },
  computed: {
    currentUser() {
      return this.$store.state.loginUser
    }
  },
  methods: {
    // 마이페이지 기본 데이터 로드
    async loadMyPageData() {
      this.isLoading = true
      
      try {
        const response = await this.$axios.get('/api/user/mypage')
        
        if (response.data.success) {
          this.userData = response.data.data
          
          // 초기 데이터 로드
          await Promise.all([
            this.loadMyPosts(),
            this.loadMyReviews(),
            this.loadMyReports(),
            this.loadMyBookmarks()  // 🔖 즐겨찾기도 함께 로드
          ])
        } else {
          alert(response.data.message || '마이페이지를 불러올 수 없습니다.')
          this.$router.push('/')
        }
      } catch (error) {
        console.error('마이페이지 로드 오류:', error)
        alert('마이페이지를 불러올 수 없습니다.')
        this.$router.push('/')
      } finally {
        this.isLoading = false
      }
    },

    // 내 게시글 로드
    async loadMyPosts() {
      try {
        const response = await this.$axios.get('/api/user/my-posts', {
          params: {
            category: this.postFilter === 'all' ? '' : this.postFilter,
            limit: 10
          }
        })
        
        if (response.data.success && Array.isArray(response.data.posts)) {
          this.myPosts = response.data.posts
        } else {
          this.myPosts = []
        }
      } catch (error) {
        console.error('게시글 로드 오류:', error)
        this.myPosts = []
      }
    },

    // 내 리뷰 로드
    async loadMyReviews() {
      try {
        const response = await this.$axios.get('/api/user/my-reviews', {
          params: { limit: 10 }
        })
        
        if (response.data.success && Array.isArray(response.data.reviews)) {
          this.myReviews = response.data.reviews
        } else {
          this.myReviews = []
        }
      } catch (error) {
        console.error('리뷰 로드 오류:', error)
        this.myReviews = []
      }
    },

    // 내 혼잡도 제보 내역 로드
    async loadMyReports() {
      try {
        const response = await this.$axios.get('/api/user/my-congestion-reports', {
          params: { limit: 10 }
        })
        
        if (response.data.success && Array.isArray(response.data.reports)) {
          this.myReports = response.data.reports
        } else {
          this.myReports = []
        }
      } catch (error) {
        console.error('제보 내역 로드 오류:', error)
        this.myReports = []
      }
    },

    // 🔖 즐겨찾기 목록 로드 (안전성 강화)
    async loadMyBookmarks() {
      this.bookmarksLoading = true
      try {
        const response = await this.$axios.get('/api/user/bookmarks', {
          params: { limit: 20 }
        })
        
        if (response.data.success && Array.isArray(response.data.bookmarks)) {
          // 안전한 데이터 매핑 및 필터링
          this.myBookmarks = response.data.bookmarks
            .map(bookmark => ({
              id: bookmark?.id,
              createdAt: bookmark?.createdAt,
              gym: {
                id: bookmark?.gym?.id,
                name: bookmark?.gym?.name || '',
                address: bookmark?.gym?.address || '',
                dayPrice: parseInt(bookmark?.gym?.dayPrice) || 0,
                rating: parseFloat(bookmark?.gym?.rating) || 0,
                avgCongestion: parseFloat(bookmark?.gym?.avgCongestion) || 0,
                currentCongestion: bookmark?.gym?.currentCongestion || null
              }
            }))
            .filter(bookmark => bookmark.id && bookmark.gym.id) // 유효한 데이터만 남기기
        } else {
          this.myBookmarks = []
        }
      } catch (error) {
        console.error('즐겨찾기 로드 오류:', error)
        this.myBookmarks = [] // 에러 시 빈 배열로 설정
      } finally {
        this.bookmarksLoading = false
      }
    },

    // 🔖 즐겨찾기 제거 (안전성 강화)
    async removeBookmark(bookmark) {
      if (!bookmark?.gym?.name) {
        this.showToast('클라이밍장 정보를 찾을 수 없습니다.')
        return
      }

      if (!confirm(`"${bookmark.gym.name}"을(를) 즐겨찾기에서 제거하시겠습니까?`)) {
        return
      }

      try {
        const response = await this.$axios.post(`/api/gyms/${bookmark.gym.id}/bookmark`)
        
        if (response.data.success) {
          this.showToast('즐겨찾기에서 제거되었습니다.')
          // 안전한 필터링
          this.myBookmarks = this.myBookmarks.filter(b => b.id !== bookmark.id)
        }
      } catch (error) {
        console.error('즐겨찾기 제거 오류:', error)
        this.showToast('즐겨찾기 제거 중 오류가 발생했습니다.')
      }
    },

    // 총 활동 점수 계산
    getTotalActivityScore() {
      if (!this.userData?.statistics) return 0
      const { postCount = 0, reviewCount = 0, congestionReportCount = 0 } = this.userData.statistics
      return (postCount * 10) + (reviewCount * 5) + (congestionReportCount * 2)
    },

    // 프로필 편집 모달 열기
    openEditModal() {
      if (!this.userData) return
      
      this.editForm = {
        nickname: this.userData.user.nickname || '',
        level: this.userData.user.level || '',
        techniques: [...(this.userData.user.techniques || [])],
        hasInstructorLicense: this.userData.user.hasInstructorLicense || false
      }
      this.showEditModal = true
    },

    // 프로필 편집 모달 닫기
    closeEditModal() {
      this.showEditModal = false
      this.editForm = {
        nickname: '',
        level: '',
        techniques: [],
        hasInstructorLicense: false
      }
    },

    // 프로필 업데이트
    async updateProfile() {
      if (!this.editForm.nickname.trim()) {
        alert('닉네임을 입력해주세요.')
        return
      }

      this.isUpdating = true

      try {
        const response = await this.$axios.put('/api/user/profile', {
          nickname: this.editForm.nickname.trim(),
          level: this.editForm.level,
          techniques: this.editForm.techniques,
          hasInstructorLicense: this.editForm.hasInstructorLicense
        })

        if (response.data.success) {
          this.showToast('프로필이 성공적으로 수정되었습니다! 🎉')
          
          // 로컬 데이터 업데이트
          this.userData.user = response.data.user
          
          // Vuex 스토어의 사용자 정보도 업데이트
          this.$store.commit('login', response.data.user)
          
          this.closeEditModal()
        } else {
          alert(response.data.message || '프로필 수정에 실패했습니다.')
        }
      } catch (error) {
        console.error('프로필 수정 오류:', error)
        if (error.response?.data?.message) {
          alert(error.response.data.message)
        } else {
          alert('프로필 수정 중 오류가 발생했습니다.')
        }
      } finally {
        this.isUpdating = false
      }
    },

    // 게시글로 이동
    goToPost(postId) {
      if (postId) {
        this.$router.push(`/board/${postId}`)
      }
    },

    // 클라이밍장으로 이동
    goToGym(gymId) {
      if (gymId) {
        this.$router.push(`/gyms/${gymId}`)
      }
    },

    // 토스트 메시지 표시
    showToast(message) {
      this.successMessage = message
      this.showSuccessMessage = true
      setTimeout(() => {
        this.showSuccessMessage = false
      }, 3000)
    },

    // 가격 포맷팅 (안전성 강화)
    formatPrice(price) {
      if (!price || price === 0) return '가격 미정'
      return `${price.toLocaleString()}원`
    },

    // 혼잡도 텍스트 변환
    getCongestionText(level) {
      if (typeof level === 'number') {
        if (level < 0.3) return '여유'
        if (level < 0.6) return '보통'
        if (level < 0.8) return '혼잡'
        return '매우혼잡'
      }
      return level || '정보없음'
    },

    // 유틸리티 함수들
    getTechniqueName(value) {
      const technique = this.availableTechniques.find(t => t.value === value)
      return technique ? technique.name : value
    },

    getCategoryEmoji(category) {
      const emojis = {
        '후기': '⭐',
        '질문': '❓',
        '모임': '👥'
      }
      return emojis[category] || '📝'
    },

    getCongestionClass(level) {
      if (typeof level === 'number') {
        if (level < 0.3) return 'low'
        if (level < 0.6) return 'medium'
        if (level < 0.8) return 'high'
        return 'very-high'
      }
      const classes = {
        '여유': 'low',
        '보통': 'medium',
        '혼잡': 'high',
        '매우혼잡': 'very-high'
      }
      return classes[level] || 'medium'
    },

    getLevelValue(level) {
      const values = {
        '여유': 0.2,
        '보통': 0.5,
        '혼잡': 0.8,
        '매우혼잡': 1.0
      }
      return values[level] || 0.5
    },

    formatDate(date) {
      if (!date) return '날짜 정보 없음'
      
      try {
        const now = new Date()
        const targetDate = new Date(date)
        const diffTime = now - targetDate
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        
        if (diffDays < 0) return '오늘'
        if (diffDays < 1) return '어제'
        if (diffDays < 7) return `${diffDays}일 전`
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`
        return `${Math.floor(diffDays / 30)}개월 전`
      } catch (error) {
        return '날짜 오류'
      }
    },

    formatVisitDate(date) {
      if (!date) return '방문일 정보 없음'
      
      try {
        const visitDate = new Date(date)
        const year = visitDate.getFullYear()
        const month = visitDate.getMonth() + 1
        const day = visitDate.getDate()
        return `${year}년 ${month}월 ${day}일`
      } catch (error) {
        return '방문일 오류'
      }
    }
  },

  watch: {
    // 탭 변경 시 해당 데이터 로드
    activeTab(newTab) {
      switch (newTab) {
        case 'posts':
          this.loadMyPosts()
          break
        case 'reviews':
          this.loadMyReviews()
          break
        case 'reports':
          this.loadMyReports()
          break
        case 'bookmarks':  // 🔖 즐겨찾기 탭 추가
          this.loadMyBookmarks()
          break
      }
    }
  },

  async created() {
    // 로그인 체크
    if (!this.currentUser) {
      alert('로그인이 필요합니다.')
      this.$router.push('/')
      return
    }

    await this.loadMyPageData()
  }
}
</script>

<style scoped>
/* 기존 스타일들 */
.mypage {
  min-height: 100vh;
  background: #f8f9fa;
  padding: 2rem 0;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.profile-section {
  margin-bottom: 2rem;
}

.profile-card {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.profile-avatar {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-text {
  font-size: 2.5rem;
  font-weight: bold;
  color: white;
}

.profile-info {
  flex: 1;
}

.profile-name {
  font-size: 2rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 0.5rem;
}

.profile-badges {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.level-badge {
  background: #667eea;
  color: white;
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: bold;
}

.instructor-badge {
  background: #ff9800;
  color: white;
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: bold;
}

.profile-techniques {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.techniques-label {
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.technique-tag {
  background: #f0f0f0;
  color: #667eea;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.join-date {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.btn-edit-profile {
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-edit-profile:hover {
  background: #5a67d8;
}

/* 통계 섹션 */
.stats-section {
  margin-bottom: 2rem;
}

.stats-section h3 {
  color: #333;
  margin-bottom: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 3px 10px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-3px);
}

.stat-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 0.3rem;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

/* 탭 섹션 */
.tabs-section {
  background: white;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  overflow: hidden;
}

.tabs-header {
  display: flex;
  border-bottom: 1px solid #eee;
}

.tab-button {
  flex: 1;
  padding: 1rem;
  border: none;
  background: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  transition: all 0.2s;
}

.tab-button:hover {
  background: #f8f9fa;
}

.tab-button.active {
  background: #667eea;
  color: white;
}

.tab-content {
  padding: 2rem;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.content-header h4 {
  color: #333;
  margin: 0;
}

.filter-controls select {
  padding: 6px 12px;
  border: 2px solid #e1e5e9;
  border-radius: 6px;
  font-size: 14px;
}

/* 리스트 공통 스타일 */
.posts-list, .reviews-list, .reports-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* 게시글 아이템 */
.post-item {
  padding: 1.5rem;
  border: 1px solid #eee;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.post-item:hover {
  background: #f8f9fa;
  border-color: #667eea;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.post-category {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.post-category.후기 { background: #4caf50; }
.post-category.질문 { background: #2196f3; }
.post-category.모임 { background: #ff9800; }

.post-date {
  color: #999;
  font-size: 12px;
}

.post-title {
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.post-gym {
  color: #667eea;
  font-size: 13px;
  margin-bottom: 0.5rem;
}

.post-stats {
  display: flex;
  gap: 1rem;
  font-size: 13px;
  color: #666;
}

/* 리뷰 아이템 */
.review-item {
  padding: 1.5rem;
  border: 1px solid #eee;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.review-item:hover {
  background: #f8f9fa;
  border-color: #667eea;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.gym-name {
  font-weight: 600;
  color: #333;
}

.review-rating {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.star {
  color: #ddd;
  font-size: 1rem;
}

.star.filled {
  color: #ff9800;
}

.rating-text {
  color: #666;
  font-size: 13px;
}

.review-content {
  color: #333;
  line-height: 1.5;
  margin-bottom: 0.8rem;
}

.review-meta {
  display: flex;
  gap: 1rem;
  font-size: 12px;
  color: #666;
}

/* 제보 아이템 */
.report-item {
  padding: 1.5rem;
  border: 1px solid #eee;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.report-item:hover {
  background: #f8f9fa;
  border-color: #667eea;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.report-level {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.report-level.low { background: #4caf50; }
.report-level.medium { background: #ff9800; }
.report-level.high { background: #f44336; }
.report-level.very-high { background: #9c27b0; }

.report-meta {
  display: flex;
  gap: 1rem;
  font-size: 12px;
  color: #666;
}

/* 🔖 즐겨찾기 관련 스타일 추가 */
.bookmarks-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.bookmark-item {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  border: 1px solid #eee;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.bookmark-item:hover {
  background: #f8f9fa;
  border-color: #667eea;
  transform: translateY(-2px);
}

.bookmark-image {
  position: relative;
  flex-shrink: 0;
}

.bookmark-image .placeholder-image {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bookmark-image .gym-initial {
  font-size: 1.8rem;
  font-weight: bold;
  color: white;
}

.congestion-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: bold;
  color: white;
}

.congestion-badge.low { background: #4caf50; }
.congestion-badge.medium { background: #ff9800; }
.congestion-badge.high { background: #f44336; }
.congestion-badge.very-high { background: #9c27b0; }

.bookmark-info {
  flex: 1;
}

.bookmark-info .gym-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.bookmark-info .gym-address {
  color: #666;
  font-size: 14px;
  margin-bottom: 0.8rem;
}

.gym-details {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
  font-size: 13px;
  color: #666;
}

.bookmark-date {
  font-size: 12px;
  color: #999;
}

.bookmark-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn-remove, .btn-visit {
  padding: 6px 12px;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-remove {
  background: #fee;
  color: #d32f2f;
}

.btn-remove:hover {
  background: #f44336;
  color: white;
}

.btn-visit {
  background: #667eea;
  color: white;
}

.btn-visit:hover {
  background: #5a67d8;
}

/* 빈 상태 */
.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  color: #666;
}

.empty-state .empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h4 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.3rem;
}

.empty-state p {
  margin-bottom: 1.5rem;
}

.btn-primary {
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #5a67d8;
}

/* 로딩 섹션 */
.loading-section {
  text-align: center;
  padding: 3rem 2rem;
  color: #666;
}

/* 모달 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  color: #333;
  font-size: 1.3rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 5px;
  border-radius: 50%;
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #f0f0f0;
}

/* 프로필 편집 폼 */
.profile-form {
  padding: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-group input, .form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group input:focus, .form-group select:focus {
  outline: none;
  border-color: #667eea;
}

.techniques-checkboxes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.8rem;
  margin-top: 0.5rem;
}

.technique-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.technique-checkbox:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.technique-checkbox input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.technique-name {
  font-size: 14px;
  color: #333;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: normal !important;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.btn-cancel, .btn-submit {
  padding: 12px 24px;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-submit {
  background: #667eea;
  color: white;
}

.btn-submit:hover:not(:disabled) {
  background: #5a67d8;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 성공 토스트 */
.success-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #4caf50;
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
  z-index: 1001;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .container {
    padding: 0 15px;
  }

  .mypage {
    padding: 1rem 0;
  }

  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .profile-info {
    text-align: center;
  }

  .profile-name {
    font-size: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .tabs-header {
    flex-wrap: wrap;
  }

  .tab-button {
    flex: none;
    min-width: 50%;
    font-size: 13px;
  }

  .tab-content {
    padding: 1.5rem;
  }

  .content-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .techniques-checkboxes {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-cancel, .btn-submit {
    width: 100%;
  }

  .bookmark-item {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .bookmark-actions {
    flex-direction: row;
    width: 100%;
  }
  
  .btn-remove, .btn-visit {
    flex: 1;
  }
}

@media (max-width: 480px) {
  .profile-card {
    padding: 1.5rem;
  }

  .tab-content {
    padding: 1rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .modal-content {
    margin: 10px;
    max-height: 95vh;
  }

  .modal-header {
    padding: 1rem;
  }

  .profile-form {
    padding: 1rem;
  }
}
</style>