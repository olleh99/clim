const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');

/**
 * 🏢 클라이밍장 추가 API
 * POST /api/gyms
 */
router.post('/', async (req, res) => {
  try {
    const {
      name, address, district, phone, dayPrice, monthPrice,
      techniques, description, congestionLevel, addedBy,
      openTime, closeTime, restDay, website
    } = req.body;

    // 입력값 유효성 검사
    if (!name || !address || !district || !dayPrice) {
      return res.json({
        success: false,
        message: "필수 정보를 모두 입력해주세요. (이름, 주소, 지역, 일일권 가격)"
      });
    }

    if (dayPrice <= 0) {
      return res.json({
        success: false,
        message: "올바른 가격을 입력해주세요."
      });
    }

    // 클라이밍장 생성
    const newGym = await global.Gym.create({
      name: name,
      address: address,
      district: district,
      phone: phone || null,
      dayPrice: dayPrice,
      monthPrice: monthPrice || null,
      techniques: techniques || [],
      description: description || '',
      congestionLevel: congestionLevel || null,
      addedBy: addedBy,
      rating: 0.0,
      reviewCount: 0,
      openTime: openTime || null,
      closeTime: closeTime || null,
      restDay: restDay || null,
      website: website || null,
      avgCongestion: congestionLevel === 'low' ? 0.3 : 
                    congestionLevel === 'medium' ? 0.6 : 
                    congestionLevel === 'high' ? 0.8 : 0.5,
      currentCongestion: congestionLevel || null,
      lastCongestionUpdate: congestionLevel ? new Date() : null
    });

    res.json({
      success: true,
      message: "클라이밍장이 성공적으로 추가되었습니다!",
      gym: {
        id: newGym.id,
        name: newGym.name,
        address: newGym.address,
        district: newGym.district,
        phone: newGym.phone,
        dayPrice: newGym.dayPrice,
        monthPrice: newGym.monthPrice,
        techniques: newGym.techniques,
        description: newGym.description,
        congestionLevel: newGym.congestionLevel,
        avgCongestion: newGym.avgCongestion,
        openTime: newGym.openTime,
        closeTime: newGym.closeTime,
        restDay: newGym.restDay,
        website: newGym.website,
        addedBy: newGym.addedBy,
        createdAt: newGym.createdAt
      }
    });

  } catch (error) {
    console.error('클라이밍장 추가 오류:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.json({
        success: false,
        message: "입력값이 올바르지 않습니다."
      });
    }
    
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
    });
  }
});

/**
 * 🔍 클라이밍장 목록 조회 API
 * GET /api/gyms
 */
router.get('/', async (req, res) => {
  try {
    const { search, district, congestion, sortBy } = req.query;
    let whereCondition = {};
    let orderCondition = [['createdAt', 'DESC']];

    // 검색 조건들
    if (search) {
      whereCondition[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } }
      ];
    }

    if (district) {
      whereCondition.district = district;
    }

    if (congestion) {
      whereCondition.congestionLevel = congestion;
    }

    // 정렬 조건 설정
    switch (sortBy) {
      case 'name':
        orderCondition = [['name', 'ASC']];
        break;
      case 'newest':
        orderCondition = [['createdAt', 'DESC']];
        break;
      case 'price':
        orderCondition = [['dayPrice', 'ASC']];
        break;
      case 'rating':
        orderCondition = [['rating', 'DESC']];
        break;
    }

    // 기본 쿼리 구성
    const gymsQuery = {
      where: whereCondition,
      order: orderCondition,
      include: [
        {
          model: global.Congestion,
          as: 'congestionReports',
          limit: 1,
          order: [['reportedAt', 'DESC']],
          required: false
        }
      ]
    };

    // 데이터베이스 쿼리 실행
    const gyms = await global.Gym.findAll(gymsQuery);

    // 응답 데이터 가공
    const enrichedGyms = gyms.map(gym => {
      const gymData = gym.toJSON();
      
      // 영업 상태 판단
      if (gymData.openTime && gymData.closeTime) {
        const now = new Date();
        const currentTime = now.getHours() * 100 + now.getMinutes();
        const openTime = parseInt(gymData.openTime.replace(':', ''));
        const closeTime = parseInt(gymData.closeTime.replace(':', ''));
        
        gymData.isOpen = currentTime >= openTime && currentTime <= closeTime;
        gymData.openStatus = gymData.isOpen ? '영업중' : '영업종료';
      }
      
      return gymData;
    });

    res.json({
      success: true,
      gyms: enrichedGyms,
      meta: {
        total: enrichedGyms.length,
        sortBy: sortBy || 'newest'
      }
    });

  } catch (error) {
    console.error('클라이밍장 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: "클라이밍장 목록을 불러올 수 없습니다."
    });
  }
});

/**
 * 🔍 클라이밍장 상세 조회 API
 * GET /api/gyms/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const gymQuery = {
      include: [
        {
          model: global.Congestion,
          as: 'congestionReports',
          limit: 10,
          order: [['reportedAt', 'DESC']],
          include: [
            {
              model: global.User,
              as: 'reporter',
              attributes: ['nickname', 'level']
            }
          ]
        },
        {
          model: global.GymReview,
          as: 'reviews',
          limit: 5,
          order: [['createdAt', 'DESC']],
          include: [
            {
              model: global.User,
              as: 'reviewer',
              attributes: ['nickname', 'level']
            }
          ]
        },
        {
          model: global.Post,
          as: 'meetings',
          where: { 
            category: '모임', 
            meetingDate: { [Op.gte]: new Date() }
          },
          limit: 3,
          order: [['meetingDate', 'ASC']],
          required: false,
          include: [
            {
              model: global.User,
              as: 'author',
              attributes: ['nickname', 'level']
            }
          ]
        }
      ]
    };

    const gym = await global.Gym.findByPk(id, gymQuery);

    if (!gym) {
      return res.status(404).json({
        success: false,
        message: "클라이밍장을 찾을 수 없습니다."
      });
    }

    // 조회수 증가
    await gym.increment('viewCount');

    const gymData = gym.toJSON();

    // 영업 상태 및 혼잡도 분석
    if (gymData.congestionReports && gymData.congestionReports.length > 0) {
      const recentReports = gymData.congestionReports.slice(0, 5);
      const levelValues = { '여유': 0.2, '보통': 0.5, '혼잡': 0.8, '매우혼잡': 1.0 };
      
      const avgCongestion = recentReports.reduce((sum, report) => {
        return sum + (levelValues[report.level] || 0.5);
      }, 0) / recentReports.length;

      gymData.realTimeAvgCongestion = avgCongestion;
      gymData.recentReportCount = recentReports.length;
    }

    res.json({
      success: true,
      gym: gymData
    });

  } catch (error) {
    console.error('클라이밍장 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: "클라이밍장 정보를 불러올 수 없습니다."
    });
  }
});

/**
 * 🔥 혼잡도 제보 API
 * POST /api/gyms/:id/congestion
 */
// gyms.js - 혼잡도 제보 API 수정 버전

/**
 * 🔥 혼잡도 제보 API (수정된 버전)
 * POST /api/gyms/:id/congestion
 */
router.post('/:id/congestion', async (req, res) => {
  try {
    const { id } = req.params;
    const { level, peopleCount } = req.body;

    console.log('=== 혼잡도 제보 요청 ===');
    console.log('클라이밍장 ID:', id);
    console.log('제보 데이터:', { level, peopleCount });
    console.log('세션 정보:', req.session);

    // ID 유효성 검사
    if (!id || isNaN(parseInt(id))) {
      console.log('❌ 잘못된 클라이밍장 ID:', id);
      return res.status(400).json({
        success: false,
        message: "올바르지 않은 클라이밍장 ID입니다."
      });
    }

    // 레벨 유효성 검사
    if (!level || !['여유', '보통', '혼잡', '매우혼잡'].includes(level)) {
      console.log('❌ 잘못된 혼잡도 레벨:', level);
      return res.status(400).json({
        success: false,
        message: "올바른 혼잡도 레벨을 선택해주세요."
      });
    }

    // 로그인 상태 확인 (선택적)
    const isLoggedIn = !!(req.session?.user?.userId);
    const userId = req.session?.user?.userId || 'anonymous';
    
    console.log('로그인 상태:', isLoggedIn);
    console.log('사용자 ID:', userId);

    // 클라이밍장 존재 확인
    const gym = await global.Gym.findByPk(parseInt(id));
    if (!gym) {
      console.log('❌ 클라이밍장을 찾을 수 없음:', id);
      return res.status(404).json({
        success: false,
        message: "클라이밍장을 찾을 수 없습니다."
      });
    }

    console.log('✅ 클라이밍장 확인:', gym.name);

    // 중복 제보 체크 (로그인한 사용자만)
    if (isLoggedIn) {
      console.log('로그인 사용자 중복 제보 체크 중...');
      try {
        const recentUserReport = await global.Congestion.findOne({
          where: {
            gymId: parseInt(id),
            userId: userId,
            reportedAt: {
              [global.Op.gte]: new Date(Date.now() - 30 * 60 * 1000) // 최근 30분
            }
          }
        });

        if (recentUserReport) {
          console.log('⚠️ 최근 제보 존재 - 중복 제보 응답');
          return res.json({
            success: true,
            message: "이미 최근에 제보해주셨습니다. 감사합니다!",
            isDuplicate: true,
            congestionReport: {
              id: recentUserReport.id,
              level: recentUserReport.level,
              reportedAt: recentUserReport.reportedAt
            },
            updatedAvgCongestion: gym.avgCongestion
          });
        }
      } catch (duplicateCheckError) {
        console.log('중복 체크 오류 (무시하고 진행):', duplicateCheckError.message);
        // 중복 체크 실패해도 제보는 진행
      }
    }

    // 혼잡도 제보 생성
    const congestionData = {
      gymId: parseInt(id),
      userId: userId,
      level: level,
      peopleCount: peopleCount ? parseInt(peopleCount) : null,
      reportedAt: new Date()
    };

    console.log('혼잡도 제보 생성 중...');
    console.log('생성할 데이터:', congestionData);

    // 제보 생성 및 평균 혼잡도 업데이트
    let congestionReport;
    let updatedAvgCongestion = gym.avgCongestion;

    try {
      // 1. 제보 생성
      congestionReport = await global.Congestion.create(congestionData);
      console.log('✅ 혼잡도 제보 생성 성공:', congestionReport.id);

      // 2. 평균 혼잡도 계산
      console.log('평균 혼잡도 계산 중...');
      const recentReports = await global.Congestion.findAll({
        where: {
          gymId: parseInt(id),
          reportedAt: {
            [global.Op.gte]: new Date(Date.now() - 2 * 60 * 60 * 1000) // 최근 2시간
          }
        },
        order: [['reportedAt', 'DESC']],
        limit: 20 // 최대 20개 제보만 고려
      });

      console.log('최근 제보 개수:', recentReports.length);

      if (recentReports.length > 0) {
        const levelValues = { '여유': 0.2, '보통': 0.5, '혼잡': 0.8, '매우혼잡': 1.0 };
        const avgCongestion = recentReports.reduce((sum, report) => {
          return sum + (levelValues[report.level] || 0.5);
        }, 0) / recentReports.length;

        updatedAvgCongestion = Number(avgCongestion.toFixed(2));
        console.log('계산된 평균 혼잡도:', updatedAvgCongestion);

        // 3. 클라이밍장 혼잡도 업데이트
        await gym.update({
          avgCongestion: updatedAvgCongestion,
          currentCongestion: level,
          lastCongestionUpdate: new Date()
        });

        console.log('✅ 클라이밍장 혼잡도 업데이트 완료');
      }

    } catch (createError) {
      console.error('❌ 제보 생성 또는 업데이트 오류:', createError);
      throw createError; // 상위로 오류 전파
    }

    // 성공 응답
    const responseData = {
      success: true,
      message: "혼잡도 제보가 완료되었습니다!",
      congestionReport: {
        id: congestionReport.id,
        level: congestionReport.level,
        reportedAt: congestionReport.reportedAt,
        peopleCount: congestionReport.peopleCount
      },
      updatedAvgCongestion: updatedAvgCongestion,
      gymInfo: {
        id: gym.id,
        name: gym.name,
        currentCongestion: level
      }
    };

    console.log('=== 혼잡도 제보 성공 ===');
    console.log('응답 데이터:', responseData);

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(responseData);

  } catch (error) {
    console.error('=== 혼잡도 제보 오류 ===');
    console.error('오류 타입:', error.name);
    console.error('오류 메시지:', error.message);
    console.error('스택 트레이스:', error.stack);

    // Sequelize 관련 오류 상세 정보
    if (error.name && error.name.includes('Sequelize')) {
      console.error('Sequelize 오류 상세:', {
        name: error.name,
        parent: error.parent,
        original: error.original,
        sql: error.sql
      });
    }

    // 구체적인 오류 처리
    let errorMessage = '혼잡도 제보 중 오류가 발생했습니다.';
    let statusCode = 500;

    // 데이터베이스 연결 오류
    if (error.name === 'SequelizeConnectionError') {
      errorMessage = '데이터베이스 연결 오류가 발생했습니다.';
    }
    // 유효성 검증 오류
    else if (error.name === 'SequelizeValidationError') {
      errorMessage = '입력 데이터가 올바르지 않습니다.';
      statusCode = 400;
    }
    // 외래키 제약조건 오류
    else if (error.name === 'SequelizeForeignKeyConstraintError') {
      errorMessage = '클라이밍장 정보가 올바르지 않습니다.';
      statusCode = 400;
    }

    const errorResponse = {
      success: false,
      message: errorMessage,
      error: {
        type: error.name,
        message: error.message
      }
    };

    // 개발 환경에서만 상세 오류 정보 포함
    if (process.env.NODE_ENV === 'development') {
      errorResponse.debug = {
        stack: error.stack,
        sql: error.sql
      };
    }

    console.log('🔍 에러 응답 데이터:', errorResponse);

    res.setHeader('Content-Type', 'application/json');
    res.status(statusCode).json(errorResponse);
  }
});

// 추가: 데이터베이스 연결 및 모델 확인 함수
async function checkDatabaseConnection() {
  try {
    console.log('=== 데이터베이스 연결 확인 ===');
    
    // 기본 연결 확인
    await global.sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // 모델 존재 확인
    const models = ['Gym', 'Congestion', 'User'];
    for (const modelName of models) {
      if (global[modelName]) {
        console.log(`✅ ${modelName} 모델 확인됨`);
      } else {
        console.log(`❌ ${modelName} 모델이 없음`);
      }
    }

    // 테이블 존재 확인
    const [results] = await global.sequelize.query("SHOW TABLES");
    console.log('📋 데이터베이스 테이블 목록:', results.map(r => Object.values(r)[0]));

  } catch (error) {
    console.error('❌ 데이터베이스 연결 확인 실패:', error);
  }
}

// 서버 시작 시 연결 확인 (선택사항)
// checkDatabaseConnection();

/**
 * 🗑 클라이밍장 삭제 API
 * DELETE /api/gyms/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 입력값 검증
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '올바르지 않은 클라이밍장 ID입니다.'
      });
    }

    // 클라이밍장 존재 여부 확인
    const existingGym = await global.Gym.findByPk(id);
    if (!existingGym) {
      return res.status(404).json({
        success: false,
        message: '해당 클라이밍장을 찾을 수 없습니다.'
      });
    }

    const gymName = existingGym.name;

    // 클라이밍장 삭제 실행
    const deleteResult = await global.Gym.destroy({
      where: { id: id }
    });

    // 삭제 결과 확인
    if (deleteResult === 0) {
      return res.status(500).json({
        success: false,
        message: '클라이밍장 삭제에 실패했습니다.'
      });
    }

    // 성공 응답
    res.json({
      success: true,
      message: '클라이밍장이 성공적으로 삭제되었습니다.',
      deletedGym: {
        id: parseInt(id),
        name: gymName
      }
    });

  } catch (error) {
    console.error('클라이밍장 삭제 중 오류 발생:', error);
    
    // Sequelize 제약 조건 오류 처리
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        message: '이 클라이밍장과 연결된 데이터가 있어 삭제할 수 없습니다.'
      });
    }

    res.status(500).json({
      success: false,
      message: '서버 오류로 인해 클라이밍장 삭제에 실패했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * 🗑 클라이밍장 일괄 삭제 API (보너스)
 * DELETE /api/gyms/batch
 */
router.delete('/batch', async (req, res) => {
  try {
    const { gymIds } = req.body;

    // 입력값 검증
    if (!gymIds || !Array.isArray(gymIds) || gymIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '삭제할 클라이밍장 ID 목록을 제공해주세요.'
      });
    }

    // ID 목록 검증
    const validIds = gymIds.filter(id => !isNaN(id) && id > 0);
    if (validIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '올바른 클라이밍장 ID가 없습니다.'
      });
    }

    // 삭제할 클라이밍장들 조회
    const existingGyms = await global.Gym.findAll({
      where: {
        id: {
          [Op.in]: validIds
        }
      }
    });

    if (existingGyms.length === 0) {
      return res.status(404).json({
        success: false,
        message: '삭제할 클라이밍장을 찾을 수 없습니다.'
      });
    }

    // 일괄 삭제 실행
    const deleteResult = await global.Gym.destroy({
      where: {
        id: {
          [Op.in]: validIds
        }
      }
    });

    // 성공 응답
    res.json({
      success: true,
      message: `${deleteResult}개의 클라이밍장이 삭제되었습니다.`,
      deletedCount: deleteResult,
      deletedGyms: existingGyms.map(gym => ({
        id: gym.id,
        name: gym.name
      }))
    });

  } catch (error) {
    console.error('클라이밍장 일괄 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '일괄 삭제 중 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * 📝 클라이밍장 리뷰 작성 API
 * POST /api/gyms/:id/reviews
 */
router.post('/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, content, visitDate, difficulty, crowdLevel } = req.body;

    // 로그인 체크
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: '로그인이 필요합니다.'
      });
    }

    const userId = req.session.user.userId;

    // 입력값 유효성 검사
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: '올바른 평점을 입력해주세요. (1-5점)'
      });
    }

    if (!content || content.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: '리뷰 내용은 10자 이상 입력해주세요.'
      });
    }

    // 클라이밍장 존재 확인
    const gym = await global.Gym.findByPk(id);
    if (!gym) {
      return res.status(404).json({
        success: false,
        message: '클라이밍장을 찾을 수 없습니다.'
      });
    }

    // 중복 리뷰 확인
    const existingReview = await global.GymReview.findOne({
      where: {
        gymId: id,
        userId: userId
      }
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: '이미 이 클라이밍장에 리뷰를 작성하셨습니다. 수정을 원하시면 기존 리뷰를 수정해주세요.'
      });
    }

    // 리뷰 생성
    const newReview = await global.GymReview.create({
      gymId: parseInt(id),
      userId: userId,
      rating: parseInt(rating),
      content: content.trim(),
      visitDate: visitDate ? new Date(visitDate) : null,
      difficulty: difficulty || null,
      crowdLevel: crowdLevel || null
    });

    // 클라이밍장 평균 평점 및 리뷰 수 업데이트
    const allReviews = await global.GymReview.findAll({
      where: { gymId: id }
    });

    const avgRating = allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length;

    await gym.update({
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: allReviews.length
    });

    // 생성된 리뷰 정보 반환
    const createdReview = await global.GymReview.findByPk(newReview.id, {
      include: [{
        model: global.User,
        as: 'reviewer',
        attributes: ['userId', 'nickname', 'level', 'hasInstructorLicense']
      }]
    });

    res.status(201).json({
      success: true,
      message: '리뷰가 성공적으로 작성되었습니다!',
      review: createdReview,
      updatedGymRating: avgRating
    });

  } catch (error) {
    console.error('리뷰 작성 오류:', error);
    res.status(500).json({
      success: false,
      message: '리뷰 작성 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 📋 클라이밍장 리뷰 목록 조회 API
 * GET /api/gyms/:id/reviews
 */
router.get('/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, sortBy = 'latest', rating = null } = req.query;
    const offset = (page - 1) * limit;

    // 검색 조건 구성
    let whereConditions = { gymId: id };

    // 별점 필터
    if (rating) {
      whereConditions.rating = parseInt(rating);
    }

    // 정렬 조건
    let orderConditions = [];
    switch (sortBy) {
      case 'rating_high':
        orderConditions = [['rating', 'DESC'], ['createdAt', 'DESC']];
        break;
      case 'rating_low':
        orderConditions = [['rating', 'ASC'], ['createdAt', 'DESC']];
        break;
      default:
        orderConditions = [['createdAt', 'DESC']];
    }

    const { count, rows: reviews } = await global.GymReview.findAndCountAll({
      where: whereConditions,
      include: [{
        model: global.User,
        as: 'reviewer',
        attributes: ['userId', 'nickname', 'level', 'hasInstructorLicense']
      }],
      order: orderConditions,
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
    console.error('리뷰 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '리뷰 목록을 불러올 수 없습니다.'
    });
  }
});

/**
 * 🗑 리뷰 삭제 API
 * DELETE /api/gyms/:gymId/reviews/:reviewId
 */
router.delete('/:gymId/reviews/:reviewId', async (req, res) => {
  try {
    const { gymId, reviewId } = req.params;

    // 로그인 체크
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: '로그인이 필요합니다.'
      });
    }

    const userId = req.session.user.userId;

    // 리뷰 존재 확인
    const review = await global.GymReview.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: '리뷰를 찾을 수 없습니다.'
      });
    }

    // 작성자 권한 확인
    if (review.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: '리뷰 삭제 권한이 없습니다.'
      });
    }

    // 리뷰 삭제
    await review.destroy();

    // 클라이밍장 평균 평점 및 리뷰 수 업데이트
    const gym = await global.Gym.findByPk(gymId);
    const remainingReviews = await global.GymReview.findAll({
      where: { gymId: gymId }
    });

    if (remainingReviews.length > 0) {
      const avgRating = remainingReviews.reduce((sum, review) => sum + review.rating, 0) / remainingReviews.length;
      await gym.update({
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: remainingReviews.length
      });
    } else {
      await gym.update({
        rating: 0.0,
        reviewCount: 0
      });
    }

    res.json({
      success: true,
      message: '리뷰가 삭제되었습니다.'
    });

  } catch (error) {
    console.error('리뷰 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '리뷰 삭제 중 오류가 발생했습니다.'
    });
  }
});

/**
 * ✏ 리뷰 수정 API
 * PUT /api/gyms/:gymId/reviews/:reviewId
 */
router.put('/:gymId/reviews/:reviewId', async (req, res) => {
  try {
    const { gymId, reviewId } = req.params;
    const { rating, content, visitDate, difficulty, crowdLevel } = req.body;

    // 로그인 체크
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: '로그인이 필요합니다.'
      });
    }

    const userId = req.session.user.userId;

    // 입력값 유효성 검사
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: '올바른 평점을 입력해주세요. (1-5점)'
      });
    }

    if (!content || content.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: '리뷰 내용은 10자 이상 입력해주세요.'
      });
    }

    // 리뷰 존재 확인
    const review = await global.GymReview.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: '리뷰를 찾을 수 없습니다.'
      });
    }

    // 작성자 권한 확인
    if (review.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: '리뷰 수정 권한이 없습니다.'
      });
    }

    // 리뷰 수정
    await review.update({
      rating: parseInt(rating),
      content: content.trim(),
      visitDate: visitDate ? new Date(visitDate) : null,
      difficulty: difficulty || null,
      crowdLevel: crowdLevel || null
    });

    // 클라이밍장 평균 평점 업데이트
    const allReviews = await global.GymReview.findAll({
      where: { gymId: gymId }
    });

    const avgRating = allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length;

    await global.Gym.findByPk(gymId).then(gym => {
      gym.update({
        rating: Math.round(avgRating * 10) / 10
      });
    });

    // 수정된 리뷰 정보 반환
    const updatedReview = await global.GymReview.findByPk(reviewId, {
      include: [{
        model: global.User,
        as: 'reviewer',
        attributes: ['userId', 'nickname', 'level', 'hasInstructorLicense']
      }]
    });

    res.json({
      success: true,
      message: '리뷰가 성공적으로 수정되었습니다.',
      review: updatedReview,
      updatedGymRating: avgRating
    });

  } catch (error) {
    console.error('리뷰 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: '리뷰 수정 중 오류가 발생했습니다.'
    });
  }
});

// backend/routes/gyms.js에 추가할 북마크 관련 API

/**
 * 🔖 북마크 토글 API
 * POST /api/gyms/:id/bookmark
 */
router.post('/:id/bookmark', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 로그인 체크
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: '로그인이 필요합니다.'
      });
    }
    
    const userId = req.session.user.userId;
    const gymId = parseInt(id);
    
    // 클라이밍장 존재 확인
    const gym = await global.Gym.findByPk(gymId);
    if (!gym) {
      return res.status(404).json({
        success: false,
        message: '클라이밍장을 찾을 수 없습니다.'
      });
    }
    
    // 기존 북마크 확인
    const existingBookmark = await global.Bookmark.findOne({
      where: {
        userId: userId,
        gymId: gymId
      }
    });
    
    if (existingBookmark) {
      // 북마크 제거
      await existingBookmark.destroy();
      res.json({
        success: true,
        message: '즐겨찾기에서 제거했습니다.',
        isBookmarked: false
      });
    } else {
      // 북마크 추가
      await global.Bookmark.create({
        userId: userId,
        gymId: gymId
      });
      res.json({
        success: true,
        message: '즐겨찾기에 추가했습니다.',
        isBookmarked: true
      });
    }
    
  } catch (error) {
    console.error('북마크 토글 오류:', error);
    res.status(500).json({
      success: false,
      message: '북마크 처리 중 오류가 발생했습니다.'
    });
  }
});


module.exports = router;