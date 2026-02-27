<template>
  <div class="board-page">
    <!-- 헤더 섹션 -->
    <section class="page-header">
      <div class="container">
        <h1>📝 클라이밍장 정보 게시판</h1>
        <p>실시간 클라이밍장 정보를 공유하고 확인해보세요!</p>
        <button @click="goToWrite" class="write-btn">
          ✍️ 새 글 작성하기
        </button>
      </div>
    </section>

    <!-- 검색 및 필터 섹션 -->
    <section class="filter-section">
      <div class="container">
        <div class="filter-controls">
          <!-- 카테고리 필터 -->
          <div class="filter-group">
            <label>카테고리</label>
            <!-- 🔥 @change를 onFilterChange로 수정 -->
            <select v-model="filters.category" @change="onFilterChange">
              <option value="all">전체</option>
              <option value="후기">후기</option>
              <option value="질문">질문</option>
              <option value="모임">모임</option>
            </select>
          </div>

          <!-- 클라이밍장 필터 -->
          <div class="filter-group">
            <label>클라이밍장</label>
            <!-- 🔥 @change를 onFilterChange로 수정 -->
            <select v-model="filters.gymId" @change="onFilterChange">
              <option value="">전체 암장</option>
              <option v-for="gym in gymsList" :key="gym.id" :value="gym.id">
                {{ gym.name }}
              </option>
            </select>
          </div>

          <!-- 정렬 옵션 -->
          <div class="filter-group">
            <label>정렬</label>
            <!-- 🔥 @change를 onFilterChange로 수정 -->
            <select v-model="filters.sortBy" @change="onFilterChange">
              <option value="latest">최신순</option>
              <option value="likes">좋아요순</option>
              <option value="views">조회수순</option>
            </select>
          </div>

          <!-- 검색 -->
          <div class="search-group">
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="제목, 내용으로 검색..."
              @keypress.enter="onSearch"
            >
            <!-- 🔥 @click을 onSearch로 수정 -->
            <button @click="onSearch" class="search-btn">🔍</button>
          </div>
        </div>
      </div>
    </section>

    <!-- 게시글 목록 -->
    <section class="posts-section">
      <div class="container">
        <!-- 로딩 상태 -->
        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>게시글을 불러오는 중...</p>
        </div>

        <!-- 빈 상태 -->
        <div v-else-if="posts.length === 0" class="empty-state">
          <div class="empty-icon">📝</div>
          <h3>아직 게시글이 없습니다</h3>
          <p>첫 번째 게시글을 작성해서 정보를 공유해보세요!</p>
          <button @click="goToWrite" class="btn-primary">
            첫 번째 글 작성하기
          </button>
        </div>

        <!-- 게시글 목록 -->
        <div v-else class="posts-list">
          <div class="posts-header">
            <h3>
              📍 {{ getCategoryText(filters.category) }} 
              ({{ pagination.totalPosts }}개의 글)
            </h3>
          </div>

          <div class="posts-grid">
            <article
              v-for="post in posts"
              :key="post.id"
              class="post-card"
              @click="goToPost(post.id)"
            >
              <!-- 게시글 헤더 -->
              <div class="post-header">
                <span class="post-category" :class="post.category">
                  {{ getCategoryEmoji(post.category) }} {{ post.category }}
                </span>
                <span class="post-date">{{ formatDate(post.createdAt) }}</span>
              </div>

              <!-- 게시글 제목 -->
              <h4 class="post-title">{{ post.title }}</h4>

              <!-- 게시글 내용 미리보기 -->
              <p class="post-preview">{{ getContentPreview(post.content) }}</p>

              <!-- 클라이밍장 정보 (있는 경우) -->
              <div v-if="post.meetingGym" class="gym-info">
                <div class="gym-badge">
                  🏢 {{ post.meetingGym.name }}
                  <span 
                    class="congestion-indicator" 
                    :class="getCongestionClass(post.meetingGym.avgCongestion)"
                  >
                    {{ getCongestionText(post.meetingGym.avgCongestion) }}
                  </span>
                </div>
              </div>

              <!-- 모임 정보 (모임 글인 경우) -->
              <div v-if="post.category === '모임' && post.meetingDate" class="meeting-info">
                <div class="meeting-details">
                  <span class="meeting-date">
                    📅 {{ formatMeetingDate(post.meetingDate) }}
                  </span>
                  <span class="meeting-people">
                    👥 {{ post.maxPeople }}명 모집
                  </span>
                </div>
              </div>

              <!-- 작성자 정보 -->
              <div class="post-author">
                <div class="author-info">
                  <span class="author-name">{{ post.author.nickname }}</span>
                  <span v-if="post.author.level" class="author-level">
                    {{ post.author.level }}
                  </span>
                  <span v-if="post.author.hasInstructorLicense" class="instructor-badge">
                    🏅 지도자
                  </span>
                </div>
              </div>

              <!-- 게시글 통계 -->
              <div class="post-stats">
                <span class="stat-item">
                  ❤️ {{ post.likes }}
                </span>
                <span class="stat-item">
                  👁 {{ post.views }}
                </span>
                <span class="stat-item">
                  💬 {{ post.comments.length }}
                </span>
              </div>
            </article>
          </div>

          <!-- 페이지네이션 -->
          <div v-if="pagination.totalPages > 1" class="pagination">
            <button
              @click="changePage(pagination.currentPage - 1)"
              :disabled="!pagination.hasPrev"
              class="page-btn"
            >
              이전
            </button>
            
            <div class="page-numbers">
              <button
                v-for="page in getPageNumbers()"
                :key="page"
                @click="changePage(page)"
                :class="{ active: page === pagination.currentPage }"
                class="page-number"
              >
                {{ page }}
              </button>
            </div>

            <button
              @click="changePage(pagination.currentPage + 1)"
              :disabled="!pagination.hasNext"
              class="page-btn"
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- 플로팅 작성 버튼 (모바일용) -->
    <button @click="goToWrite" class="floating-write-btn">
      ✍️
    </button>
  </div>
</template>

<script>
export default {
  name: 'BoardView',
  data() {
    return {
      posts: [],
      gymsList: [],
      isLoading: true,
      searchKeyword: '',
      filters: {
        category: 'all',
        gymId: '',
        sortBy: 'latest'
      },
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalPosts: 0,
        hasNext: false,
        hasPrev: false
      }
    }
  },
  computed: {
    currentUser() {
      return this.$store.state.loginUser
    }
  },
  methods: {
    // 🔥 게시글 목록 로드 (이벤트 처리 개선)
    async loadPosts(page = 1) {
      // 이벤트 객체가 전달된 경우 처리
      if (typeof page === 'object' && page.target) {
        console.warn('⚠️ 이벤트 객체가 page로 전달됨, 기본값 1 사용');
        page = 1;
      }
      
      // 숫자가 아닌 경우 처리
      page = parseInt(page) || 1;
      
      console.log('📝 loadPosts 호출됨, page:', page);
      
      this.isLoading = true;
      
      try {
        const params = {
          page: page,
          category: this.filters.category || 'all',
          gymId: this.filters.gymId || '',
          sortBy: this.filters.sortBy || 'latest',
          search: this.searchKeyword || ''
        };

        console.log('📝 API 요청 파라미터:', params);

        const response = await this.$axios.get('/api/posts', { params });
        
        if (response.data.success) {
          this.posts = response.data.posts;
          this.pagination = response.data.pagination;
          console.log('✅ 게시글 로드 성공:', this.posts.length, '개');
        } else {
          console.error('게시글 로드 실패:', response.data.message);
          this.posts = [];
        }
      } catch (error) {
        console.error('게시글 로드 오류:', error);
        if (error.response) {
          console.error('응답 데이터:', error.response.data);
        }
        this.posts = [];
        alert('게시글을 불러오는 중 오류가 발생했습니다.');
      } finally {
        this.isLoading = false;
      }
    },

    // 🔥 필터 변경 이벤트 핸들러
    onFilterChange() {
      console.log('🔄 필터 변경됨:', this.filters);
      this.loadPosts(1); // 명시적으로 1페이지로 이동
    },

    // 🔥 검색 이벤트 핸들러
    onSearch() {
      console.log('🔍 검색 실행:', this.searchKeyword);
      this.loadPosts(1); // 명시적으로 1페이지로 이동
    },

    // 클라이밍장 목록 로드
    async loadGyms() {
      try {
        const response = await this.$axios.get('/api/gyms');
        if (response.data.success) {
          this.gymsList = response.data.gyms;
          console.log('✅ 클라이밍장 목록 로드:', this.gymsList.length, '개');
        }
      } catch (error) {
        console.error('클라이밍장 목록 로드 오류:', error);
      }
    },

    // 페이지 변경
    changePage(page) {
      console.log('📄 페이지 변경:', page);
      if (page >= 1 && page <= this.pagination.totalPages) {
        this.loadPosts(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },

    // 페이지 번호 배열 생성
    getPageNumbers() {
      const total = this.pagination.totalPages;
      const current = this.pagination.currentPage;
      const pages = [];
      
      const start = Math.max(1, current - 2);
      const end = Math.min(total, current + 2);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      return pages;
    },

    // 게시글 작성 페이지로 이동
    goToWrite() {
      if (!this.currentUser) {
        alert('로그인이 필요합니다.');
        this.$router.push('/');
        return;
      }
      this.$router.push('/board/write');
    },

    // 게시글 상세 페이지로 이동
    goToPost(postId) {
      this.$router.push(`/board/${postId}`);
    },

    // 카테고리 텍스트 변환
    getCategoryText(category) {
      const categories = {
        'all': '전체 게시글',
        '후기': '클라이밍장 후기',
        '질문': '질문 게시글',
        '모임': '모임 게시글'
      };
      return categories[category] || '전체 게시글';
    },

    // 카테고리 이모지
    getCategoryEmoji(category) {
      const emojis = {
        '후기': '⭐',
        '질문': '❓',
        '모임': '👥'
      };
      return emojis[category] || '📝';
    },

    // 내용 미리보기
    getContentPreview(content) {
      return content.length > 100 ? content.substring(0, 100) + '...' : content;
    },

    // 혼잡도 클래스
    getCongestionClass(congestion) {
      if (congestion < 0.4) return 'low';
      if (congestion < 0.7) return 'medium';
      return 'high';
    },

    // 혼잡도 텍스트
    getCongestionText(congestion) {
      if (congestion < 0.4) return '여유';
      if (congestion < 0.7) return '보통';
      return '혼잡';
    },

    // 날짜 포맷팅
    formatDate(date) {
      const now = new Date();
      const targetDate = new Date(date);
      const diffTime = now - targetDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return '오늘';
      if (diffDays === 1) return '어제';
      if (diffDays < 7) return `${diffDays}일 전`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
      return `${Math.floor(diffDays / 30)}개월 전`;
    },

    // 모임 날짜 포맷팅
    formatMeetingDate(date) {
      const meetingDate = new Date(date);
      const month = meetingDate.getMonth() + 1;
      const day = meetingDate.getDate();
      const hours = meetingDate.getHours();
      const minutes = meetingDate.getMinutes();
      
      return `${month}/${day} ${hours}:${minutes.toString().padStart(2, '0')}`;
    }
  },

  async created() {
    console.log('📋 BoardView 컴포넌트 생성됨');
    
    // 로그인 체크 (선택적)
    if (!this.currentUser) {
      console.log('로그인되지 않은 사용자입니다.');
    }

    // 데이터 로드
    await Promise.all([
      this.loadPosts(1), // 🔥 명시적으로 1페이지 로드
      this.loadGyms()
    ]);
  }
}
</script>

<!-- 스타일은 기존과 동일하므로 생략 -->

<style scoped>
/* 전체 페이지 */
.board-page {
  min-height: 100vh;
  background: #f8f9fa;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 페이지 헤더 */
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

.write-btn {
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

.write-btn:hover {
  transform: translateY(-2px);
}

/* 필터 섹션 */
.filter-section {
  background: white;
  padding: 2rem 0;
  border-bottom: 1px solid #eee;
}

.filter-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.filter-group select,
.search-group input {
  padding: 10px 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.filter-group select:focus,
.search-group input:focus {
  outline: none;
  border-color: #667eea;
}

.search-group {
  display: flex;
  gap: 0.5rem;
}

.search-group input {
  flex: 1;
}

.search-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}

/* 게시글 섹션 */
.posts-section {
  padding: 3rem 0;
}

/* 로딩 상태 */
.loading-state {
  text-align: center;
  padding: 4rem 2rem;
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

/* 빈 상태 */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.empty-state p {
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.btn-primary {
  background: #667eea;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 500;
  font-size: 16px;
  transition: transform 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
}

/* 게시글 목록 */
.posts-header {
  margin-bottom: 2rem;
}

.posts-header h3 {
  color: #333;
  font-size: 1.5rem;
}

.posts-grid {
  display: grid;
  gap: 1.5rem;
}

/* 게시글 카드 */
.post-card {
  background: white;
  border-radius: 15px;
  padding: 1.5rem;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.post-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.15);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
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
  color: #666;
  font-size: 12px;
}

.post-title {
  color: #333;
  margin-bottom: 0.8rem;
  font-size: 1.2rem;
  font-weight: 600;
  line-height: 1.4;
}

.post-preview {
  color: #666;
  margin-bottom: 1rem;
  line-height: 1.5;
  font-size: 14px;
}

/* 클라이밍장 정보 */
.gym-info {
  margin-bottom: 1rem;
}

.gym-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8f9ff;
  color: #667eea;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
}

.congestion-indicator {
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 11px;
  color: white;
}

.congestion-indicator.low { background: #4caf50; }
.congestion-indicator.medium { background: #ff9800; }
.congestion-indicator.high { background: #f44336; }

/* 모임 정보 */
.meeting-info {
  margin-bottom: 1rem;
  padding: 10px;
  background: #fff3e0;
  border-radius: 8px;
  border-left: 3px solid #ff9800;
}

.meeting-details {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.meeting-date, .meeting-people {
  font-size: 13px;
  color: #f57c00;
  font-weight: 500;
}

/* 작성자 정보 */
.post-author {
  margin-bottom: 1rem;
  padding-top: 0.8rem;
  border-top: 1px solid #f0f0f0;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.author-name {
  font-weight: 500;
  color: #333;
}

.author-level {
  background: #667eea;
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: bold;
}

.instructor-badge {
  background: #ff9800;
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: bold;
}

/* 게시글 통계 */
.post-stats {
  display: flex;
  gap: 1rem;
}

.stat-item {
  color: #666;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 0.2rem;
}

/* 페이지네이션 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 3rem;
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

/* 플로팅 작성 버튼 */
.floating-write-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
  transition: transform 0.2s;
  z-index: 100;
}

.floating-write-btn:hover {
  transform: scale(1.1);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .page-header h1 {
    font-size: 2rem;
  }
  
  .filter-controls {
    grid-template-columns: 1fr;
  }
  
  .search-group {
    flex-direction: column;
  }
  
  .posts-grid {
    gap: 1rem;
  }
  
  .post-card {
    padding: 1rem;
  }
  
  .post-title {
    font-size: 1.1rem;
  }
  
  .meeting-details {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .author-info {
    flex-wrap: wrap;
  }
  
  .pagination {
    flex-wrap: wrap;
    gap: 0.3rem;
  }
  
  .floating-write-btn {
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    font-size: 18px;
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
  
  .filter-section {
    padding: 1.5rem 0;
  }
  
  .posts-section {
    padding: 2rem 0;
  }
  
  .post-card {
    padding: 0.8rem;
  }
  
  .post-title {
    font-size: 1rem;
  }
  
  .post-preview {
    font-size: 13px;
  }
}
</style>