<template>
  <div class="gym-detail-page">
    <!-- 로딩 상태 -->
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <p>클라이밍장 정보를 불러오는 중...</p>
    </div>

    <!-- 클라이밍장 정보 -->
    <div v-else-if="gym" class="container">
      <!-- 뒤로가기 버튼 -->
      <div class="back-button">
        <button @click="goBack" class="btn-back">← 목록으로 돌아가기</button>
      </div>

      <!-- 메인 정보 카드 -->
      <div class="gym-main-card">
        <div class="gym-header">
          <div class="gym-image">
            <div class="placeholder-image">
              <span class="gym-initial">{{ gym.name ? gym.name.charAt(0) : 'G' }}</span>
            </div>
            <div class="gym-badge">
              <span class="congestion-badge" :class="getCongestionClass(gym.avgCongestion)">
                {{ getCongestionText(gym.avgCongestion) }}
              </span>
            </div>
          </div>
          
          <div class="gym-info">
            <h1 class="gym-name">{{ gym.name || '클라이밍장' }}</h1>
            <p class="gym-address">📍 {{ gym.address || '주소 정보 없음' }}</p>
            
            <!-- 기본 정보 -->
            <div class="gym-details">
              <div class="detail-item" v-if="gym.phone">
                <span class="label">📞 전화번호:</span>
                <span class="value">{{ gym.phone }}</span>
              </div>
              <div class="detail-item">
                <span class="label">💰 일일권:</span>
                <span class="value">{{ formatPrice(gym.dayPrice) }}</span>
              </div>
              <div class="detail-item" v-if="gym.monthPrice">
                <span class="label">💳 월권:</span>
                <span class="value">{{ formatPrice(gym.monthPrice) }}</span>
              </div>
              <div class="detail-item" v-if="gym.openTime && gym.closeTime">
                <span class="label">🕐 운영시간:</span>
                <span class="value">{{ formatTime(gym.openTime) }} - {{ formatTime(gym.closeTime) }}</span>
              </div>
              <div class="detail-item" v-if="gym.restDay">
                <span class="label">🚫 휴무일:</span>
                <span class="value">{{ gym.restDay }}</span>
              </div>
              <div class="detail-item" v-if="gym.website">
                <span class="label">🌐 웹사이트:</span>
                <a :href="gym.website" target="_blank" class="website-link">{{ gym.website }}</a>
              </div>
            </div>

            <!-- 액션 버튼 -->
            <div class="action-buttons">
              <button @click="toggleBookmark" class="btn-bookmark" :class="{ bookmarked: gym.isBookmarked }">
                {{ gym.isBookmarked ? '💚' : '🤍' }} 즐겨찾기
              </button>
              <button @click="showCongestionModal = true" class="btn-congestion">
                📊 혼잡도 제보
              </button>
            </div>
          </div>
        </div>

        <!-- 설명 -->
        <div v-if="gym.description" class="gym-description">
          <h3>📝 소개</h3>
          <p>{{ gym.description }}</p>
        </div>

        <!-- 기술 태그 -->
        <div v-if="gym.techniques && Array.isArray(gym.techniques) && gym.techniques.length > 0" class="gym-techniques">
          <h3>🎯 주요 기술</h3>
          <div class="technique-tags">
            <span v-for="tech in gym.techniques" :key="tech" class="technique-tag">
              {{ getTechniqueName(tech) }}
            </span>
          </div>
        </div>
      </div>

      <!-- 실시간 혼잡도 현황 -->
      <div class="congestion-section">
        <h3>📊 실시간 혼잡도 현황</h3>
        <div class="congestion-stats">
          <div class="current-congestion">
            <div class="congestion-meter">
              <div class="meter-bar">
                <div class="meter-fill" :style="{ width: ((gym.avgCongestion || 0.5) * 100) + '%' }" 
                     :class="getCongestionClass(gym.avgCongestion || 0.5)"></div>
              </div>
              <p class="congestion-text">{{ getCongestionText(gym.avgCongestion || 0.5) }}</p>
            </div>
            <div class="congestion-info">
              <p><strong>평균 혼잡도:</strong> {{ Math.round((gym.avgCongestion || 0.5) * 100) }}%</p>
              <p v-if="gym.lastCongestionUpdate">
                <strong>최근 업데이트:</strong> {{ formatDate(gym.lastCongestionUpdate) }}
              </p>
            </div>
          </div>
        </div>

        <!-- 최근 혼잡도 제보 -->
        <div v-if="gym.congestionReports && Array.isArray(gym.congestionReports) && gym.congestionReports.length > 0" class="recent-reports">
          <h4>최근 혼잡도 제보</h4>
          <div class="reports-list">
            <div v-for="report in gym.congestionReports.slice(0, 5)" :key="report.id" class="report-item">
              <div class="report-level" :class="getCongestionClass(getLevelValue(report.level))">
                {{ report.level }}
              </div>
              <div class="report-info">
                <span class="reporter">{{ report.reporter?.nickname || '익명' }}</span>
                <span class="report-time">{{ formatDate(report.reportedAt) }}</span>
              </div>
              <div v-if="report.peopleCount" class="people-count">
                약 {{ report.peopleCount }}명
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 리뷰 섹션 - 안전한 props 전달 -->
      <GymReviews 
        v-if="gym && gym.id" 
        :gymId="Number(gym.id)" 
        :gymRating="Number(gym.rating) || 0" 
        @rating-updated="handleRatingUpdated" 
      />

      <!-- 관련 게시글 -->
      <div class="related-posts-section">
        <h3>📝 관련 게시글</h3>
        <div v-if="relatedPosts && relatedPosts.length > 0" class="posts-list">
          <div v-for="post in relatedPosts" :key="post.id" class="post-item" @click="goToPost(post.id)">
            <div class="post-category" :class="post.category">
              {{ getCategoryEmoji(post.category) }} {{ post.category }}
            </div>
            <h4 class="post-title">{{ post.title }}</h4>
            <div class="post-meta">
              <span class="author">{{ post.author?.nickname || '익명' }}</span>
              <span class="date">{{ formatDate(post.createdAt) }}</span>
            </div>
            <div class="post-stats">
              <span>❤ {{ post.likes || 0 }}</span>
              <span>👁 {{ post.views || 0 }}</span>
              <span>💬 {{ (post.comments && Array.isArray(post.comments)) ? post.comments.length : 0 }}</span>
            </div>
          </div>
        </div>
        <div v-else class="no-posts">
          <p>아직 관련 게시글이 없습니다.</p>
          <button @click="writePost" class="btn-write">첫 번째 후기 작성하기</button>
        </div>
      </div>

      <!-- 통계 정보 -->
      <div class="stats-section">
        <h3>📈 통계</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">{{ gym.viewCount || 0 }}</div>
            <div class="stat-label">조회수</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ gym.reviewCount || 0 }}</div>
            <div class="stat-label">리뷰 수</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ (gym.congestionReports && Array.isArray(gym.congestionReports)) ? gym.congestionReports.length : 0 }}</div>
            <div class="stat-label">혼잡도 제보</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ (relatedPosts && Array.isArray(relatedPosts)) ? relatedPosts.length : 0 }}</div>
            <div class="stat-label">관련 게시글</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 에러 상태 -->
    <div v-else class="error-container">
      <div class="error-content">
        <h2>😕 클라이밍장을 찾을 수 없습니다</h2>
        <p>삭제되었거나 존재하지 않는 클라이밍장입니다.</p>
        <button @click="goBack" class="btn-primary">목록으로 돌아가기</button>
      </div>
    </div>

    <!-- 혼잡도 제보 모달 -->
    <div v-if="showCongestionModal" class="modal-overlay" @click="closeCongestionModal">
      <div class="modal-content congestion-modal" @click.stop>
        <div class="modal-header">
          <h2>📊 {{ gym?.name || '클라이밍장' }} 혼잡도 제보</h2>
          <button @click="closeCongestionModal" class="close-btn">✕</button>
        </div>
        <div class="congestion-form">
          <p>현재 이 클라이밍장의 혼잡도는 어떤가요?</p>
          <div class="congestion-levels">
            <label v-for="level in congestionLevels" :key="level.value" 
                   class="congestion-level" :class="{ selected: selectedCongestionLevel === level.value }">
              <input type="radio" :value="level.value" v-model="selectedCongestionLevel">
              <div class="level-content">
                <span class="level-emoji">{{ level.emoji }}</span>
                <span class="level-text">{{ level.text }}</span>
              </div>
            </label>
          </div>
          <div class="form-group">
            <label>대략적인 인원 수 (선택사항)</label>
            <input v-model.number="estimatedPeople" type="number" min="0" max="100" placeholder="예: 15">
          </div>
          <div class="form-actions">
            <button @click="closeCongestionModal" class="btn-cancel">취소</button>
            <button @click="submitCongestion" :disabled="!selectedCongestionLevel || isSubmittingCongestion" 
                    class="btn-submit">
              {{ isSubmittingCongestion ? '제보 중...' : '혼잡도 제보하기' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 성공 메시지 토스트 -->
    <div v-if="showSuccessMessage" class="success-toast">
      <span>{{ successMessage }}</span>
    </div>
  </div>
</template>

<script>
import GymReviews from '@/components/GymReviews.vue'

export default {
  name: 'GymDetailView',
  components: {
    GymReviews
  },
  data() {
    return {
      gym: null,
      relatedPosts: [],
      isLoading: true,
      showCongestionModal: false,
      selectedCongestionLevel: '',
      estimatedPeople: null,
      isSubmittingCongestion: false,
      showSuccessMessage: false,
      successMessage: '',
      
      congestionLevels: [
        { value: '여유', text: '여유', emoji: '😌' },
        { value: '보통', text: '보통', emoji: '😐' },
        { value: '혼잡', text: '혼잡', emoji: '😰' },
        { value: '매우혼잡', text: '매우혼잡', emoji: '🤯' }
      ]
    }
  },
  computed: {
    currentUser() {
      return this.$store.state.loginUser
    }
  },
  methods: {
    // ✅ 안전한 클라이밍장 상세 정보 로드
    async loadGymDetail() {
      const gymId = this.$route.params.id
      this.isLoading = true
      
      try {
        const response = await this.$axios.get(`/api/gyms/${gymId}`)
        
        if (response.data.success) {       
          // ✅ 안전한 데이터 매핑으로 타입 오류 방지
          this.gym = {
            ...response.data.gym,
            // 숫자 타입 보장
            id: Number(response.data.gym.id),
            rating: Number(response.data.gym.rating) || 0,
            reviewCount: Number(response.data.gym.reviewCount) || 0,
            avgCongestion: Number(response.data.gym.avgCongestion) || 0.5,
            viewCount: Number(response.data.gym.viewCount) || 0,
            dayPrice: Number(response.data.gym.dayPrice) || 0,
            monthPrice: response.data.gym.monthPrice ? Number(response.data.gym.monthPrice) : null,
            
            // 배열 타입 보장
            techniques: Array.isArray(response.data.gym.techniques) ? response.data.gym.techniques : [],
            congestionReports: Array.isArray(response.data.gym.congestionReports) ? response.data.gym.congestionReports : [],
            reviews: Array.isArray(response.data.gym.reviews) ? response.data.gym.reviews : [],
            
            // 문자열 타입 보장
            name: String(response.data.gym.name || ''),
            address: String(response.data.gym.address || ''),
            description: response.data.gym.description || '',
            phone: response.data.gym.phone || null,
            website: response.data.gym.website || null,
            openTime: response.data.gym.openTime || null,
            closeTime: response.data.gym.closeTime || null,
            restDay: response.data.gym.restDay || null,
            
            // 기타 안전장치
            isBookmarked: false,
            lastCongestionUpdate: response.data.gym.lastCongestionUpdate || null
          }
          
          await this.loadRelatedPosts()
        } else {
          this.gym = null
        }
      } catch (error) {
        this.gym = null
      } finally {
        this.isLoading = false
      }
    },

    // ✅ 안전한 관련 게시글 로드
    async loadRelatedPosts() {
      if (!this.gym || !this.gym.id) return
      
      try {
        const response = await this.$axios.get('/api/posts', {
          params: {
            gymId: this.gym.id,
            limit: 5,
            sortBy: 'latest'
          }
        })
        
        if (response.data.success) {
          // 배열 안전성 보장
          this.relatedPosts = Array.isArray(response.data.posts) ? response.data.posts : []
        }
      } catch (error) {
        this.relatedPosts = []
      }
    },

    // ✅ 평점 업데이트 핸들러 개선
    handleRatingUpdated(newRating) {
      if (newRating != null && !isNaN(newRating) && this.gym) {
        this.gym.rating = Number(newRating)
        this.gym.reviewCount = (this.gym.reviewCount || 0) + 1
      } else {
        // 안전하게 전체 데이터 재로드
        this.loadGymDetail()
      }
    },

    // 뒤로가기
    goBack() {
      this.$router.push('/gyms')
    },

    // 게시글로 이동
    goToPost(postId) {
      this.$router.push(`/board/${postId}`)
    },

    // 게시글 작성하기
    writePost() {
      if (!this.currentUser) {
        alert('로그인이 필요합니다.')
        this.$router.push('/')
        return
      }
      this.$router.push(`/board/write?gymId=${this.gym.id}`)
    },

    // 즐겨찾기 토글
    toggleBookmark() {
      if (!this.currentUser) {
        alert('로그인이 필요합니다.')
        return
      }
      
      this.gym.isBookmarked = !this.gym.isBookmarked
      this.showToast(this.gym.isBookmarked ? '즐겨찾기에 추가되었습니다.' : '즐겨찾기에서 제거되었습니다.')
    },

    // 혼잡도 제보 모달 닫기
    closeCongestionModal() {
      this.showCongestionModal = false
      this.selectedCongestionLevel = ''
      this.estimatedPeople = null
    },

    // 혼잡도 제보 제출
// GymDetailView.vue의 submitCongestion 메서드 최종 수정 버전

async submitCongestion() {
  if (!this.selectedCongestionLevel) {
    this.showToast('혼잡도를 선택해주세요.', 'error')
    return
  }

  this.isSubmittingCongestion = true

  try {
    const congestionData = {
      level: this.selectedCongestionLevel,
      peopleCount: this.estimatedPeople || null
    }

    const response = await this.$axios.post(`/api/gyms/${this.gym.id}/congestion`, congestionData)

    // ✅ 응답 성공 조건 단순화
    if (response.status >= 200 && response.status < 300) {
      const responseData = response.data || {}
      
      // success 필드 체크 (있으면 확인, 없으면 200 응답이므로 성공으로 간주)
      if (responseData.success !== false) {
        // 성공 처리
        let message = responseData.message || '혼잡도 제보가 완료되었습니다!'
        
        // 중복 제보인 경우 메시지 조정
        if (responseData.isDuplicate) {
          message = responseData.message || '이미 최근에 제보해주셨습니다. 감사합니다!'
        }
        
        this.showToast(message, 'success')
        this.closeCongestionModal()
        
        // 클라이밍장 정보 업데이트
        if (responseData.updatedAvgCongestion !== undefined) {
          this.gym.avgCongestion = responseData.updatedAvgCongestion
          this.gym.currentCongestion = this.selectedCongestionLevel
          this.gym.lastCongestionUpdate = new Date().toISOString()
          console.log('✅ 로컬 데이터 업데이트 완료')
        }
        
        return // 성공 완료
      }
    }
    
    // 실패 처리
    const errorMessage = response.data?.message || `서버 응답 오류 (${response.status})`
    this.showToast(errorMessage, 'error')

  } catch (error) {
    let errorMessage = '혼잡도 제보 중 오류가 발생했습니다.'
    
    if (error.response) {
      if (error.response.status >= 200 && error.response.status < 300) {
        this.showToast('혼잡도 제보가 완료되었습니다! 🙏', 'success')
        this.closeCongestionModal()
        await this.loadGymDetail() // 전체 데이터 재로드
        return
      }
      
      errorMessage = error.response.data?.message || `서버 오류 (${error.response.status})`
    } else if (error.request) {
      errorMessage = '서버와 연결할 수 없습니다.'
    }
    
    this.showToast(errorMessage, 'error')
    
  } finally {
    this.isSubmittingCongestion = false
  }
},

    // 토스트 메시지 표시
    showToast(message, type = 'success') {
      this.successMessage = message
      this.showSuccessMessage = true
      setTimeout(() => {
        this.showSuccessMessage = false
      }, 3000)
    },

    // ✅ 안전한 유틸리티 함수들
    formatPrice(price) {
      if (price == null || isNaN(price)) return '가격 미정'
      return `${Number(price).toLocaleString()}원`
    },

    formatTime(time) {
      if (!time) return ''
      const timeStr = String(time)
      return timeStr.replace(/(\d{2})(\d{2})/, '$1:$2')
    },

    getTechniqueName(value) {
      const techniques = {
        'static': '스태틱',
        'dynamic': '다이나믹', 
        'lunge': '런지',
        'campus': '캠퍼싱',
        'counter_balance': '카운터밸런스',
        'dead_point': '데드포인트'
      }
      return techniques[value] || value
    },

    getCongestionText(level) {
      if (typeof level === 'number') {
        if (level < 0.3) return '여유'
        if (level < 0.6) return '보통'
        if (level < 0.8) return '혼잡'
        return '매우혼잡'
      }
      return level || '정보없음'
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

    getCategoryEmoji(category) {
      const emojis = {
        '후기': '⭐',
        '질문': '❓',
        '모임': '👥'
      }
      return emojis[category] || '📝'
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
        return '날짜 형식 오류'
      }
    }
  },

  async created() {
    console.log('GymDetailView 컴포넌트 생성됨')
    await this.loadGymDetail()
  }
}
</script>

<style scoped>
/* 전체 페이지 */
.gym-detail-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding: 2rem 0;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 로딩 및 에러 상태 */
.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  text-align: center;
  color: #666;
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

/* 뒤로가기 버튼 */
.back-button {
  margin-bottom: 2rem;
}

.btn-back {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  padding: 10px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #667eea;
  color: white;
}

/* 메인 정보 카드 */
.gym-main-card {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.gym-header {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
}

.gym-image {
  position: relative;
  flex-shrink: 0;
}

.placeholder-image {
  width: 150px;
  height: 150px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gym-initial {
  font-size: 3rem;
  font-weight: bold;
  color: white;
}

.gym-badge {
  position: absolute;
  top: -10px;
  right: -10px;
}

.congestion-badge {
  padding: 6px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.congestion-badge.low { background: #4caf50; }
.congestion-badge.medium { background: #ff9800; }
.congestion-badge.high { background: #f44336; }
.congestion-badge.very-high { background: #9c27b0; }

.gym-info {
  flex: 1;
}

.gym-name {
  font-size: 2rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 0.5rem;
}

.gym-address {
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

.gym-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.label {
  font-weight: 500;
  color: #333;
  min-width: 80px;
}

.value {
  color: #666;
}

.website-link {
  color: #667eea;
  text-decoration: none;
}

.website-link:hover {
  text-decoration: underline;
}

.action-buttons {
  display: flex;
  gap: 1rem;
}

.btn-bookmark, .btn-congestion {
  padding: 10px 20px;
  border-radius: 25px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-bookmark {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
}

.btn-bookmark.bookmarked {
  background: #667eea;
  color: white;
}

.btn-congestion {
  background: #ff9800;
  color: white;
}

.btn-congestion:hover {
  background: #f57c00;
}

/* 설명 및 기술 */
.gym-description, .gym-techniques {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #eee;
}

.gym-description h3, .gym-techniques h3 {
  color: #333;
  margin-bottom: 1rem;
}

.technique-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.technique-tag {
  background: #667eea;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

/* 혼잡도 섹션 */
.congestion-section {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.congestion-section h3 {
  color: #333;
  margin-bottom: 1.5rem;
}

.congestion-stats {
  margin-bottom: 2rem;
}

.current-congestion {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.congestion-meter {
  flex: 1;
}

.meter-bar {
  height: 20px;
  background: #eee;
  border-radius: 10px;
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
.meter-fill.very-high { background: #9c27b0; }

.congestion-text {
  font-weight: bold;
  color: #333;
  text-align: center;
  margin: 0;
}

.congestion-info {
  min-width: 200px;
}

.recent-reports h4 {
  color: #333;
  margin-bottom: 1rem;
}

.reports-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.report-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.report-level {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  color: white;
  min-width: 60px;
  text-align: center;
}

.report-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.reporter {
  font-weight: 500;
  color: #333;
}

.report-time {
  font-size: 12px;
  color: #666;
}

.people-count {
  font-size: 12px;
  color: #666;
}

/* 관련 게시글 섹션 */
.related-posts-section {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.related-posts-section h3 {
  color: #333;
  margin-bottom: 1.5rem;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.post-item {
  padding: 1rem;
  border: 1px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.post-item:hover {
  background: #f8f9fa;
  border-color: #667eea;
}

.post-category {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  color: white;
  display: inline-block;
  margin-bottom: 0.5rem;
}

.post-category.후기 { background: #4caf50; }
.post-category.질문 { background: #2196f3; }
.post-category.모임 { background: #ff9800; }

.post-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.post-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
  font-size: 14px;
  color: #666;
}

.post-stats {
  display: flex;
  gap: 1rem;
  font-size: 13px;
  color: #666;
}

.no-posts {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.btn-write {
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  cursor: pointer;
  margin-top: 1rem;
}

/* 통계 섹션 */
.stats-section {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.stats-section h3 {
  color: #333;
  margin-bottom: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #666;
  font-size: 14px;
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
  max-width: 400px;
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

.congestion-form {
  padding: 2rem;
}

.congestion-form p {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
  font-weight: 500;
}

.congestion-levels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.congestion-level {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 2px solid #e1e5e9;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.congestion-level:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.congestion-level.selected {
  border-color: #667eea;
  background: #f8f9ff;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.congestion-level input[type="radio"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.level-content {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  width: 100%;
}

.level-text {
  font-weight: 500;
  color: #333;
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

.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-cancel, .btn-submit {
  padding: 10px 20px;
  border-radius: 20px;
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

.btn-primary {
  background: #667eea;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #5a67d8;
  transform: translateY(-2px);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .container {
    padding: 0 15px;
  }

  .gym-detail-page {
    padding: 1rem 0;
  }

  .gym-main-card, .congestion-section, .related-posts-section, .stats-section {
    padding: 1.5rem;
  }

  .gym-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .placeholder-image {
    width: 120px;
    height: 120px;
    margin: 0 auto;
  }

  .gym-initial {
    font-size: 2.5rem;
  }

  .gym-name {
    font-size: 1.5rem;
  }

  .gym-details {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
    gap: 0.8rem;
  }

  .current-congestion {
    flex-direction: column;
    gap: 1rem;
  }

  .congestion-levels {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-cancel, .btn-submit {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .gym-main-card, .congestion-section, .related-posts-section, .stats-section {
    padding: 1rem;
  }

  .modal-content {
    margin: 10px;
    max-height: 95vh;
  }

  .modal-header {
    padding: 1rem;
  }

  .congestion-form {
    padding: 1rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>