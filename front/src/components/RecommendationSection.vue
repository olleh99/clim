<template>
  <div class="recommendation-section">
    <!-- 헤더 -->
    <div class="section-header">
      <h3>🤖 {{ currentUser?.nickname }}님을 위한 맞춤 추천</h3>
      <button @click="refreshRecommendations" class="refresh-btn" :disabled="isRefreshing">
        {{ isRefreshing ? '🔄' : '🔄' }} 새로고침
      </button>
    </div>

    <!-- 사용자 프로필 요약 -->
    <div v-if="userProfile" class="profile-summary">
      <div class="profile-tags">
        <span v-if="userProfile.level" class="level-tag">{{ userProfile.level }}</span>
        <span v-for="tech in userProfile.techniques" :key="tech" class="tech-tag">
          {{ getTechniqueName(tech) }}
        </span>
        <span v-if="userProfile.hasInstructorLicense" class="instructor-tag">🏅 지도자</span>
      </div>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>당신에게 맞는 클라이밍장을 찾고 있어요...</p>
    </div>

    <!-- 추천 목록 -->
    <div v-else-if="recommendations.length > 0" class="recommendations-grid">
      <div 
        v-for="(gym, index) in recommendations" 
        :key="gym.id" 
        class="recommendation-card"
        @click="goToGym(gym.id)"
      >
        <!-- 순위 뱃지 -->
        <div class="rank-badge">{{ index + 1 }}</div>
        
        <!-- 추천 점수 -->
        <div class="score-indicator">
          <div class="score-circle" :style="{ background: getScoreColor(gym.recommendationScore) }">
            {{ Math.round(gym.recommendationScore) }}
          </div>
          <span class="score-label">추천도</span>
        </div>

        <!-- 클라이밍장 정보 -->
        <div class="gym-image">
          <div class="placeholder-image">
            <span class="gym-initial">{{ gym.name.charAt(0) }}</span>
          </div>
          <!-- 실시간 혼잡도 -->
          <div v-if="gym.currentCongestion" class="congestion-badge" :class="getCongestionClass(gym.avgCongestion)">
            {{ getCongestionText(gym.avgCongestion) }}
          </div>
        </div>

        <div class="gym-info">
          <h4 class="gym-name">{{ gym.name }}</h4>
          <p class="gym-address">📍 {{ gym.address }}</p>
          
          <!-- 추천 이유 -->
          <div class="recommendation-reason">
            <span class="reason-icon">💡</span>
            <span class="reason-text">{{ gym.recommendationReason }}</span>
          </div>

          <!-- 가격 정보 -->
          <div class="price-info">
            <span class="day-price">일일권: {{ formatPrice(gym.dayPrice) }}</span>
          </div>

          <!-- 점수 상세 (호버시 표시) -->
          <div class="score-breakdown">
            <div class="breakdown-item">
              <span class="breakdown-label">기술 매칭</span>
              <div class="breakdown-bar">
                <div class="breakdown-fill" :style="{ width: gym.scoreBreakdown.techniqueMatch + '%' }"></div>
              </div>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">레벨 적합성</span>
              <div class="breakdown-bar">
                <div class="breakdown-fill" :style="{ width: gym.scoreBreakdown.levelSuitability + '%' }"></div>
              </div>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">실시간 상황</span>
              <div class="breakdown-bar">
                <div class="breakdown-fill" :style="{ width: gym.scoreBreakdown.realtimeStatus + '%' }"></div>
              </div>
            </div>
          </div>

          <!-- 액션 버튼 -->
          <div class="card-actions">
            <button @click.stop="toggleBookmark(gym)" class="btn-bookmark">
              {{ gym.isBookmarked ? '💚' : '🤍' }} 즐겨찾기
            </button>
            <button @click.stop="goToGym(gym.id)" class="btn-detail">
              자세히 보기
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 추천 없음 -->
    <div v-else-if="!isLoading" class="no-recommendations">
      <div class="empty-icon">🤔</div>
      <h4>추천할 클라이밍장이 없어요</h4>
      <p>프로필 정보를 더 추가하시면 더 정확한 추천을 받을 수 있어요!</p>
      <button @click="goToProfile" class="btn-profile">프로필 수정하기</button>
    </div>

    <!-- 추천 설정 -->
    <div class="recommendation-settings">
      <button @click="showSettings = !showSettings" class="settings-toggle">
        ⚙️ 추천 설정
      </button>
      
      <div v-if="showSettings" class="settings-panel">
        <h5>추천 기준 조정</h5>
        <div class="setting-item">
          <label>혼잡도 중요도</label>
          <input type="range" v-model="settings.congestionWeight" min="0" max="100" />
          <span>{{ settings.congestionWeight }}%</span>
        </div>
        <div class="setting-item">
          <label>거리 중요도</label>
          <input type="range" v-model="settings.distanceWeight" min="0" max="100" />
          <span>{{ settings.distanceWeight }}%</span>
        </div>
        <button @click="applySettings" class="btn-apply">설정 적용</button>
      </div>
    </div>

    <!-- 성공 메시지 -->
    <div v-if="showSuccessMessage" class="success-toast">
      {{ successMessage }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'RecommendationSection',
  data() {
    return {
      recommendations: [],
      userProfile: null,
      isLoading: false,
      isRefreshing: false,
      showSettings: false,
      showSuccessMessage: false,
      successMessage: '',
      settings: {
        congestionWeight: 50,
        distanceWeight: 30
      }
    }
  },
  computed: {
    currentUser() {
      return this.$store.state.loginUser
    }
  },
  methods: {
    // 추천 목록 로드
    async loadRecommendations() {
      if (!this.currentUser) return

      this.isLoading = true
      try {
        const response = await this.$axios.get('/api/recommendations/gyms', {
          params: { limit: 6 }
        })

        if (response.data.success) {
          this.recommendations = response.data.recommendations
          this.userProfile = response.data.userProfile
        }
      } catch (error) {
        console.error('추천 로드 오류:', error)
        this.showToast('추천 목록을 불러올 수 없습니다.', 'error')
      } finally {
        this.isLoading = false
      }
    },

    // 추천 새로고침
    async refreshRecommendations() {
      this.isRefreshing = true
      try {
        await this.loadRecommendations()
        this.showToast('추천 목록이 업데이트되었습니다! 🎯')
      } catch (error) {
        this.showToast('새로고침 중 오류가 발생했습니다.', 'error')
      } finally {
        this.isRefreshing = false
      }
    },

    // 클라이밍장 상세로 이동
    goToGym(gymId) {
      this.$router.push(`/gyms/${gymId}`)
    },

    // 프로필 페이지로 이동
    goToProfile() {
      this.$router.push('/mypage')
    },

    // 즐겨찾기 토글
    toggleBookmark(gym) {
      gym.isBookmarked = !gym.isBookmarked
      this.showToast(gym.isBookmarked ? '즐겨찾기에 추가했어요! 💚' : '즐겨찾기에서 제거했어요!')
    },

    // 설정 적용
    async applySettings() {
      this.showToast('설정이 적용되었습니다!')
      await this.refreshRecommendations()
    },

    // 유틸리티 함수들
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

    formatPrice(price) {
      return price ? `${price.toLocaleString()}원` : '가격 미정'
    },

    getScoreColor(score) {
      if (score >= 80) return 'linear-gradient(135deg, #4caf50, #66bb6a)'
      if (score >= 60) return 'linear-gradient(135deg, #ff9800, #ffb74d)'
      if (score >= 40) return 'linear-gradient(135deg, #2196f3, #64b5f6)'
      return 'linear-gradient(135deg, #9e9e9e, #bdbdbd)'
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

    getCongestionText(level) {
      if (typeof level === 'number') {
        if (level < 0.3) return '여유'
        if (level < 0.6) return '보통'
        if (level < 0.8) return '혼잡'
        return '매우혼잡'
      }
      return level || '정보없음'
    },

    showToast(message, type = 'success') {
      this.successMessage = message
      this.showSuccessMessage = true
      setTimeout(() => {
        this.showSuccessMessage = false
      }, 3000)
    }
  },

  async created() {
    if (this.currentUser) {
      await this.loadRecommendations()
    }
  }
}
</script>

<style scoped>
/* 전체 섹션 */
.recommendation-section {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

/* 헤더 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-header h3 {
  color: #333;
  margin: 0;
  font-size: 1.5rem;
}

.refresh-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #5a67d8;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 프로필 요약 */
.profile-summary {
  background: #f8f9ff;
  padding: 1rem;
  border-radius: 10px;
  margin-bottom: 1.5rem;
}

.profile-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.level-tag, .tech-tag, .instructor-tag {
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.level-tag {
  background: #667eea;
}

.tech-tag {
  background: #4caf50;
}

.instructor-tag {
  background: #ff9800;
}

/* 로딩 상태 */
.loading-state {
  text-align: center;
  padding: 3rem 2rem;
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

/* 추천 그리드 */
.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
}

/* 추천 카드 */
.recommendation-card {
  position: relative;
  background: white;
  border: 2px solid #e1e5e9;
  border-radius: 15px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.recommendation-card:hover {
  border-color: #667eea;
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.15);
}

.recommendation-card:hover .score-breakdown {
  opacity: 1;
  visibility: visible;
}

/* 순위 뱃지 */
.rank-badge {
  position: absolute;
  top: 15px;
  left: 15px;
  background: linear-gradient(135deg, #667eea, #764ba2);
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

/* 점수 표시 */
.score-indicator {
  position: absolute;
  top: 15px;
  right: 15px;
  text-align: center;
  z-index: 2;
}

.score-circle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 4px;
}

.score-label {
  color: white;
  font-size: 10px;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
}

/* 클라이밍장 이미지 */
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
  bottom: 10px;
  right: 10px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: bold;
  color: white;
}

.congestion-badge.low { background: #4caf50; }
.congestion-badge.medium { background: #ff9800; }
.congestion-badge.high { background: #f44336; }
.congestion-badge.very-high { background: #9c27b0; }

/* 클라이밍장 정보 */
.gym-info {
  padding: 1.5rem;
}

.gym-name {
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 0.5rem;
}

.gym-address {
  color: #666;
  font-size: 14px;
  margin-bottom: 1rem;
}

/* 추천 이유 */
.recommendation-reason {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8f9ff;
  padding: 0.8rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border-left: 3px solid #667eea;
}

.reason-icon {
  font-size: 1.2rem;
}

.reason-text {
  color: #667eea;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
}

/* 가격 정보 */
.price-info {
  margin-bottom: 1rem;
}

.day-price {
  color: #333;
  font-weight: 600;
  font-size: 14px;
}

/* 점수 상세 (호버시 표시) */
.score-breakdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  padding: 1rem;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  border-top: 1px solid #e1e5e9;
}

.breakdown-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 0.5rem;
}

.breakdown-label {
  min-width: 80px;
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.breakdown-bar {
  flex: 1;
  height: 6px;
  background: #e1e5e9;
  border-radius: 3px;
  overflow: hidden;
}

.breakdown-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  transition: width 0.3s ease;
}

/* 액션 버튼 */
.card-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.btn-bookmark, .btn-detail {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-bookmark {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
}

.btn-bookmark:hover {
  background: #667eea;
  color: white;
}

.btn-detail {
  background: #667eea;
  color: white;
}

.btn-detail:hover {
  background: #5a67d8;
}

/* 추천 없음 */
.no-recommendations {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.no-recommendations h4 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.3rem;
}

.no-recommendations p {
  margin-bottom: 2rem;
  line-height: 1.6;
}

.btn-profile {
  background: #667eea;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-profile:hover {
  background: #5a67d8;
  transform: translateY(-2px);
}

/* 추천 설정 */
.recommendation-settings {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e1e5e9;
}

.settings-toggle {
  background: #f8f9fa;
  color: #666;
  border: 2px solid #e1e5e9;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.settings-toggle:hover {
  border-color: #667eea;
  color: #667eea;
}

.settings-panel {
  margin-top: 1rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 10px;
  border: 1px solid #e1e5e9;
}

.settings-panel h5 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.setting-item label {
  min-width: 100px;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.setting-item input[type="range"] {
  flex: 1;
  height: 6px;
  background: #e1e5e9;
  border-radius: 3px;
  outline: none;
  appearance: none; /* 표준 속성 사용 */
  -webkit-appearance: none; /* 웹킷 브라우저용 */
  -moz-appearance: none; /* 파이어폭스용 */
}

/* 웹킷 브라우저 (Chrome, Safari) 슬라이더 썸 */
.setting-item input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  background: #667eea;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

/* 파이어폭스 슬라이더 썸 */
.setting-item input[type="range"]::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: #667eea;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

/* 파이어폭스 슬라이더 트랙 */
.setting-item input[type="range"]::-moz-range-track {
  height: 6px;
  background: #e1e5e9;
  border-radius: 3px;
  border: none;
}

.setting-item span {
  min-width: 40px;
  text-align: right;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.btn-apply {
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-apply:hover {
  background: #5a67d8;
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
  .recommendation-section {
    padding: 1.5rem;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .recommendations-grid {
    grid-template-columns: 1fr;
  }
  
  .recommendation-card {
    margin-bottom: 1rem;
  }
  
  .profile-tags {
    justify-content: center;
  }
  
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .setting-item label {
    min-width: auto;
  }
  
  .setting-item input[type="range"] {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .recommendation-section {
    padding: 1rem;
  }
  
  .section-header h3 {
    font-size: 1.2rem;
  }
  
  .gym-info {
    padding: 1rem;
  }
  
  .card-actions {
    flex-direction: column;
  }
  
  .btn-bookmark, .btn-detail {
    flex: none;
    width: 100%;
  }
}
</style>