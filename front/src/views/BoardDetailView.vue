<template>
  <div class="board-detail-page">
    <!-- 로딩 상태 -->
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <p>게시글을 불러오는 중...</p>
    </div>

    <!-- 게시글 상세 -->
    <div v-else-if="post" class="container">
      <!-- 뒤로가기 버튼 -->
      <div class="back-button">
        <button @click="goBack" class="btn-back">← 목록으로 돌아가기</button>
      </div>

      <!-- 게시글 내용 -->
      <div class="post-detail-card">
        <!-- 게시글 헤더 -->
        <div class="post-header">
          <div class="post-meta">
            <span class="post-category" :class="post.category">
              {{ getCategoryEmoji(post.category) }} {{ post.category }}
            </span>
            <span class="post-date">{{ formatDate(post.createdAt) }}</span>
          </div>
          
          <!-- 작성자 권한이 있을 때만 수정/삭제 버튼 표시 -->
          <div v-if="canEditPost" class="post-actions">
            <button @click="editPost" class="btn-edit">✏️ 수정</button>
            <button @click="confirmDeletePost" class="btn-delete">🗑️ 삭제</button>
          </div>
        </div>

        <!-- 게시글 제목 -->
        <h1 class="post-title">{{ post.title }}</h1>

        <!-- 작성자 정보 -->
        <div class="author-info">
          <div class="author-details">
            <span class="author-name">{{ post.author.nickname }}</span>
            <span v-if="post.author.level" class="author-level">{{ post.author.level }}</span>
            <span v-if="post.author.hasInstructorLicense" class="instructor-badge">🏅 지도자</span>
          </div>
        </div>

        <!-- 클라이밍장 정보 (있는 경우) -->
        <div v-if="post.meetingGym" class="gym-info">
          <div class="gym-card" @click="goToGym(post.meetingGym.id)">
            <h4>🏢 {{ post.meetingGym.name }}</h4>
            <p>📍 {{ post.meetingGym.address }}</p>
            <div v-if="post.meetingGym.avgCongestion" class="congestion-info">
              <span class="congestion-badge" :class="getCongestionClass(post.meetingGym.avgCongestion)">
                {{ getCongestionText(post.meetingGym.avgCongestion) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 모임 정보 (모임 글인 경우) -->
        <div v-if="post.category === '모임' && post.meetingDate" class="meeting-info">
          <h4>🤝 모임 정보</h4>
          <div class="meeting-details">
            <div class="detail-item">
              <span class="label">📅 모임 일시:</span>
              <span class="value">{{ formatMeetingDate(post.meetingDate) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">👥 모집 인원:</span>
              <span class="value">{{ post.maxPeople }}명</span>
            </div>
            <div class="detail-item">
              <span class="label">📍 모임 장소:</span>
              <span class="value">{{ post.meetingGym?.name || '미정' }}</span>
            </div>
          </div>
          <!-- 모임 참가 버튼 (향후 구현) -->
          <div class="meeting-actions">
            <button class="btn-join" disabled>참가 신청 (준비중)</button>
          </div>
        </div>

        <!-- 게시글 본문 -->
        <div class="post-content">
          <p>{{ post.content }}</p>
        </div>

        <!-- 게시글 통계 및 액션 -->
        <div class="post-stats-actions">
          <div class="post-stats">
            <span class="stat-item">👁 {{ post.views }}</span>
            <span class="stat-item">💬 {{ comments.length }}</span>
          </div>
          <div class="post-actions-bottom">
            <button @click="toggleLike" class="btn-like" :class="{ liked: isLiked }">
              {{ isLiked ? '❤️' : '🤍' }} {{ post.likes }}
            </button>
          </div>
        </div>
      </div>

      <!-- 댓글 섹션 -->
      <div class="comments-section">
        <div class="comments-header">
          <h3>💬 댓글 ({{ comments.length }}개)</h3>
        </div>

        <!-- 댓글 작성 폼 -->
        <div v-if="currentUser" class="comment-form">
          <div class="form-header">
            <span class="commenter-name">{{ currentUser.nickname }}</span>
          </div>
          <textarea 
            v-model="newComment" 
            placeholder="댓글을 입력해주세요..." 
            rows="3"
            maxlength="500"
          ></textarea>
          <div class="form-actions">
            <span class="char-count">{{ newComment.length }}/500</span>
            <button @click="submitComment" :disabled="!newComment.trim()" class="btn-submit">
              댓글 작성
            </button>
          </div>
        </div>

        <!-- 로그인 안내 -->
        <div v-else class="login-prompt">
          <p>댓글을 작성하려면 로그인이 필요합니다.</p>
          <button @click="goToLogin" class="btn-login">로그인하기</button>
        </div>

        <!-- 댓글 목록 -->
        <div v-if="comments.length > 0" class="comments-list">
          <div v-for="comment in comments" :key="comment.id" class="comment-item">
            <!-- 일반 댓글 -->
            <div class="comment-main">
              <div class="comment-header">
                <div class="commenter-info">
                  <span class="commenter-name">{{ comment.author.nickname }}</span>
                  <span v-if="comment.author.level" class="commenter-level">{{ comment.author.level }}</span>
                  <span v-if="comment.author.hasInstructorLicense" class="instructor-badge">🏅</span>
                </div>
                <div class="comment-meta">
                  <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
                  <!-- 댓글 작성자 권한이 있을 때만 삭제 버튼 -->
                  <button 
                    v-if="currentUser && comment.author.userId === currentUser.userId" 
                    @click="confirmDeleteComment(comment)"
                    class="btn-delete-comment"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div class="comment-content">
                <p>{{ comment.content }}</p>
              </div>
              <div class="comment-actions">
                <button @click="toggleReply(comment.id)" class="btn-reply">
                  💬 답글 {{ comment.replies?.length || 0 }}
                </button>
              </div>
            </div>

            <!-- 답글 목록 -->
            <div v-if="comment.replies && comment.replies.length > 0" class="replies-list">
              <div v-for="reply in comment.replies" :key="reply.id" class="reply-item">
                <div class="reply-header">
                  <div class="commenter-info">
                    <span class="commenter-name">{{ reply.author.nickname }}</span>
                    <span v-if="reply.author.level" class="commenter-level">{{ reply.author.level }}</span>
                  </div>
                  <div class="comment-meta">
                    <span class="comment-date">{{ formatDate(reply.createdAt) }}</span>
                    <button 
                      v-if="currentUser && reply.author.userId === currentUser.userId" 
                      @click="confirmDeleteComment(reply)"
                      class="btn-delete-comment"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div class="reply-content">
                  <p>{{ reply.content }}</p>
                </div>
              </div>
            </div>

            <!-- 답글 작성 폼 -->
            <div v-if="currentUser && showReplyForm === comment.id" class="reply-form">
              <textarea 
                v-model="newReply" 
                placeholder="답글을 입력해주세요..." 
                rows="2"
                maxlength="500"
              ></textarea>
              <div class="form-actions">
                <button @click="cancelReply" class="btn-cancel">취소</button>
                <button @click="submitReply(comment.id)" :disabled="!newReply.trim()" class="btn-submit">
                  답글 작성
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 댓글 없음 -->
        <div v-else class="no-comments">
          <p>아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!</p>
        </div>
      </div>
    </div>

    <!-- 에러 상태 -->
    <div v-else class="error-container">
      <div class="error-content">
        <h2>😕 게시글을 찾을 수 없습니다</h2>
        <p>삭제되었거나 존재하지 않는 게시글입니다.</p>
        <button @click="goBack" class="btn-primary">목록으로 돌아가기</button>
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
  name: 'BoardDetailView',
  data() {
    return {
      post: null,
      comments: [],
      isLoading: true,
      isLiked: false,
      newComment: '',
      newReply: '',
      showReplyForm: null,
      showSuccessMessage: false,
      successMessage: ''
    }
  },
  computed: {
    currentUser() {
      return this.$store.state.loginUser
    },
    canEditPost() {
      return this.currentUser && this.post && this.post.author.userId === this.currentUser.userId
    }
  },
  methods: {
    // 게시글 상세 로드
    async loadPostDetail() {
      const postId = this.$route.params.id
      this.isLoading = true
      
      try {
        const response = await this.$axios.get(`/api/posts/${postId}`)
        if (response.data.success) {
          this.post = response.data.post
          this.comments = this.post.comments || []
          // 대댓글이 있는 댓글만 필터링하고 정렬
          this.comments = this.comments.filter(comment => !comment.parentId)
          this.sortComments()
        } else {
          this.post = null
        }
      } catch (error) {
        console.error('게시글 로드 오류:', error)
        this.post = null
      } finally {
        this.isLoading = false
      }
    },

    // 댓글 정렬 (최신순)
    sortComments() {
      this.comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      // 각 댓글의 답글도 정렬
      this.comments.forEach(comment => {
        if (comment.replies) {
          comment.replies.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        }
      })
    },

    // 댓글 작성
    async submitComment() {
      if (!this.newComment.trim()) return
      
      try {
        const response = await this.$axios.post(`/api/posts/${this.post.id}/comments`, {
          content: this.newComment.trim()
        })
        
        if (response.data.success) {
          this.showToast('댓글이 작성되었습니다! 💬')
          this.newComment = ''
          // 댓글 목록 새로고침
          await this.loadPostDetail()
        } else {
          this.showToast(response.data.message, 'error')
        }
      } catch (error) {
        console.error('댓글 작성 오류:', error)
        this.showToast('댓글 작성 중 오류가 발생했습니다.', 'error')
      }
    },

    // 답글 토글
    toggleReply(commentId) {
      if (this.showReplyForm === commentId) {
        this.showReplyForm = null
        this.newReply = ''
      } else {
        this.showReplyForm = commentId
        this.newReply = ''
      }
    },

    // 답글 작성
    async submitReply(parentId) {
      if (!this.newReply.trim()) return
      
      try {
        const response = await this.$axios.post(`/api/posts/${this.post.id}/comments`, {
          content: this.newReply.trim(),
          parentId: parentId
        })
        
        if (response.data.success) {
          this.showToast('답글이 작성되었습니다! 💬')
          this.cancelReply()
          // 댓글 목록 새로고침
          await this.loadPostDetail()
        } else {
          this.showToast(response.data.message, 'error')
        }
      } catch (error) {
        console.error('답글 작성 오류:', error)
        this.showToast('답글 작성 중 오류가 발생했습니다.', 'error')
      }
    },

    // 답글 취소
    cancelReply() {
      this.showReplyForm = null
      this.newReply = ''
    },

    // 좋아요 토글
    async toggleLike() {
      if (!this.currentUser) {
        alert('로그인이 필요합니다.')
        return
      }

      try {
        const response = await this.$axios.post(`/api/posts/${this.post.id}/like`)
        if (response.data.success) {
          this.post.likes = response.data.likes
          this.isLiked = !this.isLiked
          this.showToast('좋아요가 반영되었습니다! ❤️')
        }
      } catch (error) {
        console.error('좋아요 오류:', error)
        this.showToast('좋아요 처리 중 오류가 발생했습니다.', 'error')
      }
    },

    // 게시글 수정
    editPost() {
      this.$router.push(`/board/edit/${this.post.id}`)
    },

    // 게시글 삭제 확인
    confirmDeletePost() {
      if (confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
        this.deletePost()
      }
    },

    // 게시글 삭제
    async deletePost() {
      try {
        const response = await this.$axios.delete(`/api/posts/${this.post.id}`)
        if (response.data.success) {
          this.showToast('게시글이 삭제되었습니다.')
          this.$router.push('/board')
        } else {
          this.showToast(response.data.message, 'error')
        }
      } catch (error) {
        console.error('게시글 삭제 오류:', error)
        this.showToast('게시글 삭제 중 오류가 발생했습니다.', 'error')
      }
    },

    // 댓글 삭제 확인
    confirmDeleteComment(comment) {
      if (confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
        this.deleteComment(comment)
      }
    },

    // 댓글 삭제
    async deleteComment(comment) {
      try {
        const response = await this.$axios.delete(`/api/posts/${this.post.id}/comments/${comment.id}`)
        if (response.data.success) {
          this.showToast('댓글이 삭제되었습니다.')
          // 댓글 목록 새로고침
          await this.loadPostDetail()
        } else {
          this.showToast(response.data.message, 'error')
        }
      } catch (error) {
        console.error('댓글 삭제 오류:', error)
        if (error.response?.data?.message) {
          this.showToast(error.response.data.message, 'error')
        } else {
          this.showToast('댓글 삭제 중 오류가 발생했습니다.', 'error')
        }
      }
    },

    // 뒤로가기
    goBack() {
      this.$router.push('/board')
    },

    // 로그인 페이지로 이동
    goToLogin() {
      this.$router.push('/')
    },

    // 클라이밍장 상세로 이동
    goToGym(gymId) {
      this.$router.push(`/gyms/${gymId}`)
    },

    // 토스트 메시지 표시
    showToast(message, type = 'success') {
      this.successMessage = message
      this.showSuccessMessage = true
      setTimeout(() => {
        this.showSuccessMessage = false
      }, 3000)
    },

    // 유틸리티 함수들
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
        if (level < 0.4) return 'low'
        if (level < 0.7) return 'medium'
        return 'high'
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
        if (level < 0.4) return '여유'
        if (level < 0.7) return '보통'
        return '혼잡'
      }
      return level || '정보없음'
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

    formatMeetingDate(date) {
      const meetingDate = new Date(date)
      const year = meetingDate.getFullYear()
      const month = meetingDate.getMonth() + 1
      const day = meetingDate.getDate()
      const hours = meetingDate.getHours()
      const minutes = meetingDate.getMinutes()
      
      return `${year}년 ${month}월 ${day}일 ${hours}:${minutes.toString().padStart(2, '0')}`
    }
  },

  async created() {
    await this.loadPostDetail()
  }
}
</script>

<style scoped>
/* 전체 페이지 */
.board-detail-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding: 2rem 0;
}

.container {
  max-width: 800px;
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

/* 게시글 상세 카드 */
.post-detail-card {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.post-category {
  padding: 6px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.post-category.후기 { background: #4caf50; }
.post-category.질문 { background: #2196f3; }
.post-category.모임 { background: #ff9800; }

.post-date {
  color: #666;
  font-size: 14px;
}

.post-actions {
  display: flex;
  gap: 0.5rem;
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

.post-title {
  font-size: 2rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 1.5rem;
  line-height: 1.4;
}

/* 작성자 정보 */
.author-info {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 10px;
  border-left: 4px solid #667eea;
}

.author-details {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.author-name {
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.author-level {
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

/* 클라이밍장 정보 */
.gym-info {
  margin-bottom: 1.5rem;
}

.gym-card {
  background: #f8f9ff;
  padding: 1.5rem;
  border-radius: 12px;
  border-left: 4px solid #667eea;
  cursor: pointer;
  transition: all 0.2s;
}

.gym-card:hover {
  background: #e8edff;
  transform: translateY(-2px);
}

.gym-card h4 {
  color: #667eea;
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
}

.gym-card p {
  color: #666;
  margin-bottom: 0.8rem;
}

.congestion-info {
  display: flex;
  align-items: center;
}

.congestion-badge {
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

/* 모임 정보 */
.meeting-info {
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  background: #fff3e0;
  border-radius: 12px;
  border-left: 4px solid #ff9800;
}

.meeting-info h4 {
  color: #f57c00;
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.meeting-details {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.label {
  font-weight: 500;
  color: #f57c00;
  min-width: 100px;
}

.value {
  color: #333;
}

.meeting-actions {
  display: flex;
  gap: 1rem;
}

.btn-join {
  background: #ff9800;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  cursor: not-allowed;
  font-weight: 500;
  opacity: 0.6;
}

/* 게시글 본문 */
.post-content {
  margin-bottom: 2rem;
  line-height: 1.8;
  color: #333;
  font-size: 16px;
}

.post-content p {
  margin-bottom: 1rem;
  white-space: pre-wrap;
}

/* 게시글 통계 및 액션 */
.post-stats-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-top: 1px solid #eee;
  flex-wrap: wrap;
  gap: 1rem;
}

.post-stats {
  display: flex;
  gap: 1rem;
}

.stat-item {
  color: #666;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.post-actions-bottom {
  display: flex;
  gap: 1rem;
}

.btn-like {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-like:hover, .btn-like.liked {
  background: #667eea;
  color: white;
}

/* 댓글 섹션 */
.comments-section {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.comments-header {
  margin-bottom: 1.5rem;
}

.comments-header h3 {
  color: #333;
  margin: 0;
  font-size: 1.3rem;
}

/* 댓글 작성 폼 */
.comment-form {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
  border-left: 4px solid #667eea;
}

.form-header {
  margin-bottom: 0.8rem;
}

.commenter-name {
  font-weight: 600;
  color: #667eea;
  font-size: 14px;
}

.comment-form textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
  resize: vertical;
  min-height: 80px;
  line-height: 1.5;
  font-family: inherit;
  margin-bottom: 0.8rem;
}

.comment-form textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.char-count {
  color: #666;
  font-size: 12px;
}

.btn-submit {
  background: #667eea;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 15px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-submit:hover:not(:disabled) {
  background: #5a67d8;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 로그인 안내 */
.login-prompt {
  text-align: center;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 12px;
  margin-bottom: 2rem;
  color: #666;
}

.login-prompt p {
  margin-bottom: 1rem;
}

.btn-login {
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-login:hover {
  background: #5a67d8;
}

/* 댓글 목록 */
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.comment-item {
  border: 1px solid #eee;
  border-radius: 12px;
  overflow: hidden;
}

.comment-main {
  padding: 1.5rem;
  background: white;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.8rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.commenter-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.commenter-name {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.commenter-level {
  background: #667eea;
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: bold;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.comment-date {
  color: #999;
  font-size: 12px;
}

.btn-delete-comment {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  color: #f44336;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-delete-comment:hover {
  background: #ffebee;
}

.comment-content {
  margin-bottom: 0.8rem;
  line-height: 1.6;
  color: #333;
}

.comment-content p {
  margin: 0;
  white-space: pre-wrap;
}

.comment-actions {
  display: flex;
  gap: 1rem;
}

.btn-reply {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 12px;
  transition: all 0.2s;
}

.btn-reply:hover {
  background: #f8f9ff;
}

/* 답글 목록 */
.replies-list {
  background: #f8f9fa;
  border-top: 1px solid #eee;
}

.reply-item {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #eee;
}

.reply-item:last-child {
  border-bottom: none;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.reply-content {
  line-height: 1.5;
  color: #333;
  font-size: 14px;
}

.reply-content p {
  margin: 0;
  white-space: pre-wrap;
}

/* 답글 작성 폼 */
.reply-form {
  padding: 1rem 1.5rem;
  background: #f0f0f0;
  border-top: 1px solid #eee;
}

.reply-form textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  box-sizing: border-box;
  resize: vertical;
  min-height: 60px;
  line-height: 1.4;
  font-family: inherit;
  margin-bottom: 0.8rem;
}

.reply-form textarea:focus {
  outline: none;
  border-color: #667eea;
}

.reply-form .form-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
  border: none;
  padding: 6px 12px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.reply-form .btn-submit {
  font-size: 12px;
  padding: 6px 12px;
}

/* 댓글 없음 */
.no-comments {
  text-align: center;
  padding: 3rem 2rem;
  color: #666;
}

.no-comments p {
  margin: 0;
  font-size: 16px;
}

/* 기타 버튼 */
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

  .board-detail-page {
    padding: 1rem 0;
  }

  .post-detail-card, .comments-section {
    padding: 1.5rem;
  }

  .post-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .post-title {
    font-size: 1.5rem;
  }

  .post-stats-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .comment-form {
    padding: 1rem;
  }

  .comment-main {
    padding: 1rem;
  }

  .reply-item {
    padding: 0.8rem 1rem;
  }

  .reply-form {
    padding: 0.8rem 1rem;
  }

  .gym-card {
    padding: 1rem;
  }

  .meeting-info {
    padding: 1rem;
  }

  .meeting-details {
    gap: 0.5rem;
  }

  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.2rem;
  }

  .label {
    min-width: auto;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .post-detail-card, .comments-section {
    padding: 1rem;
  }

  .post-title {
    font-size: 1.3rem;
  }

  .comment-form {
    padding: 0.8rem;
  }

  .comment-main {
    padding: 0.8rem;
  }

  .commenter-info {
    flex-wrap: wrap;
  }

  .comment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.3rem;
  }

  .reply-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.3rem;
  }
}
</style>