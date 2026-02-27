<template>
  <div class="gym-reviews">
    <div class="reviews-header">
      <h3>⭐ 리뷰 ({{ reviews.length }}개)</h3>
      <div class="rating-summary" v-if="gymRating > 0">
        <div class="overall-rating">
          <span class="rating-number">{{ gymRating.toFixed(1) }}</span>
          <div class="stars">
            <span v-for="n in 5" :key="n" class="star" :class="{ filled: n <= Math.round(gymRating) }">★</span>
          </div>
          <span class="total-reviews">({{ totalReviews }}개 리뷰)</span>
        </div>
      </div>
      <button @click="showWriteModal = true" class="btn-write-review" v-if="currentUser && !hasUserReview">
        ✍ 리뷰 작성하기
      </button>
    </div>

    <!-- 필터 및 정렬 -->
    <div class="reviews-controls">
      <div class="filter-group">
        <label>별점 필터:</label>
        <select v-model="ratingFilter" @change="loadReviews">
          <option value="">전체</option>
          <option value="5">⭐⭐⭐⭐⭐ (5점)</option>
          <option value="4">⭐⭐⭐⭐ (4점)</option>
          <option value="3">⭐⭐⭐ (3점)</option>
          <option value="2">⭐⭐ (2점)</option>
          <option value="1">⭐ (1점)</option>
        </select>
      </div>
      <div class="sort-group">
        <label>정렬:</label>
        <select v-model="sortBy" @change="loadReviews">
          <option value="latest">최신순</option>
          <option value="rating_high">평점 높은순</option>
          <option value="rating_low">평점 낮은순</option>
        </select>
      </div>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>리뷰를 불러오는 중...</p>
    </div>

    <!-- 리뷰 목록 -->
    <div v-else-if="reviews.length > 0" class="reviews-list">
      <div v-for="review in reviews" :key="review.id" class="review-item">
        <div class="review-header">
          <div class="reviewer-info">
            <span class="reviewer-name">{{ review.reviewer.nickname }}</span>
            <span v-if="review.reviewer.level" class="reviewer-level">{{ review.reviewer.level }}</span>
            <span v-if="review.reviewer.hasInstructorLicense" class="instructor-badge">🏅 지도자</span>
          </div>
          <div class="review-meta">
            <div class="review-rating">
              <span v-for="n in 5" :key="n" class="star" :class="{ filled: n <= review.rating }">★</span>
              <span class="rating-text">({{ review.rating }}점)</span>
            </div>
            <span class="review-date">{{ formatDate(review.createdAt) }}</span>
          </div>
        </div>

        <div class="review-content">
          <p>{{ review.content }}</p>
        </div>

        <div class="review-details" v-if="review.visitDate || review.difficulty || review.crowdLevel">
          <span v-if="review.visitDate" class="detail-item">
            📅 방문일: {{ formatVisitDate(review.visitDate) }}
          </span>
          <span v-if="review.difficulty" class="detail-item">
            🎯 난이도: {{ review.difficulty }}
          </span>
          <span v-if="review.crowdLevel" class="detail-item">
            👥 혼잡도: {{ review.crowdLevel }}
          </span>
        </div>

        <!-- 본인이 작성한 리뷰인 경우 수정/삭제 버튼 -->
        <div v-if="currentUser && review.reviewer.userId === currentUser.userId" class="review-actions">
          <button @click="editReview(review)" class="btn-edit">✏ 수정</button>
          <button @click="confirmDeleteReview(review)" class="btn-delete">🗑 삭제</button>
        </div>
      </div>

      <!-- 페이지네이션 -->
      <div v-if="pagination.totalPages > 1" class="pagination">
        <button @click="changePage(pagination.currentPage - 1)" :disabled="!pagination.hasPrev" class="page-btn">
          이전
        </button>
        <div class="page-numbers">
          <button v-for="page in getPageNumbers()" :key="page" @click="changePage(page)" 
                  :class="{ active: page === pagination.currentPage }" class="page-number">
            {{ page }}
          </button>
        </div>
        <button @click="changePage(pagination.currentPage + 1)" :disabled="!pagination.hasNext" class="page-btn">
          다음
        </button>
      </div>
    </div>

    <!-- 리뷰 없음 -->
    <div v-else class="no-reviews">
      <p>아직 작성된 리뷰가 없습니다.</p>
      <button @click="showWriteModal = true" class="btn-write-first" v-if="currentUser">
        첫 번째 리뷰 작성하기
      </button>
    </div>

    <!-- 리뷰 작성/수정 모달 -->
    <div v-if="showWriteModal" class="modal-overlay" @click="closeWriteModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ editingReview ? '✏ 리뷰 수정' : '✍ 리뷰 작성' }}</h2>
          <button @click="closeWriteModal" class="close-btn">✕</button>
        </div>

        <form @submit.prevent="submitReview" class="review-form">
          <!-- 별점 -->
          <div class="form-group">
            <label>별점 *</label>
            <div class="rating-input">
              <span v-for="n in 5" :key="n" class="star-input" 
                    :class="{ active: n <= reviewForm.rating }" 
                    @click="reviewForm.rating = n">★</span>
              <span class="rating-text">{{ reviewForm.rating }}점</span>
            </div>
          </div>

          <!-- 리뷰 내용 -->
          <div class="form-group">
            <label>리뷰 내용 *</label>
            <textarea v-model="reviewForm.content" placeholder="클라이밍장에 대한 솔직한 후기를 남겨주세요. (최소 10자)" 
                      rows="6" maxlength="1000" required></textarea>
            <div class="char-count">{{ reviewForm.content.length }}/1000</div>
          </div>

          <!-- 방문 날짜 -->
          <div class="form-group">
            <label>방문 날짜 (선택사항)</label>
            <input type="date" v-model="reviewForm.visitDate" :max="today">
          </div>

          <!-- 추가 정보 -->
          <div class="form-row">
            <div class="form-group">
              <label>난이도 평가 (선택사항)</label>
              <select v-model="reviewForm.difficulty">
                <option value="">선택 안함</option>
                <option value="쉬움">쉬움</option>
                <option value="보통">보통</option>
                <option value="어려움">어려움</option>
              </select>
            </div>
            <div class="form-group">
              <label>방문 당시 혼잡도 (선택사항)</label>
              <select v-model="reviewForm.crowdLevel">
                <option value="">선택 안함</option>
                <option value="여유">여유</option>
                <option value="보통">보통</option>
                <option value="혼잡">혼잡</option>
              </select>
            </div>
          </div>

          <!-- 제출 버튼 -->
          <div class="form-actions">
            <button type="button" @click="closeWriteModal" class="btn-cancel">취소</button>
            <button type="submit" :disabled="!isFormValid || isSubmitting" class="btn-submit">
              {{ isSubmitting ? '작성 중...' : (editingReview ? '수정하기' : '리뷰 작성') }}
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
  name: 'GymReviews',
  props: {
    gymId: {
      type: [Number, String],
      required: true
    },
    gymRating: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      reviews: [],
      totalReviews: 0,
      isLoading: false,
      showWriteModal: false,
      isSubmitting: false,
      editingReview: null,
      showSuccessMessage: false,
      successMessage: '',
      
      // 필터 및 정렬
      ratingFilter: '',
      sortBy: 'latest',
      
      // 페이지네이션
      pagination: {
        currentPage: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      },

      // 리뷰 작성 폼
      reviewForm: {
        rating: 5,
        content: '',
        visitDate: '',
        difficulty: '',
        crowdLevel: ''
      }
    }
  },
  computed: {
    currentUser() {
      return this.$store.state.loginUser
    },
    
    hasUserReview() {
      if (!this.currentUser) return false
      return this.reviews.some(review => review.reviewer.userId === this.currentUser.userId)
    },
    
    isFormValid() {
      return this.reviewForm.rating >= 1 && 
             this.reviewForm.rating <= 5 && 
             this.reviewForm.content.trim().length >= 10
    },
    
    today() {
      return new Date().toISOString().split('T')[0]
    }
  },
  methods: {
    // 리뷰 목록 로드
    async loadReviews(page = 1) {
      this.isLoading = true
      
      try {
        const params = {
          page: page,
          limit: 5,
          sortBy: this.sortBy
        }
        
        if (this.ratingFilter) {
          params.rating = this.ratingFilter
        }
        
        const response = await this.$axios.get(`/api/gyms/${this.gymId}/reviews`, { params })
        
        if (response.data.success) {
          this.reviews = response.data.reviews
          this.pagination = response.data.pagination
          this.totalReviews = response.data.pagination.totalReviews
        }
      } catch (error) {
        this.showToast('리뷰를 불러오는 중 오류가 발생했습니다.', 'error')
      } finally {
        this.isLoading = false
      }
    },

    // 페이지 변경
    changePage(page) {
      if (page >= 1 && page <= this.pagination.totalPages) {
        this.loadReviews(page)
      }
    },

    // 페이지 번호 배열 생성
    getPageNumbers() {
      const total = this.pagination.totalPages
      const current = this.pagination.currentPage
      const pages = []
      const start = Math.max(1, current - 2)
      const end = Math.min(total, current + 2)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      return pages
    },

    // 리뷰 작성 모달 열기
    openWriteModal() {
      if (!this.currentUser) {
        alert('로그인이 필요합니다.')
        return
      }
      
      this.resetForm()
      this.editingReview = null
      this.showWriteModal = true
    },

    // 리뷰 수정 모달 열기
    editReview(review) {
      this.editingReview = review
      this.reviewForm = {
        rating: review.rating,
        content: review.content,
        visitDate: review.visitDate ? new Date(review.visitDate).toISOString().split('T')[0] : '',
        difficulty: review.difficulty || '',
        crowdLevel: review.crowdLevel || ''
      }
      this.showWriteModal = true
    },

    // 모달 닫기
    closeWriteModal() {
      this.showWriteModal = false
      this.editingReview = null
      this.resetForm()
    },

    // 폼 리셋
    resetForm() {
      this.reviewForm = {
        rating: 5,
        content: '',
        visitDate: '',
        difficulty: '',
        crowdLevel: ''
      }
    },

    // 리뷰 제출
    async submitReview() {
      if (!this.isFormValid) return
      
      this.isSubmitting = true
      
      try {
        const reviewData = {
          rating: this.reviewForm.rating,
          content: this.reviewForm.content.trim(),
          visitDate: this.reviewForm.visitDate || null,
          difficulty: this.reviewForm.difficulty || null,
          crowdLevel: this.reviewForm.crowdLevel || null
        }

        let response
        if (this.editingReview) {
          // 수정
          response = await this.$axios.put(`/api/gyms/${this.gymId}/reviews/${this.editingReview.id}`, reviewData)
        } else {
          // 새 작성
          response = await this.$axios.post(`/api/gyms/${this.gymId}/reviews`, reviewData)
        }

        if (response.data.success) {
          this.showToast(response.data.message, 'success')
          this.closeWriteModal()
          await this.loadReviews(1)
          
          // 부모 컴포넌트에 평점 업데이트 알림
          this.$emit('rating-updated', response.data.updatedGymRating)
        } else {
          this.showToast(response.data.message, 'error')
        }
      } catch (error) {
        if (error.response?.data?.message) {
          this.showToast(error.response.data.message, 'error')
        } else {
          this.showToast('리뷰 처리 중 오류가 발생했습니다.', 'error')
        }
      } finally {
        this.isSubmitting = false
      }
    },

    // 리뷰 삭제 확인
    confirmDeleteReview(review) {
      if (confirm('정말로 이 리뷰를 삭제하시겠습니까?')) {
        this.deleteReview(review)
      }
    },

    // 리뷰 삭제
    async deleteReview(review) {
      try {
        const response = await this.$axios.delete(`/api/gyms/${this.gymId}/reviews/${review.id}`)
        
        if (response.data.success) {
          this.showToast('리뷰가 삭제되었습니다.', 'success')
          await this.loadReviews(1)
          
          // 부모 컴포넌트에 평점 업데이트 알림
          this.$emit('rating-updated')
        } else {
          this.showToast(response.data.message, 'error')
        }
      } catch (error) {
        this.showToast('리뷰 삭제 중 오류가 발생했습니다.', 'error')
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

    // 날짜 포맷팅
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

    // 방문 날짜 포맷팅
    formatVisitDate(date) {
      const visitDate = new Date(date)
      const year = visitDate.getFullYear()
      const month = visitDate.getMonth() + 1
      const day = visitDate.getDate()
      return `${year}년 ${month}월 ${day}일`
    }
  },

  async created() {
    await this.loadReviews()
  }
}
</script>

<style scoped>
/* 전체 리뷰 섹션 */
.gym-reviews {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

/* 리뷰 헤더 */
.reviews-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.reviews-header h3 {
  color: #333;
  margin: 0;
}

.rating-summary {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.overall-rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rating-number {
  font-size: 2rem;
  font-weight: bold;
  color: #ff9800;
}

.stars {
  display: flex;
  gap: 0.1rem;
}

.star {
  color: #ddd;
  font-size: 1.2rem;
}

.star.filled {
  color: #ff9800;
}

.total-reviews {
  color: #666;
  font-size: 14px;
}

.btn-write-review, .btn-write-first {
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-write-review:hover, .btn-write-first:hover {
  background: #5a67d8;
}

/* 리뷰 컨트롤 */
.reviews-controls {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.filter-group, .sort-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group label, .sort-group label {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.filter-group select, .sort-group select {
  padding: 6px 12px;
  border: 2px solid #e1e5e9;
  border-radius: 6px;
  font-size: 14px;
}

/* 로딩 상태 */
.loading-state {
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

/* 리뷰 목록 */
.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.review-item {
  padding: 1.5rem;
  border: 1px solid #eee;
  border-radius: 12px;
  background: #fafafa;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.reviewer-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.reviewer-name {
  font-weight: 600;
  color: #333;
}

.reviewer-level {
  background: #667eea;
  color: white;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: bold;
}

.instructor-badge {
  background: #ff9800;
  color: white;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: bold;
}

.review-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.3rem;
}

.review-rating {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.rating-text {
  color: #666;
  font-size: 13px;
  font-weight: 500;
}

.review-date {
  color: #999;
  font-size: 12px;
}

.review-content {
  margin-bottom: 1rem;
  line-height: 1.6;
  color: #333;
}

.review-details {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.detail-item {
  background: white;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 12px;
  color: #666;
  border: 1px solid #e1e5e9;
}

.review-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.btn-edit, .btn-delete {
  padding: 6px 12px;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-edit {
  background: #2196f3;
  color: white;
}

.btn-edit:hover {
  background: #1976d2;
}

.btn-delete {
  background: #f44336;
  color: white;
}

.btn-delete:hover {
  background: #d32f2f;
}

/* 페이지네이션 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 2rem;
}

.page-btn, .page-number {
  background: white;
  border: 2px solid #e1e5e9;
  color: #333;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled), .page-number:hover {
  border-color: #667eea;
  color: #667eea;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-number.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.page-numbers {
  display: flex;
  gap: 0.3rem;
}

/* 리뷰 없음 */
.no-reviews {
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
  max-width: 600px;
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

/* 리뷰 작성 폼 */
.review-form {
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

.rating-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.star-input {
  font-size: 2rem;
  color: #ddd;
  cursor: pointer;
  transition: color 0.2s;
}

.star-input.active {
  color: #ff9800;
}

.star-input:hover {
  color: #ff9800;
}

.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
  resize: vertical;
  min-height: 120px;
  line-height: 1.6;
}

.form-group input, .form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group input:focus, .form-group select:focus, .form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: #666;
  margin-top: 0.3rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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
  .reviews-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .rating-summary {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .reviews-controls {
    flex-direction: column;
    gap: 1rem;
  }

  .review-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .review-meta {
    align-items: flex-start;
  }

  .review-details {
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-cancel, .btn-submit {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .gym-reviews {
    padding: 1rem;
  }

  .review-item {
    padding: 1rem;
  }

  .modal-content {
    margin: 10px;
    max-height: 95vh;
  }

  .modal-header {
    padding: 1rem;
  }

  .review-form {
    padding: 1rem;
  }

  .rating-input {
    flex-wrap: wrap;
  }

  .star-input {
    font-size: 1.5rem;
  }
}
</style>