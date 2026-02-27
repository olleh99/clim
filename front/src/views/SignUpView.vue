<template>
  <div class="container">
    <div class="signup-form">
      <h2>🧗‍♀️ 붙잡아줘요 회원가입</h2>
      
      <div class="form-group">
        <label>사용자 ID</label>
        <input v-model="user.userId" type="text" placeholder="아이디를 입력해주세요">
      </div>
      
      <div class="form-group">
        <label>닉네임</label>
        <input v-model="user.nickname" type="text" placeholder="닉네임을 입력해주세요">
      </div>
      
      <div class="form-group">
        <label>비밀번호</label>
        <input v-model="user.password" type="password" placeholder="비밀번호를 입력해주세요">
      </div>
      
      <div class="form-group">
        <label>비밀번호 확인</label>
        <input v-model="user.password2" type="password" placeholder="비밀번호를 다시 입력해주세요">
      </div>
      
      <div class="form-group">
        <label>볼더링 레벨 (선택)</label>
        <select v-model="user.level">
          <option value="">레벨을 선택해주세요</option>
          <option value="V0">V0 - 초급자</option>
          <option value="V1">V1</option>
          <option value="V2">V2</option>
          <option value="V3">V3</option>
          <option value="V4">V4</option>
          <option value="V5">V5</option>
          <option value="V6">V6</option>
          <option value="V7">V7</option>
          <option value="V8+">V8+ - 고급자</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>즐겨하는 클라이밍 기술 (복수 선택 가능)</label>
        <div class="technique-checkboxes">
          <label class="technique-label" v-for="technique in techniques" :key="technique.value">
            <input 
              type="checkbox" 
              :value="technique.value" 
              v-model="user.techniques"
            >
            <span class="technique-name">{{ technique.name }}</span>
            <span class="technique-desc">{{ technique.description }}</span>
          </label>
        </div>
      </div>
      
      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" v-model="user.hasInstructorLicense">
          클라이밍 지도자격증 보유
        </label>
      </div>
      
      <div class="text-center">
        <button @click="signup()" class="signup-btn">회원가입</button>
      </div>
      
      <p class="login-link">
        이미 계정이 있으신가요? <a href="/login">로그인하기</a>
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SignUpView',
  data() {
    return {
      user: {
        userId: "",
        nickname: "",
        password: "",
        password2: "",
        level: "",
        techniques: [],
        hasInstructorLicense: false
      },
      techniques: [
        {
          value: "static",
          name: "스태틱 (Static)",
          description: "정적인 움직임으로 균형을 유지하며 오르는 기술"
        },
        {
          value: "dynamic",
          name: "다이나믹 (Dynamic)",
          description: "역동적인 움직임으로 추진력을 이용하는 기술"
        },
        {
          value: "lunge",
          name: "런지 (Lunge)",
          description: "몸을 던져서 먼 홀드를 잡는 기술"
        },
        {
          value: "campus",
          name: "캠퍼싱 (Campusing)",
          description: "발을 사용하지 않고 팔만으로 오르는 기술"
        },
        {
          value: "counter_balance",
          name: "코디 카운터밸런스 (Body Counter Balance)",
          description: "몸의 균형을 이용해 반대 방향으로 힘을 가하는 기술"
        },
        {
          value: "dead_point",
          name: "데드포인트 (Dead Point)",
          description: "점프의 최고점에서 홀드를 잡는 타이밍 기술"
        }
      ]
    }
  },
  methods: {
    //유효성 검사
    async signup() {
      if (this.user.userId == "") {
        alert("아이디를 입력해주세요")
        return
      }
      if (this.user.nickname == "") {
        alert("닉네임을 입력해주세요")
        return
      }
      if (this.user.password.length < 6) {
        alert("비밀번호는 6자리 이상 입력해주세요")
        return
      }
      if (this.user.password != this.user.password2) {
        alert("비밀번호를 확인해주세요")
        this.user.password2 = ""
        return
      }
      
      // 유효성 검사 완료시
      try {
        console.log("회원가입 데이터:", this.user)
        var response = await this.$axios.post("/api/user/signup", this.user)
        if (response.data.success) {
          alert("🎉 회원가입이 완료되었습니다!")
          this.$router.push("/")
        } else {
          alert(response.data.message)
        }
      } catch (error) {
        alert("회원가입 중 오류가 발생했습니다.")
      }
    }
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.signup-form {
  background: white;
  padding: 40px;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
}

.signup-form h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
}

.technique-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.technique-label {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border: 2px solid #f0f0f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.technique-label:hover {
  border-color: #667eea;
  background-color: #f8f9ff;
}

.technique-label input[type="checkbox"] {
  width: auto;
  margin: 0;
  margin-top: 2px;
}

.technique-label input[type="checkbox"]:checked + .technique-name {
  color: #667eea;
  font-weight: 600;
}

.technique-name {
  font-weight: 500;
  color: #333;
  min-width: 140px;
}

.technique-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
  flex: 1;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: normal;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.text-center {
  text-align: center;
  margin: 30px 0 20px 0;
}

.signup-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 12px 40px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;
}

.signup-btn:hover {
  transform: translateY(-2px);
}

.login-link {
  text-align: center;
  color: #666;
  margin: 0;
}

.login-link a {
  color: #667eea;
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .signup-form {
    padding: 30px 20px;
    max-width: 400px;
  }
  
  .technique-label {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
  
  .technique-name {
    min-width: auto;
  }
}
</style>