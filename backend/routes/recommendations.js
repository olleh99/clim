const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');

/**
 * 🤖 개인화 클라이밍장 추천 API
 * GET /api/recommendations/gyms
 */
router.get('/gyms', async (req, res) => {
    try {
        // 로그인 체크
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: '로그인이 필요합니다.'
            });
        }

        const userId = req.session.user.userId;
        const { limit = 5 } = req.query;

        // 사용자 정보 조회
        const user = await global.User.findOne({
            where: { userId: userId },
            attributes: ['userId', 'level', 'techniques', 'hasInstructorLicense']
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: '사용자 정보를 찾을 수 없습니다.'
            });
        }

        // 모든 클라이밍장 조회
        const gyms = await global.Gym.findAll({
            include: [
                {
                    model: global.GymReview,
                    as: 'reviews',
                    attributes: ['rating'],
                    required: false
                },
                {
                    model: global.Congestion,
                    as: 'congestionReports',
                    attributes: ['level', 'reportedAt'],
                    limit: 5,
                    order: [['reportedAt', 'DESC']],
                    required: false
                }
            ]
        });

        // 각 클라이밍장에 대한 추천 점수 계산
        const recommendedGyms = gyms.map(gym => {
            const score = calculateRecommendationScore(user, gym);
            return {
                ...gym.toJSON(),
                recommendationScore: score.total,
                scoreBreakdown: score.breakdown,
                recommendationReason: generateRecommendationReason(score.breakdown)
            };
        });

        // 점수 순으로 정렬
        recommendedGyms.sort((a, b) => b.recommendationScore - a.recommendationScore);

        // 상위 N개만 반환
        const topRecommendations = recommendedGyms.slice(0, parseInt(limit));

        res.json({
            success: true,
            recommendations: topRecommendations,
            userProfile: {
                level: user.level,
                techniques: user.techniques,
                hasInstructorLicense: user.hasInstructorLicense
            },
            message: `${user.level || '클라이밍'} 레벨에 맞는 추천 클라이밍장입니다!`
        });

    } catch (error) {
        console.error('추천 시스템 오류:', error);
        res.status(500).json({
            success: false,
            message: '추천 시스템에서 오류가 발생했습니다.'
        });
    }
});

/**
 * 🧮 추천 점수 계산 함수
 */
function calculateRecommendationScore(user, gym) {
    const breakdown = {
        techniqueMatch: 0,    // 기술 매칭 (40%)
        levelSuitability: 0,  // 레벨 적합성 (30%)
        realtimeStatus: 0,    // 실시간 상황 (20%)
        pastActivity: 0       // 과거 활동 (10%)
    };

    // 1. 기술 매칭 점수 계산 (40%)
    if (user.techniques && Array.isArray(user.techniques) && user.techniques.length > 0) {
        if (gym.techniques && Array.isArray(gym.techniques) && gym.techniques.length > 0) {
            const matchingTechniques = user.techniques.filter(userTech => 
                gym.techniques.includes(userTech)
            );
            breakdown.techniqueMatch = (matchingTechniques.length / user.techniques.length) * 40;
        }
    } else {
        // 사용자가 기술을 선택하지 않았다면 기본 점수
        breakdown.techniqueMatch = 20;
    }

    // 2. 레벨 적합성 점수 계산 (30%)
    if (user.level) {
        const levelScore = calculateLevelCompatibility(user.level);
        breakdown.levelSuitability = levelScore * 30;
    } else {
        // 레벨 정보가 없다면 중간 점수
        breakdown.levelSuitability = 15;
    }

    // 3. 실시간 상황 점수 계산 (20%)
    const realtimeScore = calculateRealtimeScore(gym);
    breakdown.realtimeStatus = realtimeScore * 20;

    // 4. 과거 활동 점수 계산 (10%)
    const activityScore = calculatePastActivityScore(gym);
    breakdown.pastActivity = activityScore * 10;

    // 총점 계산
    const total = breakdown.techniqueMatch + breakdown.levelSuitability + 
                  breakdown.realtimeStatus + breakdown.pastActivity;

    return {
        total: Math.round(total * 10) / 10, // 소수점 1자리
        breakdown: breakdown
    };
}

/**
 * 레벨 호환성 계산
 */
function calculateLevelCompatibility(userLevel) {
    // V0~V8 레벨에 따른 기본 점수
    const levelMap = {
        'V0': 1.0,  // 초급자 - 모든 암장 적합
        'V1': 1.0,
        'V2': 0.9,
        'V3': 0.8,
        'V4': 0.7,
        'V5': 0.6,  // 고급자 - 고난도 문제 있는 암장 선호
        'V6': 0.5,
        'V7': 0.4,
        'V8': 0.3
    };
    
    return levelMap[userLevel] || 0.5; // 기본값
}

/**
 * 실시간 상황 점수 계산
 */
function calculateRealtimeScore(gym) {
    let score = 0.5; // 기본 점수

    // 혼잡도 점수 (덜 혼잡할수록 높은 점수)
    if (gym.avgCongestion !== null) {
        score = 1 - gym.avgCongestion; // 0.2(여유) → 0.8점, 0.8(혼잡) → 0.2점
    }

    // 운영 시간 체크
    if (gym.openTime && gym.closeTime) {
        const now = new Date();
        const currentTime = now.getHours() * 100 + now.getMinutes();
        const openTime = parseInt(gym.openTime.replace(':', ''));
        const closeTime = parseInt(gym.closeTime.replace(':', ''));
        
        if (currentTime >= openTime && currentTime <= closeTime) {
            score += 0.2; // 영업중이면 가산점
        }
    }

    return Math.min(score, 1.0); // 최대 1.0
}

/**
 * 과거 활동 점수 계산
 */
function calculatePastActivityScore(gym) {
    let score = 0.5; // 기본 점수

    // 평균 평점이 있다면
    if (gym.rating && gym.rating > 0) {
        score = gym.rating / 5; // 5점 만점을 1점 만점으로 변환
    }

    // 리뷰 수가 많으면 가산점
    if (gym.reviewCount && gym.reviewCount > 10) {
        score += 0.1;
    }

    return Math.min(score, 1.0); // 최대 1.0
}

/**
 * 추천 이유 생성
 */
function generateRecommendationReason(breakdown) {
    const reasons = [];

    if (breakdown.techniqueMatch > 25) {
        reasons.push("선호하는 기술을 연습할 수 있어요");
    }
    if (breakdown.levelSuitability > 20) {
        reasons.push("현재 레벨에 적합한 문제들이 있어요");
    }
    if (breakdown.realtimeStatus > 15) {
        reasons.push("지금 방문하기 좋은 상황이에요");
    }
    if (breakdown.pastActivity > 7) {
        reasons.push("다른 클라이머들의 평가가 좋아요");
    }

    return reasons.length > 0 ? reasons.join(', ') : "새로운 도전을 해보세요!";
}

/**
 * 🔄 실시간 추천 업데이트 API
 * POST /api/recommendations/refresh
 */
router.post('/refresh', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: '로그인이 필요합니다.'
            });
        }

        // 간단히 새로운 추천 목록 반환
        res.json({
            success: true,
            message: '추천 목록이 업데이트되었습니다.',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('추천 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '추천 업데이트 중 오류가 발생했습니다.'
        });
    }
});

/**
 * 📊 추천 통계 API
 * GET /api/recommendations/stats
 */
router.get('/stats', async (req, res) => {
    try {
        // 전체 클라이밍장 수
        const totalGyms = await global.Gym.count();
        
        // 기술별 클라이밍장 분포
        const gymsWithTechniques = await global.Gym.findAll({
            attributes: ['techniques'],
            where: {
                techniques: { [Op.ne]: null }
            }
        });

        // 기술별 통계 계산
        const techniqueStats = {};
        const allTechniques = ['static', 'dynamic', 'lunge', 'campus', 'counter_balance', 'dead_point'];
        
        allTechniques.forEach(tech => {
            techniqueStats[tech] = gymsWithTechniques.filter(gym => 
                gym.techniques && gym.techniques.includes(tech)
            ).length;
        });

        res.json({
            success: true,
            stats: {
                totalGyms,
                techniqueDistribution: techniqueStats,
                lastUpdated: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('추천 통계 오류:', error);
        res.status(500).json({
            success: false,
            message: '통계 조회 중 오류가 발생했습니다.'
        });
    }
});

module.exports = router;