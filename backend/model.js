const { Sequelize, Op } = require("sequelize");

/**
 * 🧗‍♀️ "붙잡아줘요" 클라이밍 커뮤니티 앱 - 기본 기능
 *
 * 📋 핵심 기능:
 * 1. 사용자 관리 (레벨 기반)
 * 2. 클라이밍장 정보 및 혼잡도
 * 3. 커뮤니티 게시판 (후기/질문/모임)
 */

function define(connection) {
  // ==============================================
  // 👤 USER 모델 - 클라이머 정보 관리
  // ==============================================
  global.User = connection.define("User", {
    // 🔑 기본 정보
    userId: {
      type: Sequelize.STRING(36),
      primaryKey: true,
      allowNull: false,
      comment: "사용자 고유 ID (UUID 형태)"
    },
    password: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    nickname: {
      type: Sequelize.STRING(30),
      allowNull: false,
      comment: "커뮤니티 활동용 닉네임"
    },
    // 🎯 클라이밍 실력 정보
    level: {
      type: Sequelize.ENUM("V0", "V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8"),
      allowNull: true,
      comment: "볼더링 레벨 - 암장검색용"
    },
    // 클라이밍 즐겨하는 기술
    techniques: {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
      comment: "즐겨하는 기술들 배열 - 선택사항"
    },
    // 🏅 자격증 정보
    hasInstructorLicense: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      comment: "지도자격증 보유 여부 - 프로필 뱃지용"
    }
  }, {
    timestamps: true,
    comment: "클라이머 사용자 정보"
  });

  // ==============================================
  // 🏢 GYM 모델 - 클라이밍장 정보 (위치 정보 제거)
  // ==============================================
  const Gym = connection.define("Gym", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    // 🏢 기본 정보
    name: {
      type: Sequelize.STRING(100),
      allowNull: false,
      comment: "암장 이름"
    },
    address: {
      type: Sequelize.STRING(200),
      allowNull: false,
      comment: "암장 주소"
    },
    district: {
      type: Sequelize.STRING(20),
      allowNull: false,
      comment: "지역구 (검색 필터용)"
    },
    // 💰 요금 정보
    dayPrice: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: "일일 이용권 가격 (필수)"
    },
    monthPrice: {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: "월 이용권 가격"
    },
    // 📱 연락처 및 운영 정보
    phone: {
      type: Sequelize.STRING(20),
      allowNull: true,
      comment: "암장 전화번호"
    },
    website: {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: "암장 웹사이트 URL"
    },
    // 🕐 운영시간 정보
    openTime: {
      type: Sequelize.STRING(10),
      allowNull: true,
      comment: "운영 시작 시간 (예: 09:00)"
    },
    closeTime: {
      type: Sequelize.STRING(10),
      allowNull: true,
      comment: "운영 종료 시간 (예: 23:00)"
    },
    restDay: {
      type: Sequelize.STRING(20),
      allowNull: true,
      comment: "휴무일 (예: 매주 월요일)"
    },
    // 🎯 클라이밍장 특성
    techniques: {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
      comment: "이 암장에서 연습 가능한 주요 기술들"
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: "암장 소개 및 특징"
    },
    // 🖼 이미지 정보
    imageUrl: {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: "암장 대표 이미지 URL"
    },
    // 📊 실시간 혼잡도 정보
    currentCongestion: {
      type: Sequelize.ENUM("여유", "보통", "혼잡", "매우혼잡"),
      allowNull: true,
      comment: "현재 혼잡도 상태"
    },
    avgCongestion: {
      type: Sequelize.DECIMAL(3, 2),
      defaultValue: 0.5,
      comment: "평균 혼잡도 0.0(여유) ~ 1.0(매우혼잡)"
    },
    lastCongestionUpdate: {
      type: Sequelize.DATE,
      allowNull: true,
      comment: "혼잡도 마지막 업데이트 시간"
    },
    // 📈 통계 정보
    rating: {
      type: Sequelize.DECIMAL(2, 1),
      defaultValue: 0.0,
      comment: "사용자 평점 (0.0 ~ 5.0)"
    },
    reviewCount: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      comment: "리뷰 개수"
    },
    viewCount: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      comment: "조회 수"
    },
    // 🔧 관리 정보
    addedBy: {
      type: Sequelize.STRING(36),
      allowNull: true,
      comment: "누가 추가했는지 (userId)"
    },
    verified: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      comment: "관리자 검증 여부"
    }
  }, {
    timestamps: true,
    comment: "클라이밍장 정보"
  });

// ==============================================
// 📊 CONGESTION 모델 - 실시간 혼잡도 제보 (수정)
// ==============================================
const Congestion = connection.define("Congestion", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  // 🔗 외래키들
  gymId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    comment: "어떤 암장의 혼잡도인지",
    references: {
      model: 'Gyms', // 실제 테이블명
      key: 'id'
    }
  },
  userId: {
    type: Sequelize.STRING(36),
    allowNull: false,
    comment: "누가 제보했는지",
    references: {
      model: 'Users', // 실제 테이블명  
      key: 'userId'
    }
  },
    // 📊 혼잡도 정보
    level: {
      type: Sequelize.ENUM("여유", "보통", "혼잡", "매우혼잡"),
      allowNull: false,
      comment: "사용자가 선택한 혼잡도 레벨"
    },
    peopleCount: {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: "현재 대략적인 인원 수 (선택사항)"
    },
    // ⏰ 제보 시간 정보
    reportedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
      allowNull: false, // null 허용하지 않음
      comment: "언제 제보했는지"
    },
    // 🔍 신뢰도 점수
    reliability: {
      type: Sequelize.DECIMAL(3, 2),
      defaultValue: 1.0,
      comment: "제보 신뢰도 점수 (0.0 ~ 1.0)"
    }
  }, {
    timestamps: true,
    tableName: 'Congestions', // 명시적 테이블명
    comment: "사용자 참여형 실시간 혼잡도 정보"
  });

  // ==============================================
  // 📝 POST 모델 - 커뮤니티 게시글
  // ==============================================
  const Post = connection.define("Post", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    // 📝 게시글 기본 정보
    title: {
      type: Sequelize.STRING(100),
      allowNull: false,
      comment: "게시글 제목"
    },
    content: {
      type: Sequelize.TEXT,
      allowNull: false,
      comment: "게시글 내용"
    },
    // 🏷 카테고리 분류
    category: {
      type: Sequelize.ENUM("후기", "질문", "모임"),
      allowNull: false,
      comment: "게시글 종류 - 암장후기/궁금한점/같이가실분"
    },
    // 👤 작성자
    userId: {
      type: Sequelize.STRING(36),
      allowNull: false,
      comment: "게시글 작성자"
    },
    // 📊 게시글 통계
    likes: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      comment: "좋아요 수"
    },
    views: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      comment: "조회 수"
    },
    // 🤝 모임 관련 정보 (category가 '모임'일 때만 사용)
    meetingDate: {
      type: Sequelize.DATE,
      allowNull: true,
      comment: "모임 예정 일시 (모임 게시글용)"
    },
    meetingGymId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: "모임 장소 암장 (모임 게시글용)"
    },
    maxPeople: {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: "모집 인원 (모임 게시글용)"
    },
    currentPeople: {
      type: Sequelize.INTEGER,
      defaultValue: 1,
      comment: "현재 참가 인원 (작성자 포함)"
    },
    meetingStatus: {
      type: Sequelize.ENUM("모집중", "모집완료", "진행중", "완료", "취소"),
      defaultValue: "모집중",
      comment: "모임 상태"
    },
    // 🖼 첨부 이미지
    imageUrl: {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: "첨부 이미지 URL"
    }
  }, {
    timestamps: true,
    comment: "커뮤니티 게시글"
  });

  // ==============================================
  // 💬 COMMENT 모델 - 댓글 시스템
  // ==============================================
  const Comment = connection.define("Comment", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    content: {
      type: Sequelize.TEXT,
      allowNull: false,
      comment: "댓글 내용"
    },
    postId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: "어느 게시글의 댓글인지"
    },
    userId: {
      type: Sequelize.STRING(36),
      allowNull: false,
      comment: "댓글 작성자"
    },
    parentId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: "대댓글인 경우 부모 댓글 ID"
    }
  }, {
    timestamps: true,
    comment: "게시글 댓글"
  });

  // ==============================================
  // 🤝 MEETING_PARTICIPANT 모델 - 모임 참가자 관리
  // ==============================================
  const MeetingParticipant = connection.define("MeetingParticipant", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    postId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: "모임 게시글 ID"
    },
    userId: {
      type: Sequelize.STRING(36),
      allowNull: false,
      comment: "참가자 사용자 ID"
    },
    status: {
      type: Sequelize.ENUM("신청", "승인", "거절", "취소"),
      defaultValue: "신청",
      comment: "참가 상태"
    },
    message: {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: "참가 신청 메시지"
    },
    joinedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
      comment: "참가 신청 시간"
    }
  }, {
    timestamps: true,
    comment: "모임 참가자 관리"
  });

  // ==============================================
  // ⭐ GYM_REVIEW 모델 - 클라이밍장 리뷰
  // ==============================================
  const GymReview = connection.define("GymReview", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    gymId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: "리뷰 대상 클라이밍장"
    },
    userId: {
      type: Sequelize.STRING(36),
      allowNull: false,
      comment: "리뷰 작성자"
    },
    rating: {
      type: Sequelize.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 },
      comment: "평점 (1~5점)"
    },
    content: {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: "리뷰 내용"
    },
    visitDate: {
      type: Sequelize.DATE,
      allowNull: true,
      comment: "방문 날짜"
    },
    difficulty: {
      type: Sequelize.ENUM("쉬움", "보통", "어려움"),
      allowNull: true,
      comment: "문제 난이도 평가"
    },
    crowdLevel: {
      type: Sequelize.ENUM("여유", "보통", "혼잡"),
      allowNull: true,
      comment: "방문 당시 혼잡도"
    }
  }, {
    timestamps: true,
    comment: "클라이밍장 리뷰"
  });

  // ==============================================
  // 🔖 BOOKMARK 모델 - 즐겨찾기
  // ==============================================
  const Bookmark = connection.define("Bookmark", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: Sequelize.STRING(36),
      allowNull: false,
      comment: "즐겨찾기한 사용자"
    },
    gymId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: "즐겨찾기한 클라이밍장"
    }
  }, {
    timestamps: true,
    comment: "사용자 즐겨찾기 클라이밍장"
  });

  // ==============================================
  // 🔗 관계 설정 (Association)
  // ==============================================
  // 👤 사용자 ↔ 게시글 (1:N)
  User.hasMany(Post, {
    foreignKey: 'userId',
    as: 'posts',
    onDelete: 'CASCADE'
  });
  Post.belongsTo(User, {
    foreignKey: 'userId',
    as: 'author'
  });

  // 👤 사용자 ↔ 댓글 (1:N)
  User.hasMany(Comment, {
    foreignKey: 'userId',
    as: 'comments',
    onDelete: 'CASCADE'
  });
  Comment.belongsTo(User, {
    foreignKey: 'userId',
    as: 'author'
  });

  // 📝 게시글 ↔ 댓글 (1:N)
  Post.hasMany(Comment, {
    foreignKey: 'postId',
    as: 'comments',
    onDelete: 'CASCADE'
  });
  Comment.belongsTo(Post, {
    foreignKey: 'postId',
    as: 'post'
  });

  // 💬 댓글 ↔ 대댓글 (자기참조)
  Comment.hasMany(Comment, {
    foreignKey: 'parentId',
    as: 'replies'
  });
  Comment.belongsTo(Comment, {
    foreignKey: 'parentId',
    as: 'parent'
  });

  // 🏢 암장 ↔ 혼잡도 제보 (1:N)
  Gym.hasMany(Congestion, {
    foreignKey: 'gymId',
    as: 'congestionReports',
    onDelete: 'CASCADE'
  });
  Congestion.belongsTo(Gym, {
    foreignKey: 'gymId',
    as: 'gym'
  });

  // 👤 사용자 ↔ 혼잡도 제보 (1:N)
  User.hasMany(Congestion, {
    foreignKey: 'userId',
    as: 'congestionReports',
    onDelete: 'CASCADE'
  });
  Congestion.belongsTo(User, {
    foreignKey: 'userId',
    as: 'reporter'
  });

  // 📝 모임 게시글 ↔ 암장 (N:1)
  Post.belongsTo(Gym, {
    foreignKey: 'meetingGymId',
    as: 'meetingGym'
  });
  Gym.hasMany(Post, {
    foreignKey: 'meetingGymId',
    as: 'meetings'
  });

  // 🤝 모임 참가자 관계
  Post.hasMany(MeetingParticipant, {
    foreignKey: 'postId',
    as: 'participants',
    onDelete: 'CASCADE'
  });
  MeetingParticipant.belongsTo(Post, {
    foreignKey: 'postId',
    as: 'meeting'
  });

  User.hasMany(MeetingParticipant, {
    foreignKey: 'userId',
    as: 'participations',
    onDelete: 'CASCADE'
  });
  MeetingParticipant.belongsTo(User, {
    foreignKey: 'userId',
    as: 'participant'
  });

  // ⭐ 클라이밍장 리뷰 관계
  Gym.hasMany(GymReview, {
    foreignKey: 'gymId',
    as: 'reviews',
    onDelete: 'CASCADE'
  });
  GymReview.belongsTo(Gym, {
    foreignKey: 'gymId',
    as: 'gym'
  });

  User.hasMany(GymReview, {
    foreignKey: 'userId',
    as: 'reviews',
    onDelete: 'CASCADE'
  });
  GymReview.belongsTo(User, {
    foreignKey: 'userId',
    as: 'reviewer'
  });

  // 🔖 즐겨찾기 관계
  User.hasMany(Bookmark, {
    foreignKey: 'userId',
    as: 'bookmarks',
    onDelete: 'CASCADE'
  });
  Bookmark.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });

  Gym.hasMany(Bookmark, {
    foreignKey: 'gymId',
    as: 'bookmarks',
    onDelete: 'CASCADE'
  });
  Bookmark.belongsTo(Gym, {
    foreignKey: 'gymId',
    as: 'gym'
  });

  // ==============================================
  // 🔧 개발용 헬퍼 함수들
  // ==============================================
  
  // 모임 게시글 유효성 검증
  Post.addHook('beforeValidate', (post) => {
    if (post.category === '모임') {
      if (!post.meetingDate || !post.meetingGymId || !post.maxPeople) {
        throw new Error('모임 게시글은 일시, 장소, 인원이 필수입니다!');
      }
    }
  });

  // ==============================================
  // 🌍 전역 변수로 모델 공유
  // ==============================================
  global.User = User;
  global.Gym = Gym;
  global.Congestion = Congestion;
  global.Post = Post;
  global.Comment = Comment;
  global.MeetingParticipant = MeetingParticipant;
  global.GymReview = GymReview;
  global.Bookmark = Bookmark;
  global.Op = Op;

  // ==============================================
  // 💾 데이터베이스 동기화
  // ==============================================
  connection.sync({
    alter: true // 스키마 변경시 자동 수정 (개발 환경용)
  })
  .then(() => {
    console.log("✅ 기본 기능 데이터베이스가 준비되었습니다!");
    // 🔥 샘플 데이터 추가 (개발용)
    initializeSampleData();
  })
  .catch(err => {
    console.error("❌ 데이터베이스 동기화 실패:", err);
  });

  // ==============================================
  // 🔥 샘플 데이터 추가 함수 (위치 정보 제거)
  // ==============================================
  async function initializeSampleData() {
    try {
      // 기존 데이터 확인
      const existingGyms = await Gym.count();
      if (existingGyms > 0) {
        console.log('📍 기존 클라이밍장 데이터가 존재합니다.');
        return;
      }

      console.log('🏗 기본 클라이밍장 샘플 데이터를 추가합니다...');

      // 기본 클라이밍장 데이터 (위치 정보 제거)
      const sampleGyms = [
        {
          name: "더클라임 강남점",
          address: "서울 강남구 역삼동 735-3 B1",
          district: "강남구",
          dayPrice: 13000,
          monthPrice: 110000,
          phone: "02-538-8275",
          techniques: ["static", "dynamic", "lunge"],
          description: "강남 최대 규모의 볼더링 전문 클라이밍장. 초보자부터 고수까지 모든 레벨의 문제가 준비되어 있습니다.",
          openTime: "06:00",
          closeTime: "24:00",
          restDay: "연중무휴",
          addedBy: "system"
        },
        {
          name: "더클라임 신촌점",
          address: "서울 마포구 대흥동 34-76 지하1층",
          district: "마포구",
          dayPrice: 12000,
          monthPrice: 100000,
          phone: "02-365-8275",
          techniques: ["dynamic", "campus", "dead_point"],
          description: "신촌 대학가에 위치한 접근성 좋은 클라이밍장. 학생 할인 혜택이 있습니다.",
          openTime: "10:00",
          closeTime: "23:00",
          restDay: "매월 첫째 월요일",
          addedBy: "system"
        },
        {
          name: "피커스 클라이밍 홍대점",
          address: "서울 마포구 서교동 395-53 지하2층",
          district: "마포구",
          dayPrice: 14000,
          monthPrice: 120000,
          phone: "02-337-7285",
          techniques: ["lunge", "counter_balance", "static"],
          description: "홍대 클럽가 근처 위치. 야간 운영으로 직장인들에게 인기가 많습니다.",
          openTime: "12:00",
          closeTime: "02:00",
          restDay: "매월 둘째 화요일",
          addedBy: "system"
        },
        {
          name: "볼더리스트 성수점",
          address: "서울 성동구 성수동1가 656-340 1층",
          district: "성동구",
          dayPrice: 15000,
          monthPrice: 130000,
          phone: "02-462-8000",
          techniques: ["campus", "dynamic", "lunge"],
          description: "성수동 카페거리에 위치한 감성적인 인테리어의 볼더링장. SNS 인증샷 명소입니다.",
          openTime: "07:00",
          closeTime: "23:00",
          restDay: "매주 일요일",
          addedBy: "system"
        },
        {
          name: "클라임앤조이 종로점",
          address: "서울 종로구 종로1가 24 르메이에르 종로타운 B2",
          district: "종로구",
          dayPrice: 11000,
          monthPrice: 95000,
          phone: "02-734-5252",
          techniques: ["static", "counter_balance"],
          description: "종로 지하철역 접근성 최고! 직장인들의 점심시간 운동장소로 인기가 높습니다.",
          openTime: "06:30",
          closeTime: "22:30",
          restDay: "매월 셋째 월요일",
          addedBy: "system"
        }
      ];

      // 데이터베이스에 삽입
      for (const gymData of sampleGyms) {
        await Gym.create(gymData);
      }

      console.log(`✅ ${sampleGyms.length}개의 클라이밍장 데이터가 추가되었습니다!`);
      console.log('🗺 기본 검색 기능이 준비되었습니다!');
    } catch (error) {
      console.error('❌ 샘플 데이터 추가 실패:', error);
    }
  }

  return { User, Gym, Congestion, Post, Comment, MeetingParticipant, GymReview, Bookmark };
}

module.exports = define;