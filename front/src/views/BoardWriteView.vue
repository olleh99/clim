<template>
  <div class="write-page">
    <!-- 헤더 섹션 -->
    <section class="page-header">
      <div class="container">
        <h1>✍️ 새 글 작성</h1>
        <p>클라이밍장에 대한 정보를 공유해주세요!</p>
      </div>
    </section>

    <!-- 작성 폼 -->
    <section class="write-section">
      <div class="container">
        <div class="write-form">
          <form @submit.prevent="submitPost">
            <!-- 카테고리 선택 -->
            <div class="form-group">
              <label>글 카테고리 *</label>
              <div class="category-options">
                <label 
                  v-for="category in categories" 
                  :key="category.value"
                  class="category-option"
                  :class="{ selected: postData.category === category.value }"
                >
                  <input 
                    type="radio" 
                    :value="category.value" 
                    v-model="postData.category"
                    @change="onCategoryChange"
                  >
                  <div class="category-content">
                    <span class="category-icon">{{ category.icon }}</span>
                    <div class="category-info">
                      <span class="category-name">{{ category.name }}</span>
                      <span class="category-desc">{{ category.description }}</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <!-- 클라이밍장 선택 -->
            <div class="form-group">
              <label>
                관련 클라이밍장 
                <span v-if="postData.category === '모임'" class="required">*</span>
                <span v-else class="optional">(선택사항)</span>
              </label>
              <select v-model="postData.meetingGymId" :required="postData.category === '모임'">
                <option value="">클라이밍장을 선택해주세요</option>
                <option v-for="gym in gymsList" :key="gym.id" :value="gym.id">
                  {{ gym.name }} - {{ gym.address }}
                </option>
              </select>
              <p class="field-hint">
                글과 관련된 클라이밍장을 선택하면 다른 사용자들이 더 쉽게 찾을 수 있어요.
              </p>
            </div>

            <!-- 제목 입력 -->
            <div class="form-group">
              <label>제목 *</label>
              <input 
                v-model="postData.title" 
                type="text" 
                placeholder="제목을 입력해주세요"
                required
                maxlength="100"
              >
              <div class="char-count">{{ postData.title.length }}/100</div>
            </div>

            <!-- 내용 입력 -->
            <div class="form-group">
              <label>내용 *</label>
              <textarea 
                v-model="postData.content" 
                placeholder="내용을 입력해주세요"
                required
                rows="10"
                maxlength="2000"
              ></textarea>
              <div class="char-count">{{ postData.content.length }}/2000</div>
              <div class="content-tips">
                <p><strong>💡 작성 팁:</strong></p>
                <ul>
                  <li>클라이밍장의 현재 상황, 문제 난이도, 분위기 등을 자세히 적어주세요</li>
                  <li>다른 클라이머들에게 도움이 될 수 있는 정보를 공유해주세요</li>
                  <li>사진이 있다면 더욱 좋습니다!</li>
                </ul>
              </div>
            </div>

            <!-- 모임 상세 정보 (모임 카테고리 선택 시) -->
            <div v-if="postData.category === '모임'" class="meeting-details">
              <h3>🤝 모임 상세 정보</h3>
              
              <div class="form-row">
                <div class="form-group">
                  <label>모임 일시 *</label>
                  <input 
                    v-model="postData.meetingDate" 
                    type="datetime-local" 
                    required
                    :min="minDateTime"
                  >
                </div>
                
                <div class="form-group">
                  <label>모집 인원 *</label>
                  <input 
                    v-model.number="postData.maxPeople" 
                    type="number" 
                    min="2" 
                    max="20"
                    placeholder="2"
                    required
                  >
                  <span class="unit">명</span>
                </div>
              </div>

              <div class="meeting-tips">
                <p><strong>📝 모임 작성 가이드:</strong></p>
                <ul>
                  <li>구체적인 모임 시간과 장소를 명시해주세요</li>
                  <li>참가자 레벨이나 조건이 있다면 내용에 적어주세요</li>
                  <li>연락 방법(댓글, 카톡 등)을 안내해주세요</li>
                </ul>
              </div>
            </div>

            <!-- 이미지 업로드 (향후 구현) -->
            <div class="form-group">
              <label>이미지 첨부 <span class="optional">(선택사항)</span></label>
              <div class="image-upload-area">
                <div class="upload-placeholder">
                  <span class="upload-icon">📷</span>
                  <p>이미지 업로드 기능은 준비 중입니다</p>
                </div>
              </div>
            </div>

            <!-- 제출 버튼 -->
            <div class="form-actions">
              <button type="button" @click="goBack" class="btn-cancel">
                취소
              </button>
              <button type="submit" :disabled="isSubmitting || !isFormValid" class="btn-submit">
                {{ isSubmitting ? '작성 중...' : '게시글 작성하기' }}
              </button>
            </div>
          </form>
        </div>

        <!-- 미리보기 (선택적) -->
        <div class="preview-section" v-if="showPreview">
          <h3>📄 미리보기</h3>
          <div class="preview-card">
            <div class="preview-header">
              <span class="preview-category" :class="postData.category">
                {{ getCategoryEmoji(postData.category) }} {{ postData.category }}
              </span>
            </div>
            <h4 class="preview-title">{{ postData.title || '제목을 입력해주세요' }}</h4>
            <p class="preview-content">{{ postData.content || '내용을 입력해주세요' }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'BoardWriteView',
  data() {
    return {
      postData: {
        category: '',
        title: '',
        content: '',
        meetingGymId: '',
        meetingDate: '',
        maxPeople: 2
      },
      gymsList: [],
      isSubmitting: false,
      showPreview: false,
      categories: [
        {
          value: '후기',
          name: '클라이밍장 후기',
          icon: '⭐',
          description: '방문한 클라이밍장의 후기와 평가를 공유해주세요'
        },
        {
          value: '질문',
          name: '질문하기',
          icon: '❓',
          description: '클라이밍 관련 궁금한 점을 질문해주세요'
        },
        {
          value: '모임',
          name: '모임 만들기',
          icon: '👥',
          description: '함께 클라이밍할 사람들을 모집해주세요'
        }
      ]
    }
  },
  computed: {
    currentUser() {
      return this.$store.state.loginUser
    },
    isFormValid() {
      const basic = this.postData.title.trim() && 
                   this.postData.content.trim() && 
                   this.postData.category
      
      if (this.postData.category === '모임') {
        return basic && 
               this.postData.meetingGymId && 
               this.postData.meetingDate && 
               this.postData.maxPeople >= 2
      }
      
      return basic
    },
    minDateTime() {
      const now = new Date()
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
      return now.toISOString().slice(0, 16)
    }
  },
  methods: {
    // 클라이밍장 목록 로드
    async loadGyms() {
      try {
        const response = await this.$axios.get('/api/gyms')
        if (response.data.success) {
          this.gymsList = response.data.gyms
        }
      } catch (error) {
        console.error('클라이밍장 목록 로드 오류:', error)
      }
    },

    // 카테고리 변경 시
    onCategoryChange() {
      // 모임이 아닌 카테고리로 변경 시 모임 관련 데이터 초기화
      if (this.postData.category !== '모임') {
        this.postData.meetingDate = ''
        this.postData.maxPeople = 2
      }
    },

    // 게시글 제출
    async submitPost() {
      if (!this.isFormValid) {
        alert('모든 필수 항목을 입력해주세요.')
        return
      }

      this.isSubmitting = true

      try {
        const response = await this.$axios.post('/api/posts', {
          title: this.postData.title.trim(),
          content: this.postData.content.trim(),
          category: this.postData.category,
          meetingGymId: this.postData.meetingGymId || null,
          meetingDate: this.postData.meetingDate || null,
          maxPeople: this.postData.maxPeople || null
        })

        if (response.data.success) {
          alert('게시글이 성공적으로 작성되었습니다! 🎉')
          this.$router.push('/board')
        } else {
          alert(response.data.message || '게시글 작성에 실패했습니다.')
        }
      } catch (error) {
        console.error('게시글 작성 오류:', error)
        if (error.response) {
          alert(error.response.data.message || '서버 오류가 발생했습니다.')
        } else {
          alert('네트워크 오류가 발생했습니다.')
        }
      } finally {
        this.isSubmitting = false
      }
    },

    // 뒤로 가기
    goBack() {
      if (this.hasUnsavedChanges()) {
        if (confirm('작성 중인 내용이 있습니다. 정말 나가시겠습니까?')) {
          this.$router.go(-1)
        }
      } else {
        this.$router.go(-1)
      }
    },

    // 저장되지 않은 변경사항 확인
    hasUnsavedChanges() {
      return this.postData.title.trim() || 
             this.postData.content.trim() || 
             this.postData.category
    },

    // 카테고리 이모지
    getCategoryEmoji(category) {
      const emojis = {
        '후기': '⭐',
        '질문': '❓',
        '모임': '👥'
      }
      return emojis[category] || '📝'
    }
  },

  async created() {
    // 로그인 체크
    if (!this.currentUser) {
      alert('로그인이 필요합니다.')
      this.$router.push('/')
      return
    }

    // 클라이밍장 목록 로드
    await this.loadGyms()

    const gymId = this.$route.query.gymId
    if(gymId){
      this.postData.meetingGymId = parseInt(gymId)
    }
  },

  // 페이지 떠날 때 확인
  beforeRouteLeave(to, from, next) {
    if (this.hasUnsavedChanges()) {
      if (confirm('작성 중인 내용이 있습니다. 정말 나가시겠습니까?')) {
        next()
      } else {
        next(false)
      }
    } else {
      next()
    }
  }
}
</script>

<style scoped>
/* 전체 페이지 */
.write-page {
  min-height: 100vh;
  background: #f8f9fa;
}

.container {
  max-width: 800px;
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
}

/* 작성 섹션 */
.write-section {
  padding: 3rem 0;
}

.write-form {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

/* 폼 그룹 */
.form-group {
  margin-bottom: 2rem;
  position: relative;
}

.form-group label {
  display: block;
  margin-bottom: 0.8rem;
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.required {
  color: #f44336;
  font-weight: bold;
}

.optional {
  color: #666;
  font-weight: normal;
  font-size: 14px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  box-sizing: border-box;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-group textarea {
  resize: vertical;
  min-height: 200px;
  line-height: 1.6;
}

.char-count {
  position: absolute;
  right: 12px;
  bottom: 12px;
  font-size: 12px;
  color: #666;
  background: white;
  padding: 2px;
}

.field-hint {
  margin-top: 0.5rem;
  font-size: 13px;
  color: #666;
  line-height: 1.4;
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

/* 카테고리 옵션 */
.category-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.category-option {
  display: flex;
  align-items: center;
  padding: 1.2rem;
  border: 2px solid #e1e5e9;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.category-option:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.category-option.selected {
  border-color: #667eea;
  background: linear-gradient(135deg, #f8f9ff 0%, #e8edff 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.category-option input[type="radio"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.category-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
}

.category-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.category-info {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.category-name {
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.category-option.selected .category-name {
  color: #667eea;
}

.category-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.category-option.selected .category-desc {
  color: #5a67d8;
}

/* 폼 행 */
.form-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
}

/* 모임 상세 정보 */
.meeting-details {
  background: #fff3e0;
  padding: 1.5rem;
  border-radius: 12px;
  border-left: 4px solid #ff9800;
  margin-bottom: 2rem;
}

.meeting-details h3 {
  color: #f57c00;
  margin-bottom: 1.5rem;
  font-size: 1.2rem;
}

.meeting-tips {
  margin-top: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #ffcc02;
}

.meeting-tips p {
  margin-bottom: 0.5rem;
  color: #f57c00;
  font-weight: 600;
}

.meeting-tips ul {
  margin: 0;
  padding-left: 1.2rem;
  color: #333;
}

.meeting-tips li {
  font-size: 13px;
  line-height: 1.5;
  margin-bottom: 0.3rem;
}

/* 내용 작성 팁 */
.content-tips {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9ff;
  border-radius: 8px;
  border: 1px solid #e3f2fd;
}

.content-tips p {
  margin-bottom: 0.5rem;
  color: #667eea;
  font-weight: 600;
}

.content-tips ul {
  margin: 0;
  padding-left: 1.2rem;
  color: #333;
}

.content-tips li {
  font-size: 13px;
  line-height: 1.5;
  margin-bottom: 0.3rem;
}

/* 이미지 업로드 */
.image-upload-area {
  border: 2px dashed #e1e5e9;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  background: #fafafa;
}

.upload-placeholder {
  color: #666;
}

.upload-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 1rem;
}

.upload-placeholder p {
  margin: 0;
  font-size: 14px;
}

/* 폼 액션 */
.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #eee;
}

.btn-cancel, .btn-submit {
  padding: 12px 24px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-submit {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* 미리보기 섹션 */
.preview-section {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.preview-section h3 {
  color: #333;
  margin-bottom: 1.5rem;
  font-size: 1.3rem;
}

.preview-card {
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 1.5rem;
  background: #fafafa;
}

.preview-header {
  margin-bottom: 1rem;
}

.preview-category {
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.preview-category.후기 { background: #4caf50; }
.preview-category.질문 { background: #2196f3; }
.preview-category.모임 { background: #ff9800; }

.preview-title {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.2rem;
  font-weight: 600;
}

.preview-content {
  color: #666;
  line-height: 1.6;
  white-space: pre-wrap;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .container {
    padding: 0 15px;
  }
  
  .page-header h1 {
    font-size: 2rem;
  }
  
  .write-form {
    padding: 1.5rem;
  }
  
  .category-options {
    gap: 0.8rem;
  }
  
  .category-option {
    padding: 1rem;
  }
  
  .category-content {
    gap: 0.8rem;
  }
  
  .category-icon {
    font-size: 1.5rem;
  }
  
  .category-name {
    font-size: 14px;
  }
  
  .category-desc {
    font-size: 12px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .meeting-details {
    padding: 1rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn-cancel, .btn-submit {
    width: 100%;
  }
  
  .content-tips, .meeting-tips {
    padding: 0.8rem;
  }
  
  .upload-icon {
    font-size: 2rem;
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 2rem 0;
  }
  
  .page-header h1 {
    font-size: 1.8rem;
  }
  
  .write-section {
    padding: 2rem 0;
  }
  
  .write-form {
    padding: 1rem;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  .category-option {
    padding: 0.8rem;
  }
  
  .meeting-details {
    padding: 0.8rem;
  }
  
  .meeting-details h3 {
    font-size: 1.1rem;
  }
  
  .form-group textarea {
    min-height: 150px;
  }
}
</style>