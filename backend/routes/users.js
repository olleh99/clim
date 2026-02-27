const express = require('express');
var router = express.Router();

/**
 * 🧗‍♀️ 붙잡아줘요 - 회원가입 API
 * POST /api/user/signup
 */
router.post('/signup', async (req, res) => {
  try {
    const { userId, nickname, password, level, techniques, hasInstructorLicense } = req.body;
    
    // 🔍 입력값 유효성 검사
    if (!userId || !nickname || !password) {
      return res.json({
        success: false,
        message: "필수 정보를 모두 입력해주세요."
      });
    }
    
    if (password.length < 6) {
      return res.json({
        success: false,
        message: "비밀번호는 6자리 이상 입력해주세요."
      });
    }
    
    // 🔍 중복 검사 - 아이디
    const existingUserId = await global.User.findOne({
      where: { userId: userId }
    });
    
    if (existingUserId) {
      return res.json({
        success: false,
        message: "이미 사용중인 아이디입니다."
      });
    }
    
    // 🔍 중복 검사 - 닉네임
    const existingNickname = await global.User.findOne({
      where: { nickname: nickname }
    });
    
    if (existingNickname) {
      return res.json({
        success: false,
        message: "이미 사용중인 닉네임입니다."
      });
    }
    
    // 🎯 레벨 유효성 검사 (선택사항이므로 빈 값이면 null로 처리)
    const validLevels = ["V0", "V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8+"];
    const userLevel = level && validLevels.includes(level) ? level : null;
    
    // 🎯 기술 유효성 검사 (선택사항)
    const validTechniques = ["static", "dynamic", "lunge", "campus", "counter_balance", "dead_point"];
    let userTechniques = [];
    
    if (techniques  && Array.isArray(techniques )) {
      // 유효한 기술만 필터링
      userTechniques = techniques.filter(tech => validTechniques.includes(tech));
    }
    
    // 💾 사용자 생성
    const newUser = await global.User.create({
      userId: userId,
      password: password,
      nickname: nickname,
      level: userLevel,
      techniques: userTechniques, // 기술 배열 추가
      hasInstructorLicense: hasInstructorLicense || false
    });
    
    // ✅ 성공 응답 (비밀번호는 제외하고 반환)
    res.json({
      success: true,
      message: "회원가입이 완료되었습니다!",
      user: {
        userId: newUser.userId,
        nickname: newUser.nickname,
        level: newUser.level,
        techniques: newUser.techniques, // 응답에 기술 정보 포함
        hasInstructorLicense: newUser.hasInstructorLicense,
        createdAt: newUser.createdAt
      }
    });
    
  } catch (error) {
    console.error('회원가입 오류:', error);
    
    // Sequelize 유효성 검사 오류 처리
    if (error.name === 'SequelizeValidationError') {
      return res.json({
        success: false,
        message: "입력값이 올바르지 않습니다."
      });
    }
    
    // 데이터베이스 제약조건 오류 처리
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.json({
        success: false,
        message: "이미 사용중인 아이디 또는 닉네임입니다."
      });
    }
    
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
    });
  }
});

/**
 * 🔍 아이디 중복 확인 API (추가 기능)
 * GET /api/user/check-userid/:userId
 */
router.get('/check-userid/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const existingUser = await global.User.findOne({
      where: { userId: userId }
    });
    
    res.json({
      success: true,
      available: !existingUser,
      message: existingUser ? "이미 사용중인 아이디입니다." : "사용 가능한 아이디입니다."
    });
    
  } catch (error) {
    console.error('아이디 중복 확인 오류:', error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다."
    });
  }
});

/**
 * 🔍 닉네임 중복 확인 API (추가 기능)
 * GET /api/user/check-nickname/:nickname
 */
router.get('/check-nickname/:nickname', async (req, res) => {
  try {
    const { nickname } = req.params;
    
    const existingUser = await global.User.findOne({
      where: { nickname: nickname }
    });
    
    res.json({
      success: true,
      available: !existingUser,
      message: existingUser ? "이미 사용중인 닉네임입니다." : "사용 가능한 닉네임입니다."
    });
    
  } catch (error) {
    console.error('닉네임 중복 확인 오류:', error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다."
    });
  }
});

/**
 * 🔐 로그인 API
 * POST /api/user/login
 */
router.post("/login", async function(req, res) {
  try {
    const { userId, password } = req.body;  // 구조분해할당으로 명확하게
    
    // 🔍 입력값 유효성 검사
    if (!userId || !password) {
      return res.json({
        success: false,
        message: "아이디와 비밀번호를 모두 입력해주세요."
      });
    }

    // 🔍 데이터베이스에서 사용자 조회
    var alreadyUser = await global.User.findOne({  // global.User 사용
      where: {
        userId: userId,      // userId 필드 사용
        password: password   // 실제로는 bcrypt 비교 권장
      }
    });

    if (!alreadyUser) {   
      // ❌ 로그인 실패
      return res.json({
        success: false,
        message: "아이디 또는 비밀번호가 틀렸습니다."
      });
    }

    // 세션에 사용자 정보 저장
    req.session.user = {
      userId: alreadyUser.userId,
      nickname: alreadyUser.nickname
    };

    // 성공 응답 (비밀번호 제외)
    res.json({
      success: true,
      message: "로그인 성공",
      user: {
        userId: alreadyUser.userId,
        nickname: alreadyUser.nickname,
        level: alreadyUser.level,
        techniques: alreadyUser.techniques,
        hasInstructorLicense: alreadyUser.hasInstructorLicense,
        createdAt: alreadyUser.createdAt
      }
    });

  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다."
    });
  }
});

/**
 * 🔍 로그인된 사용자 정보 조회 API
 * POST /api/user/info
 */
router.post("/info", async function(req, res) {
  try {
    var sessionUser = req.session.user;

    if (!sessionUser) {
      return res.json({
        isLogin: false,
        user: null,
        message: "로그인이 필요합니다."
      });
    }

    // 세션에 저장된 사용자정보를 사용자 테이블에서 다시 한번 조회
    // -> 로그인된 사용자가 탈퇴했거나 변경된 사용자정보를 갱신하기 위해
    var user = await global.User.findOne({  // global.User 사용
      where: {
        userId: sessionUser.userId  // id → userId로 수정
      },
      // 비밀번호 제외하고 조회
      attributes: ['userId', 'nickname', 'level', 'techniques', 'hasInstructorLicense', 'createdAt', 'updatedAt']
    });

    // 사용자가 탈퇴했거나 사용자 테이블에 정보가 없는 경우
    if (!user) {
      // 세션도 함께 삭제
      req.session.destroy();
      return res.json({
        isLogin: false,
        user: null,
        message: "사용자 정보를 찾을 수 없습니다."
      });
    }

    res.json({
      isLogin: true,
      user: user,
      message: "로그인 상태입니다."
    });

  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    res.status(500).json({
      isLogin: false,
      user: null,
      message: "서버 오류가 발생했습니다."
    });
  }
});

/**
 * 📊 마이페이지 데이터 조회 API
 * GET /api/user/mypage
 */
router.get('/mypage', async (req, res) => {
  try {
    // 로그인 체크
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: '로그인이 필요합니다.'
      });
    }

    const userId = req.session.user.userId;

    // 사용자 기본 정보 조회
    const user = await global.User.findOne({
      where: { userId: userId },
      attributes: ['userId', 'nickname', 'level', 'techniques', 'hasInstructorLicense', 'createdAt']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자 정보를 찾을 수 없습니다.'
      });
    }

    // 활동 통계 조회
    const [postCount, reviewCount, congestionReportCount] = await Promise.all([
      // 작성한 게시글 수
      global.Post.count({
        where: { userId: userId }
      }),
      // 작성한 리뷰 수
      global.GymReview.count({
        where: { userId: userId }
      }),
      // 혼잡도 제보 수
      global.Congestion.count({
        where: { userId: userId }
      })
    ]);

    // 최근 활동 조회 (최근 게시글 5개)
    const recentPosts = await global.Post.findAll({
      where: { userId: userId },
      include: [
        {
          model: global.Gym,
          as: 'meetingGym',
          attributes: ['id', 'name'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // 최근 리뷰 5개
    const recentReviews = await global.GymReview.findAll({
      where: { userId: userId },
      include: [
        {
          model: global.Gym,
          as: 'gym',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // 즐겨찾기한 클라이밍장 (일단 빈 배열로 반환, 나중에 북마크 기능 완성 시 구현)
    const bookmarkedGyms = [];

    res.json({
      success: true,
      data: {
        user: user,
        statistics: {
          postCount: postCount,
          reviewCount: reviewCount,
          congestionReportCount: congestionReportCount,
          joinDays: Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24))
        },
        recentActivities: {
          posts: recentPosts,
          reviews: recentReviews,
          bookmarkedGyms: bookmarkedGyms
        }
      }
    });

  } catch (error) {
    console.error('마이페이지 데이터 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '마이페이지 정보를 불러올 수 없습니다.'
    });
  }
});

/**
 * 📝 내가 쓴 게시글 목록 조회 API
 * GET /api/user/my-posts
 */
router.get('/my-posts', async (req, res) => {
  try {
    // 로그인 체크
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: '로그인이 필요합니다.'
      });
    }

    const userId = req.session.user.userId;
    const { page = 1, limit = 10, category = '' } = req.query;
    const offset = (page - 1) * limit;

    // 검색 조건
    let whereConditions = { userId: userId };
    if (category && category !== 'all') {
      whereConditions.category = category;
    }

    const { count, rows: posts } = await global.Post.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: global.Gym,
          as: 'meetingGym',
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: global.Comment,
          as: 'comments',
          attributes: ['id']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
      distinct: true
    });

    res.json({
      success: true,
      posts: posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalPosts: count,
        hasNext: offset + posts.length < count,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('내 게시글 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '게시글 목록을 불러올 수 없습니다.'
    });
  }
});

/**
 * ⭐ 내가 쓴 리뷰 목록 조회 API
 * GET /api/user/my-reviews
 */
router.get('/my-reviews', async (req, res) => {
  try {
    // 로그인 체크
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: '로그인이 필요합니다.'
      });
    }

    const userId = req.session.user.userId;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: reviews } = await global.GymReview.findAndCountAll({
      where: { userId: userId },
      include: [
        {
          model: global.Gym,
          as: 'gym',
          attributes: ['id', 'name', 'address']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
      distinct: true
    });

    res.json({
      success: true,
      reviews: reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalReviews: count,
        hasNext: offset + reviews.length < count,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('내 리뷰 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '리뷰 목록을 불러올 수 없습니다.'
    });
  }
});

/**
 * ✏ 프로필 정보 수정 API
 * PUT /api/user/profile
 */
router.put('/profile', async (req, res) => {
  try {
    // 로그인 체크
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: '로그인이 필요합니다.'
      });
    }

    const userId = req.session.user.userId;
    const { nickname, level, techniques, hasInstructorLicense } = req.body;

    // 입력값 유효성 검사
    if (!nickname || nickname.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: '닉네임은 2자 이상 입력해주세요.'
      });
    }

    // 사용자 조회
    const user = await global.User.findOne({
      where: { userId: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자 정보를 찾을 수 없습니다.'
      });
    }

    // 닉네임 중복 확인 (자신 제외)
    if (nickname.trim() !== user.nickname) {
      const existingUser = await global.User.findOne({
        where: { 
          nickname: nickname.trim(),
          userId: { [global.Op.ne]: userId } // 자신 제외
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '이미 사용 중인 닉네임입니다.'
        });
      }
    }

    // 레벨 유효성 검사
    const validLevels = ["V0", "V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8"];
    const userLevel = level && validLevels.includes(level) ? level : null;

    // 기술 유효성 검사
    const validTechniques = ["static", "dynamic", "lunge", "campus", "counter_balance", "dead_point"];
    let userTechniques = [];
    if (techniques && Array.isArray(techniques)) {
      userTechniques = techniques.filter(tech => validTechniques.includes(tech));
    }

    // 프로필 업데이트
    await user.update({
      nickname: nickname.trim(),
      level: userLevel,
      techniques: userTechniques,
      hasInstructorLicense: hasInstructorLicense || false
    });

    // 세션 정보도 업데이트
    req.session.user.nickname = nickname.trim();

    // 업데이트된 사용자 정보 반환
    const updatedUser = await global.User.findOne({
      where: { userId: userId },
      attributes: ['userId', 'nickname', 'level', 'techniques', 'hasInstructorLicense', 'createdAt']
    });

    res.json({
      success: true,
      message: '프로필이 성공적으로 수정되었습니다.',
      user: updatedUser
    });

  } catch (error) {
    console.error('프로필 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: '프로필 수정 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 📊 내 혼잡도 제보 내역 조회 API
 * GET /api/user/my-congestion-reports
 */
router.get('/my-congestion-reports', async (req, res) => {
  try {
    // 로그인 체크
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: '로그인이 필요합니다.'
      });
    }

    const userId = req.session.user.userId;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: reports } = await global.Congestion.findAndCountAll({
      where: { userId: userId },
      include: [
        {
          model: global.Gym,
          as: 'gym',
          attributes: ['id', 'name', 'address']
        }
      ],
      order: [['reportedAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
      distinct: true
    });

    res.json({
      success: true,
      reports: reports,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalReports: count,
        hasNext: offset + reports.length < count,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('혼잡도 제보 내역 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '제보 내역을 불러올 수 없습니다.'
    });
  }
});

/**
 * 📋 사용자 북마크 목록 조회 API
 * GET /api/user/bookmarks
 */
// routes/users.js에 추가
router.get('/bookmarks', async (req, res) => {
  try {
    // 로그인 체크
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: '로그인이 필요합니다.'
      });
    }
    
    const userId = req.session.user.userId;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const { count, rows: bookmarks } = await global.Bookmark.findAndCountAll({
      where: { userId: userId },
      include: [
        {
          model: global.Gym,
          as: 'gym',
          attributes: [
            'id', 'name', 'address', 'district', 'dayPrice', 
            'monthPrice', 'rating', 'avgCongestion', 'currentCongestion'
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
      distinct: true
    });
    
    res.json({
      success: true,
      bookmarks: bookmarks,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalBookmarks: count,
        hasNext: offset + bookmarks.length < count,
        hasPrev: page > 1
      }
    });
    
  } catch (error) {
    console.error('북마크 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '북마크 목록을 불러올 수 없습니다.'
    });
  }
});


module.exports = router;