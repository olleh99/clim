<template>
  <div class="main-page">
    <!-- 히어로 섹션 -->
    <section class="hero">
      <div class="hero-content">
        <h2>클라이밍 커뮤니티에 오신 것을 환영합니다!</h2>
        <p>입문자부터 고수까지, 함께 클라이밍 정보를 공유하고 소통해요</p>
        <div class="hero-buttons">
          <router-link to="/gyms" class="btn-primary">근처 클라이밍장 찾기</router-link>
          <router-link to="/board" class="btn-secondary">커뮤니티 보기</router-link>
        </div>
      </div>
    </section>

    <!-- 🤖 개인화 추천 섹션 (로그인한 사용자만) -->
    <section v-if="currentUser" class="recommendations-section">
      <div class="container">
        <RecommendationSection />
      </div>
    </section>

    <!-- 검색 바 -->
    <section class="search-section">
      <div class="container">
        <div class="search-bar">
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="클라이밍장이나 게시글을 검색해보세요..."
            @keypress.enter="search"
          >
          <button @click="search" class="search-btn">🔍</button>
        </div>
      </div>
    </section>

    <!-- 인기 클라이밍장 미리보기 -->
    <section class="popular-gyms">
      <div class="container">
        <div class="section-header">
          <h3>🏆 인기 클라이밍장</h3>
          <div v-if="currentUser" class="recommendation-toggle">
            <label class="toggle-label">
              <input 
                type="checkbox" 
                v-model="showPersonalized" 
                @change="toggleRecommendationMode"
              >
              <span class="toggle-slider"></span>
              개인화 추천 보기
            </label>
          </div>
        </div>

        <!-- 로딩 상태 -->
        <div v-if="gymsLoading" class="loading-section">
          <div class="spinner"></div>
          <p>클라이밍장 정보를 불러오는 중...</p>
        </div>

        <!-- 클라이밍장 목록 -->
        <div v-else-if="displayGyms.length > 0" class="gyms-grid">
          <div v-for="(gym, index) in displayGyms" :key="gym.id" class="gym-card" @click="goToGymDetail(gym.id)">
            <!-- 추천 점수 (개인화 모드일 때만) -->
            <div v-if="showPersonalized && gym.recommendationScore" class="recommendation-score">
              <span class="score-value">{{ Math.round(gym.recommendationScore) }}</span>
              <span class="score-label">추천도</span>
            </div>
            
            <!-- 인기 순위 (일반 모드일 때만) -->
            <div v-else class="popularity-rank">
              {{ index + 1 }}
            </div>

            <div class="gym-image">
              <div class="placeholder-image">
                <span class="gym-initial">{{ getGymInitial(gym.name) }}</span>
              </div>
              <div class="congestion-badge" :class="getCongestionClass(gym.avgCongestion)">
                {{ getCongestionText(gym.avgCongestion) }}
              </div>
            </div>
            
            <div class="gym-info">
              <h4>{{ gym.name }}</h4>
              <p class="gym-location">📍 {{ gym.address }}</p>
              <p class="gym-price" v-if="gym.dayPrice">💰 일일권: {{ formatPrice(gym.dayPrice) }}</p>
              
              <!-- 추천 이유 (개인화 모드일 때만) -->
              <div v-if="showPersonalized && gym.recommendationReason" class="recommendation-hint">
                💡 {{ gym.recommendationReason }}
              </div>
              
              <div class="view-details">
                자세히 보기
              </div>
            </div>
          </div>
        </div>

        <!-- 클라이밍장 없음 -->
        <div v-else class="empty-section">
          <p>등록된 클라이밍장이 없습니다.</p>
          <router-link to="/gyms" class="btn-outline">첫 번째 클라이밍장 추가하기</router-link>
        </div>
      </div>
    </section>

    <!-- 최근 게시판 글 -->
    <section class="recent-posts">
      <div class="container">
        <div class="section-header">
          <h3>📝 최근 게시글</h3>
          <router-link to="/board" class="view-all-link">전체 보기 →</router-link>
        </div>

        <!-- 로딩 상태 -->
        <div v-if="postsLoading" class="loading-section">
          <div class="spinner"></div>
          <p>최근 게시글을 불러오는 중...</p>
        </div>

        <!-- 게시글 목록 -->
        <div v-else-if="recentPosts.length > 0" class="posts-list">
          <div v-for="post in recentPosts" :key="post.id" class="post-item" @click="goToPost(post.id)">
            <div class="post-main">
              <div class="post-header">
                <span class="post-category" :class="post.category">
                  {{ getCategoryEmoji(post.category) }} {{ post.category }}
                </span>
                <span class="post-date">{{ formatDate(post.createdAt) }}</span>
              </div>
              <h4 class="post-title">{{ post.title }}</h4>
              <p class="post-preview">{{ getContentPreview(post.content) }}</p>
              
              <!-- 클라이밍장 정보 (있는 경우) -->
              <div v-if="post.meetingGym" class="post-gym">
                🏢 {{ post.meetingGym.name }}
              </div>
              
              <!-- 모임 정보 (모임 글인 경우) -->
              <div v-if="post.category === '모임' && post.meetingDate" class="meeting-info">
                📅 {{ formatMeetingDate(post.meetingDate) }}
                👥 {{ post.maxPeople }}명 모집
              </div>
            </div>

            <div class="post-meta">
              <div class="post-author">
                <span class="author-name">{{ post.author.nickname }}</span>
                <span v-if="post.author.level" class="author-level">{{ post.author.level }}</span>
                <span v-if="post.author.hasInstructorLicense" class="instructor-badge">🏅</span>
              </div>
              <div class="post-stats">
                <span class="stat-item">❤️ {{ post.likes }}</span>
                <span class="stat-item">👁 {{ post.views }}</span>
                <span class="stat-item">💬 {{ post.comments.length }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 게시글 없음 -->
        <div v-else class="empty-section">
          <p>아직 작성된 게시글이 없습니다.</p>
          <router-link to="/board/write" class="btn-outline">첫 번째 글 작성하기</router-link>
        </div>

        <!-- 더 보기 버튼 -->
        <div v-if="recentPosts.length > 0" class="view-more">
          <router-link to="/board" class="btn-outline">더 많은 게시글 보기</router-link>
        </div>
      </div>
    </section>

    <!-- 실시간 혼잡도 현황 -->
    <section class="congestion-status">
      <div class="container">
        <h3>📊 실시간 클라이밍장 현황</h3>
        <div v-if="congestionGyms.length > 0" class="congestion-grid">
          <div v-for="gym in congestionGyms" :key="gym.id" class="status-card" @click="goToGymDetail(gym.id)">
            <h4>{{ gym.name }}</h4>
            <div class="congestion-meter">
              <div class="meter-bar">
                <div
                  class="meter-fill"
                  :style="{ width: (gym.avgCongestion * 100) + '%' }"
                  :class="getCongestionClass(gym.avgCongestion)"
                ></div>
              </div>
              <p class="congestion-text">{{ getCongestionText(gym.avgCongestion) }}</p>
            </div>
            <p class="gym-address">{{ gym.address }}</p>
          </div>
        </div>
        <div v-else class="empty-section">
          <p>혼잡도 정보가 없습니다.</p>
        </div>
      </div>
    </section>

    <!-- 푸터 -->
    <footer class="footer">
      <div class="container">
        <p>&copy; 2025 붙잡아줘요. 클라이밍 커뮤니티 플랫폼</p>
      </div>
    </footer>
  </div>
</template>

<script>
import RecommendationSection from '@/components/RecommendationSection.vue'

export default {
  name: 'MainPage',
  components: {
    RecommendationSection
  },
  data() {
    return {
      searchKeyword: '',
      showPersonalized: false,
      // 로딩 상태
      postsLoading: true,
      gymsLoading: true,
      // 데이터
      recentPosts: [],
      popularGyms: [],
      recommendedGyms: [],
      congestionGyms: []
    }
  },
  computed: {
    currentUser() {
      return this.$store.state.loginUser
    },
    displayGyms() {
      // 개인화 모드가 활성화되고 추천 데이터가 있으면 추천 클라이밍장 표시
      if (this.showPersonalized && this.recommendedGyms.length > 0) {
        return this.recommendedGyms.slice(0, 3)
      }
      // 아니면 인기 클라이밍장 표시
      return this.popularGyms
    }
  },
  methods: {
    // 🏢 클라이밍장 데이터 로드
    async loadGyms() {
      this.gymsLoading = true
      try {
        const response = await this.$axios.get('/api/gyms')
        if (response.data.success) {
          const allGyms = response.data.gyms
          // 인기 클라이밍장 (최근 3개만)
          this.popularGyms = allGyms.slice(0, 3)
          // 혼잡도 현황용 (모든 클라이밍장)
          this.congestionGyms = allGyms
        }
      } catch (error) {
        console.error('클라이밍장 데이터 로드 오류:', error)
      } finally {
        this.gymsLoading = false
      }
    },

    // 🤖 개인화 추천 클라이밍장 로드
    async loadRecommendedGyms() {
      if (!this.currentUser) return
      
      try {
        const response = await this.$axios.get('/api/recommendations/gyms', {
          params: { limit: 3 }
        })
        if (response.data.success) {
          this.recommendedGyms = response.data.recommendations
        }
      } catch (error) {
        console.error('추천 클라이밍장 로드 오류:', error)
        // 추천 실패시 일반 모드로 폴백
        this.showPersonalized = false
      }
    },

    // 📝 최근 게시글 로드
    async loadRecentPosts() {
      this.postsLoading = true
      try {
        // 최근 5개 게시글만 가져오기
        const response = await this.$axios.get('/api/posts', {
          params: {
            page: 1,
            limit: 5,
            sortBy: 'latest'
          }
        })
        if (response.data.success) {
          this.recentPosts = response.data.posts
        }
      } catch (error) {
        console.error('최근 게시글 로드 오류:', error)
        // 에러가 발생해도 빈 배열로 초기화
        this.recentPosts = []
      } finally {
        this.postsLoading = false
      }
    },

    // 🔄 추천 모드 토글
    async toggleRecommendationMode() {
      if (this.showPersonalized && this.recommendedGyms.length === 0) {
        // 개인화 모드로 전환하는데 추천 데이터가 없으면 로드
        await this.loadRecommendedGyms()
      }
    },

    // 🔍 검색 기능
    search() {
      if (this.searchKeyword.trim()) {
        // 검색어를 가지고 게시판으로 이동
        this.$router.push({
          path: '/board',
          query: { search: this.searchKeyword.trim() }
        })
      }
    },

    // 📍 클라이밍장 상세로 이동
    goToGymDetail(gymId) {
      this.$router.push(`/gyms/${gymId}`)
    },

    // 📝 게시글 상세로 이동
    goToPost(postId) {
      this.$router.push(`/board/${postId}`)
    },

    // 클라이밍장 이름 첫 글자
    getGymInitial(name) {
      return name.charAt(0)
    },

    // 카테고리 이모지
    getCategoryEmoji(category) {
      const emojis = {
        '후기': '⭐',
        '질문': '❓',
        '모임': '👥'
      }
      return emojis[category] || '📝'
    },

    // 내용 미리보기 (50글자로 제한)
    getContentPreview(content) {
      return content.length > 50 ? content.substring(0, 50) + '...' : content
    },

    // 혼잡도 클래스
    getCongestionClass(congestion) {
      if (congestion < 0.4) return 'low'
      if (congestion < 0.7) return 'medium'
      return 'high'
    },

    // 혼잡도 텍스트
    getCongestionText(congestion) {
      if (congestion < 0.4) return '여유'
      if (congestion < 0.7) return '보통'
      return '혼잡'
    },

    // 가격 포맷팅
    formatPrice(price) {
      return price ? `${price.toLocaleString()}원` : '가격 미정'
    },

    // 날짜 포맷팅
    formatDate(date) {
      const now = new Date()
      const targetDate = new Date(date)
      const diffTime = now - targetDate
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays < 0) return '오늘'
      if (diffDays < 1) return '어제'
      if (diffDays < 7) return `${diffDays}일 전`
      return `${Math.floor(diffDays / 7)}주 전`
    },

    // 모임 날짜 포맷팅
    formatMeetingDate(date) {
      const meetingDate = new Date(date)
      const month = meetingDate.getMonth() + 1
      const day = meetingDate.getDate()
      const hours = meetingDate.getHours()
      const minutes = meetingDate.getMinutes()
      return `${month}/${day} ${hours}:${minutes.toString().padStart(2, '0')}`
    }
  },

  // 페이지 로드 시 데이터 가져오기
  async created() {
    // 병렬로 데이터 로드 (동시에 실행)
    await Promise.all([
      this.loadRecentPosts(),
      this.loadGyms()
    ])

    // 로그인한 사용자면 추천 데이터도 미리 로드
    if (this.currentUser) {
      await this.loadRecommendedGyms()
    }
  }
}
</script>

<style scoped>
/* 기존 스타일은 그대로 유지하고 새로운 스타일만 추가 */

/* 추천 섹션 */
.recommendations-section {
  background: #f8f9fa;
  padding: 3rem 0;
}

/* 토글 스위치 */
.recommendation-toggle {
  display: flex;
  align-items: center;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.toggle-label input[type="checkbox"] {
  display: none;
}

.toggle-slider {
  position: relative;
  width: 50px;
  height: 24px;
  background: #e1e5e9;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.toggle-label input[type="checkbox"]:checked + .toggle-slider {
  background: #667eea;
}

.toggle-label input[type="checkbox"]:checked + .toggle-slider::before {
  transform: translateX(26px);
}

/* 추천 점수 */
.recommendation-score {
  position: absolute;
  top: 10px;
  right: 10px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 8px;
  border-radius: 50%;
  text-align: center;
  min-width: 50px;
  z-index: 2;
}

.score-value {
  display: block;
  font-weight: bold;
  font-size: 16px;
}

.score-label {
  display: block;
  font-size: 10px;
  opacity: 0.9;
}

/* 인기 순위 */
.popularity-rank {
  position: absolute;
  top: 10px;
  left: 10px;
  background: linear-gradient(135deg, #ff9800, #ffb74d);
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  z-index: 2;
}

/* 추천 힌트 */
.recommendation-hint {
  background: #f8f9ff;
  color: #667eea;
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 12px;
  margin-bottom: 0.5rem;
  border-left: 3px solid #667eea;
}

/* 전체 페이지 */
.main-page {
  min-height: 100vh;
  background: #f8f9fa;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 로딩 섹션 */
.loading-section {
  text-align: center;
  padding: 3rem 2rem;
  color: #666;
}

.spinner {
  width: 30px;
  height: 30px;
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

/* 빈 섹션 */
.empty-section {
  text-align: center;
  padding: 3rem 2rem;
  color: #666;
}

.empty-section p {
  margin-bottom: 1.5rem;
  font-size: 16px;
}

/* 히어로 섹션 */
.hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4rem 0;
  text-align: center;
}

.hero-content h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.hero-content p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-primary, .btn-secondary {
  padding: 12px 24px;
  border-radius: 25px;
  text-decoration: none;
  font-weight: bold;
  transition: transform 0.2s;
}

.btn-primary {
  background: white;
  color: #667eea;
}

.btn-secondary {
  background: transparent;
  color: white;
  border: 2px solid white;
}

.btn-primary:hover, .btn-secondary:hover {
  transform: translateY(-2px);
}

/* 검색 섹션 */
.search-section {
  padding: 2rem 0;
  background: white;
}

.search-bar {
  display: flex;
  max-width: 600px;
  margin: 0 auto;
  border: 2px solid #e1e5e9;
  border-radius: 25px;
  overflow: hidden;
}

.search-bar input {
  flex: 1;
  padding: 12px 20px;
  border: none;
  outline: none;
  font-size: 16px;
}

.search-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 12px 20px;
  cursor: pointer;
  font-size: 16px;
}

/* 섹션 공통 스타일 */
section {
  padding: 3rem 0;
}

section h3 {
  font-size: 1.8rem;
  margin-bottom: 2rem;
  text-align: center;
  color: #333;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-header h3 {
  margin-bottom: 0;
  text-align: left;
}

.view-all-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
}

.view-all-link:hover {
  text-decoration: underline;
}

/* 인기 클라이밍장 */
.popular-gyms {
  background: white;
}

.gyms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.gym-card {
  position: relative;
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  transition: transform 0.2s;
  cursor: pointer;
}

.gym-card:hover {
  transform: translateY(-5px);
}

.gym-image {
  position: relative;
  height: 150px;
  overflow: hidden;
}

.placeholder-image {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.gym-initial {
  font-size: 2.5rem;
  font-weight: bold;
  color: white;
}

.congestion-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.congestion-badge.low { background: #4caf50; }
.congestion-badge.medium { background: #ff9800; }
.congestion-badge.high { background: #f44336; }

.gym-info {
  padding: 1.5rem;
}

.gym-info h4 {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.gym-location, .gym-price {
  margin: 0.5rem 0;
  color: #666;
  font-size: 14px;
}

.view-details {
  display: inline-block;
  margin-top: 1rem;
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border-radius: 20px;
  font-size: 14px;
  transition: background 0.2s;
}

.view-details:hover {
  background: #5a67d8;
}

/* 최근 게시글 */
.recent-posts {
  background: #f8f9fa;
}

.posts-list {
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.post-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
  gap: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.post-item:hover {
  background: #fafafa;
}

.post-item:last-child {
  border-bottom: none;
}

.post-main {
  flex: 1;
}

.post-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.8rem;
  flex-wrap: wrap;
}

.post-category {
  padding: 4px 12px;
  border-radius: 15px;
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
  line-height: 1.4;
}

.post-preview {
  color: #666;
  margin-bottom: 0.8rem;
  line-height: 1.5;
  font-size: 14px;
}

.post-gym {
  color: #667eea;
  font-size: 13px;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.meeting-info {
  color: #f57c00;
  font-size: 13px;
  font-weight: 500;
}

.post-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.8rem;
  min-width: 150px;
}

.post-author {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.author-name {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.author-level {
  background: #667eea;
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: bold;
}

.instructor-badge {
  font-size: 12px;
}

.post-stats {
  display: flex;
  gap: 0.8rem;
}

.stat-item {
  color: #666;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 0.2rem;
}

.view-more {
  text-align: center;
  margin-top: 2rem;
}

.btn-outline {
  display: inline-block;
  padding: 10px 24px;
  border: 2px solid #667eea;
  color: #667eea;
  text-decoration: none;
  border-radius: 25px;
  font-weight: bold;
  transition: all 0.2s;
}

.btn-outline:hover {
  background: #667eea;
  color: white;
}

/* 혼잡도 현황 */
.congestion-status {
  background: white;
}

.congestion-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.status-card {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 15px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.status-card:hover {
  transform: translateY(-3px);
}

.status-card h4 {
  margin-bottom: 1rem;
  color: #333;
  font-size: 1.1rem;
}

.congestion-meter {
  margin-bottom: 1rem;
}

.meter-bar {
  height: 8px;
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.meter-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.meter-fill.low { background: #4caf50; }
.meter-fill.medium { background: #ff9800; }
.meter-fill.high { background: #f44336; }

.congestion-text {
  font-weight: bold;
  margin: 0 0 0.5rem 0;
  color: #333;
}

.gym-address {
  color: #666;
  font-size: 13px;
  margin: 0;
}

/* 푸터 */
.footer {
  background: #333;
  color: white;
  padding: 2rem 0;
  text-align: center;
}

/* 반응형 */
@media (max-width: 768px) {
  .hero-content h2 {
    font-size: 2rem;
  }

  .hero-buttons {
    flex-direction: column;
    align-items: center;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .post-item {
    flex-direction: column;
    align-items: stretch;
  }

  .post-meta {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    min-width: auto;
  }

  .post-author {
    justify-content: flex-start;
  }

  .gyms-grid {
    grid-template-columns: 1fr;
  }

  .congestion-grid {
    grid-template-columns: 1fr;
  }

  .recommendation-toggle {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 0 15px;
  }
  
  .hero {
    padding: 2rem 0;
  }
  
  .hero-content h2 {
    font-size: 1.8rem;
  }
  
  .gym-info, .post-item {
    padding: 1rem;
  }
}
</style>