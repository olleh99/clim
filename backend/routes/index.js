const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

// 기본 라우트
router.get('/', function(req, res, next) {
  res.render('index', { title: '붙잡아줘요 - 클라이밍 커뮤니티' });
});

/**
 * 👤 회원가입 API
 * POST /api/users/signup (Vue에서 호출하는 경로)
 */
router.post('/signup', async (req, res) => {
  try {
    const {
      userId,
      nickname,
      password,
      level,
      techniques,
      hasInstructorLicense
    } = req.body;

    console.log('회원가입 요청 받음:', req.body);

    // 기본 유효성 검사
    if (!userId || !nickname || !password) {
      console.log('필수 정보 누락');
      return res.status(400).json({
        success: false,
        message: '필수 정보가 누락되었습니다'
      });
    }

    // 비밀번호 길이 검증
    if (password.length < 6) {
      console.log('비밀번호 길이 부족');
      return res.status(400).json({
        success: false,
        message: '비밀번호는 6자리 이상 입력해주세요'
      });
    }

    // 중복 검사
    console.log('중복 검사 시작');
    const existingUser = await global.User.findOne({
      where: { userId: userId }
    });

    if (existingUser) {
      console.log('ID 중복');
      return res.status(409).json({
        success: false,
        message: '이미 사용 중인 ID입니다'
      });
    }

    const existingNickname = await global.User.findOne({
      where: { nickname: nickname }
    });

    if (existingNickname) {
      console.log('닉네임 중복');
      return res.status(409).json({
        success: false,
        message: '이미 사용 중인 닉네임입니다'
      });
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

    // 새 사용자 생성
    console.log('사용자 생성 시작');
    const newUser = await global.User.create({
      userId: userId,
      password: password, // TODO: bcrypt로 암호화 필요
      nickname: nickname,
      level: userLevel,
      techniques: userTechniques,
      hasInstructorLicense: hasInstructorLicense || false,
      latitude: null,
      longitude: null
    });

    console.log('새 사용자 생성 완료:', newUser.userId);

    // 응답 (비밀번호 제외)
    const userResponse = {
      userId: newUser.userId,
      nickname: newUser.nickname,
      level: newUser.level,
      techniques: newUser.techniques,
      hasInstructorLicense: newUser.hasInstructorLicense,
      createdAt: newUser.createdAt
    };

    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다!',
      user: userResponse
    });

  } catch (error) {
    console.error('회원가입 에러 상세:', error);
    
    // Sequelize 유니크 제약조건 에러 처리
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0].path;
      let message = '중복된 정보가 있습니다';
      
      if (field === 'userId') {
        message = '이미 사용 중인 ID입니다';
      } else if (field === 'nickname') {
        message = '이미 사용 중인 닉네임입니다';
      }

      return res.status(409).json({
        success: false,
        message: message
      });
    }

    res.status(500).json({
      success: false,
      message: '회원가입 중 오류가 발생했습니다: ' + error.message
    });
  }
});

/**
 * 🔍 ID 중복 검사 API (선택사항)
 * GET /api/auth/check-id/:userId
 */
router.get('/check-id/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ID를 입력해주세요'
      });
    }

    const existingUser = await global.User.findOne({
      where: { userId: userId }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: '이미 사용 중인 ID입니다'
      });
    }

    res.json({
      success: true,
      message: '사용 가능한 ID입니다'
    });

  } catch (error) {
    console.error('ID 중복 검사 에러:', error);
    res.status(500).json({
      success: false,
      message: 'ID 중복 확인 중 오류가 발생했습니다'
    });
  }
});

/**
 * 🔍 닉네임 중복 검사 API (선택사항)
 * GET /api/auth/check-nickname/:nickname
 */
router.get('/check-nickname/:nickname', async (req, res) => {
  try {
    const { nickname } = req.params;
    
    if (!nickname) {
      return res.status(400).json({
        success: false,
        message: '닉네임을 입력해주세요'
      });
    }

    const existingUser = await global.User.findOne({
      where: { nickname: nickname }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: '이미 사용 중인 닉네임입니다'
      });
    }

    res.json({
      success: true,
      message: '사용 가능한 닉네임입니다'
    });

  } catch (error) {
    console.error('닉네임 중복 검사 에러:', error);
    res.status(500).json({
      success: false,
      message: '닉네임 중복 확인 중 오류가 발생했습니다'
    });
  }
});

/**
 * 🔐 로그인 API
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { userId, password } = req.body;

    console.log('로그인 시도:', userId);

    // 입력값 유효성 검사
    if (!userId || !password) {
      return res.status(400).json({
        success: false,
        message: '아이디와 비밀번호를 모두 입력해주세요'
      });
    }

    // 데이터베이스에서 사용자 조회
    const user = await global.User.findOne({
      where: {
        userId: userId,
        password: password // TODO: bcrypt.compare() 사용 필요
      }
    });

    if (!user) {
      console.log('로그인 실패:', userId);
      return res.status(401).json({
        success: false,
        message: '아이디 또는 비밀번호가 틀렸습니다'
      });
    }

    // 로그인 성공
    console.log('로그인 성공:', user.userId);
    
    // 세션에 사용자 정보 저장
    req.session.user = {
      userId: user.userId,
      nickname: user.nickname
    };

    // 성공 응답 (비밀번호 제외)
    res.json({
      success: true,
      message: '로그인 성공',
      user: {
        userId: user.userId,
        nickname: user.nickname,
        level: user.level,
        techniques: user.techniques,
        hasInstructorLicense: user.hasInstructorLicense,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('로그인 에러:', error);
    res.status(500).json({
      success: false,
      message: '로그인 중 오류가 발생했습니다'
    });
  }
});

/**
 * 🔍 로그인 상태 확인 API
 * GET /api/auth/me
 */
router.get('/me', async (req, res) => {
  try {
    const sessionUser = req.session.user;
    
    if (!sessionUser) {
      return res.json({
        isLogin: false,
        user: null,
        message: '로그인이 필요합니다'
      });
    }

    // 세션에 저장된 사용자 정보를 데이터베이스에서 다시 조회
    const user = await global.User.findOne({
      where: { userId: sessionUser.userId },
      attributes: ['userId', 'nickname', 'level', 'techniques', 'hasInstructorLicense', 'createdAt']
    });

    // 사용자가 탈퇴했거나 정보가 없는 경우
    if (!user) {
      req.session.destroy();
      return res.json({
        isLogin: false,
        user: null,
        message: '사용자 정보를 찾을 수 없습니다'
      });
    }

    res.json({
      isLogin: true,
      user: user,
      message: '로그인 상태입니다'
    });

  } catch (error) {
    console.error('로그인 상태 확인 에러:', error);
    res.status(500).json({
      isLogin: false,
      user: null,
      message: '서버 오류가 발생했습니다'
    });
  }
});

/**
 * 🚪 로그아웃 API
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  try {
    console.log('로그아웃 요청:', req.session.user?.userId);
    
    req.session.destroy((err) => {
      if (err) {
        console.error('세션 삭제 오류:', err);
        return res.status(500).json({
          success: false,
          message: '로그아웃 중 오류가 발생했습니다'
        });
      }

      console.log('로그아웃 완료');
      res.json({
        success: true,
        message: '로그아웃되었습니다'
      });
    });

  } catch (error) {
    console.error('로그아웃 에러:', error);
    res.status(500).json({
      success: false,
      message: '로그아웃 중 오류가 발생했습니다'
    });
  }
});

/**
 * 📊 대시보드 통계 API
 * GET /api/dashboard/stats
 */
router.get('/dashboard/stats', async (req, res) => {
  try {
    // 전체 통계 조회
    const [
      totalUsers,
      totalGyms,
      totalPosts,
      totalReviews,
      totalCongestionReports
    ] = await Promise.all([
      global.User.count(),
      global.Gym.count(),
      global.Post.count(),
      global.GymReview.count(),
      global.Congestion.count()
    ]);

    // 최근 활동 (최근 7일)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const [
      recentUsers,
      recentPosts,
      recentReviews
    ] = await Promise.all([
      global.User.count({
        where: { createdAt: { [global.Op.gte]: sevenDaysAgo } }
      }),
      global.Post.count({
        where: { createdAt: { [global.Op.gte]: sevenDaysAgo } }
      }),
      global.GymReview.count({
        where: { createdAt: { [global.Op.gte]: sevenDaysAgo } }
      })
    ]);

    // 인기 클라이밍장 (리뷰 수 기준 상위 5개)
    const popularGyms = await global.Gym.findAll({
      order: [['reviewCount', 'DESC'], ['rating', 'DESC']],
      limit: 5,
      attributes: ['id', 'name', 'rating', 'reviewCount', 'avgCongestion']
    });

    // 최근 가입한 사용자들 (상위 5명)
    const recentUsersList = await global.User.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['userId', 'nickname', 'level', 'hasInstructorLicense', 'createdAt']
    });

    res.json({
      success: true,
      data: {
        totalStats: {
          users: totalUsers,
          gyms: totalGyms,
          posts: totalPosts,
          reviews: totalReviews,
          congestionReports: totalCongestionReports
        },
        recentActivity: {
          newUsers: recentUsers,
          newPosts: recentPosts,
          newReviews: recentReviews
        },
        popularGyms: popularGyms,
        recentUsers: recentUsersList
      }
    });

  } catch (error) {
    console.error('대시보드 통계 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '통계 정보를 불러올 수 없습니다'
    });
  }
});

/**
 * 📋 사용자 목록 조회 (개발/관리자용)
 * GET /api/auth/users
 */
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    // 검색 조건
    let whereCondition = {};
    if (search) {
      whereCondition = {
        [global.Op.or]: [
          { userId: { [global.Op.like]: `%${search}%` } },
          { nickname: { [global.Op.like]: `%${search}%` } }
        ]
      };
    }

    const { count, rows: users } = await global.User.findAndCountAll({
      where: whereCondition,
      attributes: ['userId', 'nickname', 'level', 'techniques', 'hasInstructorLicense', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      success: true,
      users: users,
      pagination: {
        total: count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        hasNext: offset + users.length < count,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('사용자 목록 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '사용자 목록을 불러올 수 없습니다'
    });
  }
});

/**
 * 🗑️ 사용자 삭제 API (개발/관리자용)
 * DELETE /api/auth/users/:userId
 */
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '사용자 ID가 필요합니다'
      });
    }

    const user = await global.User.findOne({
      where: { userId: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다'
      });
    }

    console.log('사용자 삭제 시도:', userId);
    await user.destroy();
    console.log('사용자 삭제 완료:', userId);

    res.json({
      success: true,
      message: '사용자가 삭제되었습니다',
      deletedUser: {
        userId: user.userId,
        nickname: user.nickname
      }
    });

  } catch (error) {
    console.error('사용자 삭제 에러:', error);
    
    // 외래키 제약조건 오류 처리
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        message: '이 사용자와 연결된 데이터가 있어 삭제할 수 없습니다'
      });
    }

    res.status(500).json({
      success: false,
      message: '사용자 삭제 중 오류가 발생했습니다'
    });
  }
});

/**
 * 🔧 시스템 상태 확인 API
 * GET /api/health
 */
router.get('/health', async (req, res) => {
  try {
    // 데이터베이스 연결 확인
    await global.User.findOne({ limit: 1 });
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime()
    });

  } catch (error) {
    console.error('헬스체크 실패:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

/**
 * 🔍 통합 검색 API
 * GET /api/search
 */
router.get('/search', async (req, res) => {
  try {
    const { q: query, type = 'all', limit = 10 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: '검색어는 2글자 이상 입력해주세요'
      });
    }

    const searchTerm = query.trim();
    const results = {};

    // 클라이밍장 검색
    if (type === 'all' || type === 'gyms') {
      results.gyms = await global.Gym.findAll({
        where: {
          [global.Op.or]: [
            { name: { [global.Op.like]: `%${searchTerm}%` } },
            { address: { [global.Op.like]: `%${searchTerm}%` } },
            { description: { [global.Op.like]: `%${searchTerm}%` } }
          ]
        },
        attributes: ['id', 'name', 'address', 'rating', 'avgCongestion'],
        limit: parseInt(limit)
      });
    }

    // 게시글 검색
    if (type === 'all' || type === 'posts') {
      results.posts = await global.Post.findAll({
        where: {
          [global.Op.or]: [
            { title: { [global.Op.like]: `%${searchTerm}%` } },
            { content: { [global.Op.like]: `%${searchTerm}%` } }
          ]
        },
        include: [{
          model: global.User,
          as: 'author',
          attributes: ['nickname']
        }],
        attributes: ['id', 'title', 'category', 'createdAt'],
        limit: parseInt(limit)
      });
    }

    // 사용자 검색 (닉네임만)
    if (type === 'all' || type === 'users') {
      results.users = await global.User.findAll({
        where: {
          nickname: { [global.Op.like]: `%${searchTerm}%` }
        },
        attributes: ['userId', 'nickname', 'level', 'hasInstructorLicense'],
        limit: parseInt(limit)
      });
    }

    res.json({
      success: true,
      query: searchTerm,
      results: results,
      totalCount: Object.values(results).reduce((sum, arr) => sum + arr.length, 0)
    });

  } catch (error) {
    console.error('통합 검색 에러:', error);
    res.status(500).json({
      success: false,
      message: '검색 중 오류가 발생했습니다'
    });
  }
});

module.exports = router;