<template>
  <div class="gyms-page">
    <!-- 헤더 섹션 -->
    <section class="page-header">
      <div class="container">
        <h1>🏢 클라이밍장 목록</h1>
        <p>새로운 클라이밍장을 추가하고 정보를 공유해보세요!</p>
        <div class="header-actions">
          <button @click="showAddForm = true" class="add-gym-btn">
            ➕ 새 클라이밍장 추가하기
          </button>
        </div>
      </div>
    </section>

    <!-- 클라이밍장 추가 모달 -->
    <div v-if="showAddForm" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>🏗 새 클라이밍장 추가</h2>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>
        <form @submit.prevent="submitGym" class="gym-form">
          <!-- 기본 정보 섹션 -->
          <div class="form-section">
            <h3>📋 기본 정보</h3>
            <div class="form-group">
              <label>클라이밍장 이름 *</label>
              <input v-model="newGym.name" type="text" placeholder="예: 더클라임 강남점" required>
            </div>
            <div class="form-group">
              <label>주소 *</label>
              <input v-model="newGym.address" type="text" placeholder="예: 서울 강남구 역삼동 735-3 B1" required>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>지역 *</label>
                <select v-model="newGym.district" required>
                  <option value="">지역 선택</option>
                  <option value="서대문구">서대문구</option>
                  <option value="강남구">강남구</option>
                  <option value="강북구">강북구</option>
                  <option value="강서구">강서구</option>
                  <option value="강동구">강동구</option>
                  <option value="마포구">마포구</option>
                  <option value="성동구">성동구</option>
                  <option value="용산구">용산구</option>
                  <option value="종로구">종로구</option>
                  <option value="은평구">은평구</option>
                  <option value="구로구">구로구</option>
                  <option value="중구">중구</option>
                  <option value="기타">기타</option>
                </select>
              </div>
              <div class="form-group">
                <label>전화번호</label>
                <input v-model="newGym.phone" type="tel" placeholder="예: 02-538-8275">
              </div>
            </div>
          </div>

          <!-- 가격 정보 섹션 -->
          <div class="form-section">
            <h3>💰 가격 정보</h3>
            <div class="form-row">
              <div class="form-group">
                <label>일일권 가격 *</label>
                <input v-model.number="newGym.dayPrice" type="number" placeholder="13000" required min="0">
                <span class="unit">원</span>
              </div>
              <div class="form-group">
                <label>월권 가격</label>
                <input v-model.number="newGym.monthPrice" type="number" placeholder="110000" min="0">
                <span class="unit">원</span>
              </div>
            </div>
          </div>

          <!-- 🎯 기술 정보 섹션 (새로 추가!) -->
          <div class="form-section">
            <h3>🎯 주요 클라이밍 기술</h3>
            <p class="section-description">이 클라이밍장에서 주로 연습할 수 있는 기술들을 선택해주세요</p>
            <div class="techniques-grid">
              <label v-for="technique in availableTechniques" :key="technique.value" 
                     class="technique-checkbox" :class="{ selected: newGym.techniques.includes(technique.value) }">
                <input type="checkbox" :value="technique.value" v-model="newGym.techniques">
                <div class="technique-content">
                  <span class="technique-icon">{{ technique.icon }}</span>
                  <div class="technique-info">
                    <span class="technique-name">{{ technique.name }}</span>
                    <span class="technique-desc">{{ technique.description }}</span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <!-- 운영 정보 섹션 -->
          <div class="form-section">
            <h3>🕐 운영 정보</h3>
            <div class="form-row">
              <div class="form-group">
                <label>운영 시작 시간</label>
                <input v-model="newGym.openTime" type="time" placeholder="09:00">
              </div>
              <div class="form-group">
                <label>운영 종료 시간</label>
                <input v-model="newGym.closeTime" type="time" placeholder="23:00">
              </div>
            </div>
            <div class="form-group">
              <label>휴무일</label>
              <input v-model="newGym.restDay" type="text" placeholder="예: 매주 월요일, 연중무휴">
            </div>
            <div class="form-group">
              <label>웹사이트</label>
              <input v-model="newGym.website" type="url" placeholder="https://example.com">
            </div>
          </div>

          <!-- 추가 정보 섹션 -->
          <div class="form-section">
            <h3>📝 추가 정보</h3>
            <div class="form-group">
              <label>클라이밍장 소개</label>
              <textarea v-model="newGym.description" placeholder="클라이밍장의 특징, 분위기, 추천 포인트 등을 설명해주세요" 
                        rows="4" maxlength="500"></textarea>
              <div class="char-count">{{ (newGym.description || '').length }}/500</div>
            </div>
            <div class="form-group">
              <label>현재 혼잡도 (선택사항)</label>
              <select v-model="newGym.congestionLevel">
                <option value="">혼잡도 선택 안함</option>
                <option value="여유">😌 여유 - 사람이 적어요</option>
                <option value="보통">😐 보통 - 적당해요</option>
                <option value="혼잡">😰 혼잡 - 사람이 많아요</option>
                <option value="매우혼잡">🤯 매우혼잡 - 자리가 없어요</option>
              </select>
            </div>
          </div>

          <!-- 제출 버튼 -->
          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn-cancel">취소</button>
            <button type="submit" :disabled="isSubmitting" class="btn-submit">
              {{ isSubmitting ? '추가 중...' : '클라이밍장 추가하기' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 검색 및 필터 섹션 -->
    <section class="search-section" v-if="gyms.length > 0">
      <div class="container">
        <div class="search-controls">
          <div class="search-box">
            <input v-model="searchQuery" type="text" placeholder="클라이밍장 이름이나 주소로 검색..." @input="debounceSearch">
            <button class="search-btn">🔍</button>
          </div>
          <div class="sort-options">
            <label>정렬:</label>
            <select v-model="sortBy" @change="onSortChange">
              <option value="name">이름순</option>
              <option value="newest">최신순</option>
              <option value="price">가격순</option>
              <option value="rating">평점순</option>
            </select>
          </div>
        </div>
      </div>
    </section>

    <!-- 클라이밍장 목록 -->
    <section class="gyms-list-section">
      <div class="container">
        <!-- 로딩 상태 -->
        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>클라이밍장 정보를 불러오는 중...</p>
        </div>

        <!-- 빈 상태 -->
        <div v-else-if="gyms.length === 0" class="empty-state">
          <div class="empty-icon">🏗</div>
          <h2>등록된 클라이밍장이 없습니다</h2>
          <p>첫 번째 클라이밍장을 추가해서 커뮤니티에 기여해보세요!</p>
          <button @click="showAddForm = true" class="btn-primary">
            ➕ 첫 번째 클라이밍장 추가하기
          </button>
        </div>

        <!-- 클라이밍장 목록 -->
        <div v-else>
          <div class="results-header">
            <h3>📍 등록된 클라이밍장 ({{ gyms.length }}개)</h3>
            <button @click="showAddForm = true" class="btn-primary">➕ 클라이밍장 추가</button>
          </div>
          <div class="gyms-grid">
            <div v-for="gym in gyms" :key="gym.id" class="gym-card" @click="goToGymDetail(gym.id)">
              <div class="gym-image">
                <div class="placeholder-image">
                  <span class="gym-initial">{{ getGymInitial(gym.name) }}</span>
                </div>
                <div class="image-overlay">
                  <div v-if="gym.currentCongestion" class="congestion-badge" :class="getCongestionClass(gym.avgCongestion)">
                    {{ gym.currentCongestion }}
                  </div>
                  <button @click.stop="confirmDeleteGym(gym)" class="delete-btn">🗑️</button>
                </div>
              </div>

              <div class="gym-info">
                <h4 class="gym-name">{{ gym.name }}</h4>
                <p class="gym-address">📍 {{ gym.address }}</p>
                <div class="price-info">
                  <span class="day-price">일일권: {{ formatPrice(gym.dayPrice) }}</span>
                  <span v-if="gym.monthPrice" class="month-price">월권: {{ formatPrice(gym.monthPrice) }}</span>
                </div>
                <div v-if="gym.phone" class="contact-info">
                  <span class="phone">📞 {{ gym.phone }}</span>
                </div>

                <!-- 🎯 기술 태그 표시 (새로 추가!) -->
                <div v-if="gym.techniques && gym.techniques.length > 0" class="gym-techniques">
                  <div class="technique-header">🎯 주요 기술:</div>
                  <div class="technique-tags">
                    <span v-for="tech in gym.techniques.slice(0, 3)" :key="tech" class="technique-tag">
                      {{ getTechniqueName(tech) }}
                    </span>
                    <span v-if="gym.techniques.length > 3" class="more-techniques">
                      +{{ gym.techniques.length - 3 }}개 더
                    </span>
                  </div>
                </div>

                <div v-if="gym.description" class="gym-description">
                  <p>{{ gym.description }}</p>
                </div>

                <div v-if="gym.rating > 0" class="gym-rating">
                  <span class="rating-stars">⭐ {{ formatRating(gym.rating) }}</span>
                  <span class="review-count">({{ gym.reviewCount }}개 리뷰)</span>
                </div>

                <div class="gym-meta">
                  <span class="added-date">{{ formatDate(gym.createdAt) }}</span>
                  <span v-if="gym.viewCount" class="view-count">👁 {{ gym.viewCount }}</span>
                </div>

                <div class="gym-actions">
                  <button class="btn-outline" @click.stop="toggleBookmark(gym.id)">
                    {{ gym?.isBookmarked ? '💚' : '🤍' }} 찜하기
                  </button>
                  <button class="btn-congestion" @click.stop="handleCongestionReport(gym)">
                    📊 혼잡도 제보
                  </button>
                  <button class="btn-primary" @click.stop="goToGymDetail(gym.id)">
                    자세히 보기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 🎨 개선된 혼잡도 제보 모달 -->
    <div v-if="showCongestionModal" class="modal-overlay" @click="closeCongestionModal">
      <div class="modal-content congestion-modal" @click.stop>
        <div class="congestion-modal-header">
          <div class="header-content">
            <div class="gym-icon">🏢</div>
            <div class="header-text">
              <h2>실시간 혼잡도 제보</h2>
              <p class="gym-name">{{ selectedGymForCongestion?.name || '클라이밍장' }}</p>
            </div>
          </div>
          <button @click="closeCongestionModal" class="congestion-close-btn">✕</button>
        </div>
        
        <div class="congestion-form">
          <div class="form-intro">
            <div class="intro-icon">📊</div>
            <h3>현재 이 클라이밍장의 혼잡도는 어떤가요?</h3>
            <p>다른 클라이머들이 방문 계획을 세우는데 도움이 됩니다!</p>
          </div>

          <div class="congestion-levels">
            <label v-for="level in congestionLevels" :key="level.value"
                   class="congestion-level" :class="{ selected: selectedCongestionLevel === level.value }">
              <input type="radio" :value="level.value" v-model="selectedCongestionLevel">
              <div class="level-content">
                <div class="level-emoji">{{ level.emoji }}</div>
                <div class="level-info">
                  <span class="level-text">{{ level.text }}</span>
                  <span class="level-description">{{ getLevelDescription(level.value) }}</span>
                </div>
              </div>
              <div class="selection-indicator">
                <div class="check-icon">✓</div>
              </div>
            </label>
          </div>
          
          <div class="additional-info">
            <div class="form-group">
              <label>
                <span class="label-icon">👥</span>
                대략적인 인원 수 (선택사항)
              </label>
              <div class="input-wrapper">
                <input v-model.number="estimatedPeople" type="number" 
                       placeholder="예: 15명" min="0" max="100">
                <span class="input-suffix">명</span>
              </div>
              <div class="input-help">현재 보이는 클라이머 수를 대략적으로 입력해주세요</div>
            </div>
          </div>
          
          <div class="congestion-form-actions">
            <button @click="closeCongestionModal" class="congestion-btn-cancel">
              <span class="btn-icon">↩️</span>
              취소
            </button>
            <button @click="submitCongestion" :disabled="!selectedCongestionLevel || isSubmittingCongestion"
                    class="congestion-btn-submit">
              <span class="btn-icon">{{ isSubmittingCongestion ? '⏳' : '📤' }}</span>
              {{ isSubmittingCongestion ? '제보 중...' : '혼잡도 제보하기' }}
            </button>
          </div>

          <div class="privacy-notice">
            <span class="notice-icon">🔒</span>
            제보된 정보는 익명으로 처리되며, 다른 사용자들에게 도움이 됩니다.
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
export default {
  name: 'GymsView',
  data() {
    return {
      showAddForm: false,
      isSubmitting: false,
      isLoading: false,
      showSuccessMessage: false,
      successMessage: '',
      searchQuery: '',
      sortBy: 'newest',
      gyms: [],
      showCongestionModal: false,
      selectedGymForCongestion: null,
      selectedCongestionLevel: '',
      estimatedPeople: null,
      isSubmittingCongestion: false,
      newGym: {
        name: '',
        address: '',
        district: '',
        phone: '',
        dayPrice: null,
        monthPrice: null,
        techniques: [], // 🎯 기술 배열 추가!
        description: '',
        congestionLevel: '',
        openTime: '',
        closeTime: '',
        restDay: '',
        website: ''
      },
      // 🎯 사용 가능한 클라이밍 기술들
      availableTechniques: [
        {
          value: "static",
          name: "스태틱",
          icon: "🧘‍♂️",
          description: "정적인 움직임으로 균형을 유지하며 오르는 기술"
        },
        {
          value: "dynamic",
          name: "다이나믹",
          icon: "💨",
          description: "역동적인 움직임으로 추진력을 이용하는 기술"
        },
        {
          value: "lunge",
          name: "런지",
          icon: "🚀",
          description: "몸을 던져서 먼 홀드를 잡는 기술"
        },
        {
          value: "campus",
          name: "캠퍼싱",
          icon: "🦍",
          description: "발을 사용하지 않고 팔만으로 오르는 기술"
        },
        {
          value: "counter_balance",
          name: "카운터밸런스",
          icon: "⚖️",
          description: "몸의 균형을 이용해 반대 방향으로 힘을 가하는 기술"
        },
        {
          value: "dead_point",
          name: "데드포인트",
          icon: "🎯",
          description: "점프의 최고점에서 홀드를 잡는 타이밍 기술"
        }
      ],
      congestionLevels: [
        { value: '여유', text: '여유', emoji: '😌' },
        { value: '보통', text: '보통', emoji: '😐' },
        { value: '혼잡', text: '혼잡', emoji: '😰' },
        { value: '매우혼잡', text: '매우혼잡', emoji: '🤯' }
      ],
      searchTimeout: null
    }
  },
  computed: {
    currentUser() {
      return this.$store.state.loginUser
    }
  },
  methods: {
    // 🎯 기술 이름 변환
    getTechniqueName(value) {
      const technique = this.availableTechniques.find(t => t.value === value)
      return technique ? technique.name : value
    },

    // 혼잡도 레벨 설명
    getLevelDescription(level) {
      const descriptions = {
        '여유': '사람이 적어서 편안하게 클라이밍을 즐길 수 있어요',
        '보통': '적당한 인원으로 대기 시간이 거의 없어요',
        '혼잡': '사람이 많아서 약간의 대기가 있을 수 있어요',
        '매우혼잡': '매우 붐비고 있어서 대기 시간이 길 수 있어요'
      }
      return descriptions[level] || ''
    },

    // 기존 메서드들은 그대로 유지...
    formatRating(rating) {
      if (rating == null || rating === '' || rating === undefined) {
        return '0.0'
      }
      const numRating = parseFloat(rating)
      if (isNaN(numRating)) {
        return '0.0'
      }
      if (numRating < 0 || numRating > 5) {
        return Math.max(0, Math.min(5, numRating)).toFixed(1)
      }
      return numRating.toFixed(1)
    },

    async fetchGyms() {
      this.isLoading = true
      try {
        let url = '/api/gyms?'
        const params = new URLSearchParams()
        if (this.searchQuery.trim()) {
          params.append('search', this.searchQuery.trim())
        }
        if (this.sortBy) {
          params.append('sortBy', this.sortBy)
        }

        url += params.toString()
        const response = await this.$axios.get(url)
        if (response.data.success) {
          this.gyms = response.data.gyms.map(gym => ({
            ...gym,
            rating: gym.rating != null ? parseFloat(gym.rating) || 0 : 0,
            reviewCount: gym.reviewCount != null ? parseInt(gym.reviewCount) || 0 : 0,
            avgCongestion: gym.avgCongestion != null ? parseFloat(gym.avgCongestion) || 0 : 0,
            viewCount: gym.viewCount != null ? parseInt(gym.viewCount) || 0 : 0,
            dayPrice: gym.dayPrice != null ? parseInt(gym.dayPrice) || 0 : 0,
            monthPrice: gym.monthPrice != null ? parseInt(gym.monthPrice) || null : null,
            techniques: Array.isArray(gym.techniques) ? gym.techniques : [],
            name: gym.name || '',
            address: gym.address || '',
            description: gym.description || '',
            phone: gym.phone || '',
            isBookmarked: false,
            id: gym.id,
            createdAt: gym.createdAt,
            currentCongestion: gym.currentCongestion
          }))
        } else {
          this.gyms = []
        }
      } catch (error) {
        this.showToast('클라이밍장을 불러오는 중 오류가 발생했습니다.', 'error')
        this.gyms = []
      } finally {
        this.isLoading = false
      }
    },

    async onSortChange() {
      await this.fetchGyms()
    },

    debounceSearch() {
      clearTimeout(this.searchTimeout)
      this.searchTimeout = setTimeout(() => {
        this.fetchGyms()
      }, 500)
    },

    async submitGym() {
      if (!this.validateForm()) return

      this.isSubmitting = true
      try {
        const gymData = {
          name: this.newGym.name,
          address: this.newGym.address,
          district: this.newGym.district,
          phone: this.newGym.phone,
          dayPrice: this.newGym.dayPrice,
          monthPrice: this.newGym.monthPrice,
          techniques: this.newGym.techniques, // 🎯 기술 배열 전송!
          description: this.newGym.description,
          congestionLevel: this.newGym.congestionLevel,
          openTime: this.newGym.openTime,
          closeTime: this.newGym.closeTime,
          restDay: this.newGym.restDay,
          website: this.newGym.website,
          addedBy: this.currentUser?.userId || 'anonymous'
        }

        const response = await this.$axios.post('/api/gyms', gymData)
        if (response.data.success) {
          this.showToast('클라이밍장이 성공적으로 추가되었습니다! 🎉', 'success')
          this.closeModal()
          await this.fetchGyms()
        } else {
          this.showToast(response.data.message, 'error')
        }
      } catch (error) {
        this.showToast('클라이밍장 추가 중 오류가 발생했습니다.', 'error')
      } finally {
        this.isSubmitting = false
      }
    },

    validateForm() {
      if (!this.newGym.name.trim()) {
        this.showToast('클라이밍장 이름을 입력해주세요.', 'error')
        return false
      }
      if (!this.newGym.address.trim()) {
        this.showToast('주소를 입력해주세요.', 'error')
        return false
      }
      if (!this.newGym.district) {
        this.showToast('지역을 선택해주세요.', 'error')
        return false
      }
      if (!this.newGym.dayPrice || this.newGym.dayPrice <= 0) {
        this.showToast('올바른 일일권 가격을 입력해주세요.', 'error')
        return false
      }
      return true
    },

    closeModal() {
      this.showAddForm = false
      this.resetForm()
    },

    resetForm() {
      this.newGym = {
        name: '',
        address: '',
        district: '',
        phone: '',
        dayPrice: null,
        monthPrice: null,
        techniques: [], // 🎯 기술 배열 초기화!
        description: '',
        congestionLevel: '',
        openTime: '',
        closeTime: '',
        restDay: '',
        website: ''
      }
    },

    // 🗑️ 클라이밍장 삭제 관련
    confirmDeleteGym(gym) {
      if (confirm(`정말로 "${gym.name}"을(를) 삭제하시겠습니까?`)) {
        this.deleteGym(gym.id)
      }
    },

    async deleteGym(gymId) {
      try {
        const response = await this.$axios.delete(`/api/gyms/${gymId}`)
        if (response.data.success) {
          this.showToast('클라이밍장이 삭제되었습니다.')
          await this.fetchGyms()
        } else {
          this.showToast(response.data.message, 'error')
        }
      } catch (error) {
        this.showToast('클라이밍장 삭제 중 오류가 발생했습니다.', 'error')
      }
    },

    // 🔔 토스트 메시지
    showToast(message, type = 'success') {
      this.successMessage = message
      this.showSuccessMessage = true
      setTimeout(() => {
        this.showSuccessMessage = false
      }, 3000)
    },

    // 💰 가격 포맷팅
    formatPrice(price) {
      return price ? `${price.toLocaleString()}원` : '가격 미정'
    },

    // 📊 혼잡도 관련 유틸리티
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

    // 🏢 클라이밍장 관련 유틸리티
    getGymInitial(name) {
      return name.charAt(0)
    },

    formatDate(date) {
      const now = new Date()
      const targetDate = new Date(date)
      const diffTime = now - targetDate
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays < 0) return '오늘'
      if (diffDays < 1) return '어제'
      if (diffDays < 7) return `${diffDays}일 전`
      if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`
      return `${Math.floor(diffDays / 30)}개월 전`
    },

    // 🔖 북마크 기능 (수정됨)
    async toggleBookmark(gymId) {
      if (!this.currentUser) {
        alert('로그인이 필요합니다.')
        this.$router.push('/')
        return
      }

      try {
        const response = await this.$axios.post(`/api/gyms/${gymId}/bookmark`)
        
        if (response.data.success) {
          // 로컬 상태 업데이트
          const gym = this.gyms.find(g => g.id === gymId)
          if (gym) {
            gym.isBookmarked = !gym.isBookmarked
            this.showToast(
              gym.isBookmarked ? '즐겨찾기에 추가했어요! 💚' : '즐겨찾기에서 제거했어요 🤍',
              'success'
            )
          }
        } else {
          this.showToast(response.data.message || '즐겨찾기 처리에 실패했습니다.', 'error')
        }
      } catch (error) {
        console.error('북마크 토글 오류:', error)
        this.showToast('즐겨찾기 처리 중 오류가 발생했습니다.', 'error')
      }
    },

    // 🏢 클라이밍장 상세로 이동
    goToGymDetail(gymId) {
      this.$router.push(`/gyms/${gymId}`)
    },

    // 🚀 별칭 메서드 (기존 코드 호환성)
    goToGym(gymId) {
      this.goToGymDetail(gymId)
    },

    // 📊 혼잡도 제보 관련 메서드들 (추가됨)
    handleCongestionReport(gym) {
      if (!this.currentUser) {
        alert('로그인이 필요합니다.')
        this.$router.push('/')
        return
      }
      
      if (!gym || !gym.id) {
        this.showToast('클라이밍장 정보를 찾을 수 없습니다.', 'error')
        return
      }
      
      // 선택된 클라이밍장 정보 저장
      this.selectedGymForCongestion = { ...gym }
      this.selectedCongestionLevel = ''
      this.estimatedPeople = null
      this.showCongestionModal = true
    },

    closeCongestionModal() {
      this.showCongestionModal = false
      this.selectedGymForCongestion = null
      this.selectedCongestionLevel = ''
      this.estimatedPeople = null
    },

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

        const response = await this.$axios.post(
          `/api/gyms/${this.selectedGymForCongestion.id}/congestion`, 
          congestionData
        )

        if (response.data.success) {
          this.showToast('혼잡도 제보가 완료되었습니다! 감사합니다 🙏', 'success')
          this.closeCongestionModal()
          
          // 클라이밍장 목록 새로고침
          await this.fetchGyms()
        } else {
          this.showToast(response.data.message || '혼잡도 제보에 실패했습니다.', 'error')
        }
      } catch (error) {
        console.error('혼잡도 제보 오류:', error)
        this.showToast('혼잡도 제보 중 오류가 발생했습니다.', 'error')
      } finally {
        this.isSubmittingCongestion = false
      }
    },

    // 🔄 기존 메서드 (호환성 유지)
    reportCongestion(gym) {
      this.handleCongestionReport(gym)
    }
  },

  async created() {
    await this.fetchGyms()
  },

  beforeUnmount() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout)
    }
  }
}
</script>

<style scoped>
/* 🎨 새로운 혼잡도 모달 전용 스타일 */
.congestion-modal {
  max-width: 500px;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.congestion-modal-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.gym-icon {
  font-size: 2.5rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.header-text h2 {
  margin: 0 0 0.3rem 0;
  font-size: 1.4rem;
  font-weight: 700;
}

.header-text .gym-name {
  margin: 0;
  opacity: 0.9;
  font-size: 1rem;
  font-weight: 500;
}

.congestion-close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.congestion-close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.congestion-form {
  padding: 2rem;
  background: white;
}

.form-intro {
  text-align: center;
  margin-bottom: 2rem;
}

.intro-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.form-intro h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.2rem;
  font-weight: 600;
}

.form-intro p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
}

.congestion-levels {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.congestion-level {
  display: flex;
  align-items: center;
  padding: 1.2rem;
  border: 2px solid #f0f0f0;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
  position: relative;
  overflow: hidden;
}

.congestion-level::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.1), transparent);
  transition: left 0.5s ease;
}

.congestion-level:hover::before {
  left: 100%;
}

.congestion-level:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
}

.congestion-level.selected {
  border-color: #667eea;
  background: linear-gradient(135deg, #f8f9ff 0%, #e8edff 100%);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
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
  gap: 1rem;
  flex: 1;
}

.level-emoji {
  font-size: 2.5rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(102, 126, 234, 0.1);
  transition: all 0.3s ease;
}

.congestion-level.selected .level-emoji {
  background: rgba(102, 126, 234, 0.2);
  transform: scale(1.1);
}

.level-info {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.level-text {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.congestion-level.selected .level-text {
  color: #667eea;
}

.level-description {
  font-size: 0.85rem;
  color: #666;
  line-height: 1.4;
}

.congestion-level.selected .level-description {
  color: #5a67d8;
}

.selection-indicator {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  background: white;
}

.congestion-level.selected .selection-indicator {
  background: #667eea;
  border-color: #667eea;
}

.check-icon {
  color: white;
  font-size: 14px;
  font-weight: bold;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.congestion-level.selected .check-icon {
  opacity: 1;
}

.additional-info {
  margin-bottom: 2rem;
}

.additional-info .form-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.8rem;
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.label-icon {
  font-size: 1.1rem;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrapper input {
  width: 100%;
  padding: 12px 16px;
  padding-right: 50px;
  border: 2px solid #e1e5e9;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: white;
}

.input-wrapper input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input-suffix {
  position: absolute;
  right: 16px;
  color: #666;
  font-size: 0.9rem;
  pointer-events: none;
}

.input-help {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #666;
  line-height: 1.4;
}

.congestion-form-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.congestion-btn-cancel, .congestion-btn-submit {
  flex: 1;
  padding: 14px 20px;
  border-radius: 16px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  position: relative;
  overflow: hidden;
}

.congestion-btn-cancel {
  background: #f8f9fa;
  color: #666;
  border: 2px solid #e9ecef;
}

.congestion-btn-cancel:hover {
  background: #e9ecef;
  transform: translateY(-2px);
}

.congestion-btn-submit {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.congestion-btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.congestion-btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.btn-icon {
  font-size: 1.1rem;
}

.privacy-notice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 12px;
  font-size: 0.85rem;
  color: #666;
  line-height: 1.4;
  border-left: 3px solid #667eea;
}

.notice-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

/* 기존 스타일에 추가 */

/* 폼 섹션 */
.form-section {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #f0f0f0;
}

.form-section:last-of-type {
  border-bottom: none;
}

.form-section h3 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-description {
  color: #666;
  font-size: 14px;
  margin-bottom: 1rem;
  line-height: 1.5;
}

/* 🎯 기술 선택 그리드 */
.techniques-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.technique-checkbox {
  display: flex;
  align-items: flex-start;
  padding: 1rem;
  border: 2px solid #e1e5e9;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.technique-checkbox:hover {
  border-color: #667eea;
  background: #f8f9ff;
  transform: translateY(-2px);
}

.technique-checkbox.selected {
  border-color: #667eea;
  background: linear-gradient(135deg, #f8f9ff 0%, #e8edff 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.technique-checkbox input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.technique-content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  width: 100%;
}

.technique-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.technique-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.technique-name {
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.technique-checkbox.selected .technique-name {
  color: #667eea;
}

.technique-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.technique-checkbox.selected .technique-desc {
  color: #5a67d8;
}

/* 클라이밍장 카드의 기술 태그 표시 */
.gym-techniques {
  margin-bottom: 1rem;
  padding: 0.8rem;
  background: #f8f9ff;
  border-radius: 8px;
  border-left: 3px solid #667eea;
}

.technique-header {
  font-size: 13px;
  font-weight: 600;
  color: #667eea;
  margin-bottom: 0.5rem;
}

.technique-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}

.technique-tag {
  background: #667eea;
  color: white;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.more-techniques {
  color: #667eea;
  font-size: 11px;
  font-weight: 500;
}

/* 문자 수 카운터 */
.char-count {
  text-align: right;
  font-size: 12px;
  color: #666;
  margin-top: 0.3rem;
}

/* 시간 입력 필드 */
.form-group input[type="time"] {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group input[type="time"]:focus {
  outline: none;
  border-color: #667eea;
}

/* 텍스트 영역 */
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
  resize: vertical;
  min-height: 100px;
  line-height: 1.5;
  font-family: inherit;
}

.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

/* 기존 스타일들 */
.gyms-page {
  min-height: 100vh;
  background: #f8f9fa;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 3rem 0;
  text-align: center;
}

.page-header h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.page-header p {
  font-size: 1.2rem;
  opacity: 0.9;
  margin-bottom: 2rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.add-gym-btn {
  background: white;
  color: #667eea;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;
}

.add-gym-btn:hover {
  transform: translateY(-2px);
}

.search-section {
  background: white;
  padding: 2rem 0;
  border-bottom: 1px solid #eee;
}

.search-controls {
  display: flex;
  gap: 2rem;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  max-width: 400px;
  border: 2px solid #e1e5e9;
  border-radius: 25px;
  overflow: hidden;
  flex: 1;
  min-width: 300px;
}

.search-box input {
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

.sort-options {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sort-options label {
  font-weight: 500;
  color: #333;
}

.sort-options select {
  padding: 8px 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  background: white;
  font-size: 14px;
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

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h2 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.8rem;
}

.empty-state p {
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.results-header h3 {
  color: #333;
  margin: 0;
  font-size: 1.5rem;
}

.gyms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
}

.gym-card {
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.gym-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.15);
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
  font-size: 3rem;
  font-weight: bold;
  color: white;
}

.image-overlay {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.congestion-badge {
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.congestion-badge.low { background: #4caf50; }
.congestion-badge.medium { background: #ff9800; }
.congestion-badge.high { background: #f44336; }
.congestion-badge.very-high { background: #9c27b0; }

.delete-btn {
  background: rgba(244, 67, 54, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.delete-btn:hover {
  background: rgba(244, 67, 54, 1);
  transform: scale(1.1);
}

.gym-info {
  padding: 1.5rem;
}

.gym-name {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #333;
}

.gym-address {
  color: #666;
  margin-bottom: 1rem;
  font-size: 14px;
}

.price-info {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-bottom: 0.8rem;
}

.day-price {
  font-weight: 600;
  color: #667eea;
  font-size: 15px;
}

.month-price {
  color: #666;
  font-size: 14px;
}

.contact-info {
  margin-bottom: 0.8rem;
}

.phone {
  color: #666;
  font-size: 14px;
}

.gym-description {
  margin-bottom: 1rem;
  padding: 0.8rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 3px solid #667eea;
}

.gym-description p {
  margin: 0;
  color: #555;
  font-size: 14px;
  line-height: 1.5;
}

.gym-rating {
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rating-stars {
  color: #ff9800;
  font-weight: bold;
}

.review-count {
  color: #666;
  font-size: 13px;
}

.gym-meta {
  margin-bottom: 1rem;
  padding-top: 0.5rem;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.added-date, .view-count {
  color: #999;
  font-size: 12px;
}

.gym-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-outline, .btn-congestion, .btn-primary {
  padding: 8px 12px;
  border-radius: 15px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
  border: none;
  flex: 1;
  min-width: 80px;
}

.btn-outline {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
}

.btn-outline:hover {
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

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a67d8;
}

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
  max-width: 800px;
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

.gym-form {
  padding: 2rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  margin-bottom: 1rem;
  position: relative;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
  transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
}

.unit {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  font-size: 14px;
  pointer-events: none;
  margin-top: 12px;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
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

/* 반응형 디자인 - 혼잡도 모달 */
@media (max-width: 600px) {
  .congestion-modal {
    margin: 20px;
    max-height: 90vh;
  }
  
  .congestion-modal-header {
    padding: 1.5rem;
  }
  
  .gym-icon {
    width: 50px;
    height: 50px;
    font-size: 2rem;
  }
  
  .header-text h2 {
    font-size: 1.2rem;
  }
  
  .congestion-form {
    padding: 1.5rem;
  }
  
  .congestion-level {
    padding: 1rem;
  }
  
  .level-emoji {
    width: 50px;
    height: 50px;
    font-size: 2rem;
  }
  
  .congestion-form-actions {
    flex-direction: column;
  }
  
  .congestion-btn-cancel, .congestion-btn-submit {
    flex: none;
  }
}

@media (max-width: 400px) {
  .congestion-modal {
    margin: 10px;
  }
  
  .level-content {
    gap: 0.8rem;
  }
  
  .level-emoji {
    width: 45px;
    height: 45px;
    font-size: 1.8rem;
  }
}

/* 반응형 디자인 - 일반 */
@media (max-width: 768px) {
  .header-actions {
    flex-direction: column;
    gap: 0.8rem;
  }

  .search-controls {
    flex-direction: column;
    gap: 1rem;
  }

  .search-box {
    min-width: auto;
    width: 100%;
  }

  .gyms-grid {
    grid-template-columns: 1fr;
  }

  .results-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .gym-actions {
    flex-direction: column;
  }

  .btn-outline, .btn-congestion, .btn-primary {
    flex: none;
    width: 100%;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .techniques-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 0 15px;
  }

  .page-header {
    padding: 2rem 0;
  }

  .page-header h1 {
    font-size: 1.8rem;
  }

  .modal-content {
    margin: 10px;
    max-height: 95vh;
  }

  .modal-header {
    padding: 1rem;
  }

  .gym-info {
    padding: 1rem;
  }

  .gym-form {
    padding: 1rem;
  }
}
</style>