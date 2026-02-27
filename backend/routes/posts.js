const express = require('express');
var router = express.Router();
const { Op } = require('sequelize');

/**
 * 🧗‍♀️ 붙잡아줘요 - 게시판 API
 * 클라이밍장 기반 실시간 정보 공유 게시판
 */

/**
 * 📝 게시글 목록 조회 API
 * GET /api/posts
 * Query Parameters: page, category, gymId, search, sortBy
 */
router.get('/', async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            category, 
            gymId, 
            search,
            sortBy = 'latest'
        } = req.query;

        const offset = (page - 1) * limit;
        
        // 검색 조건 구성
        let whereConditions = {};
        
        if (category && category !== 'all') {
            whereConditions.category = category;
        }
        
        if (gymId) {
            whereConditions.meetingGymId = gymId;
        }
        
        if (search) {
            whereConditions[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { content: { [Op.like]: `%${search}%` } }
            ];
        }

        // 정렬 조건
        let orderConditions = [];
        switch (sortBy) {
            case 'likes':
                orderConditions = [['likes', 'DESC'], ['createdAt', 'DESC']];
                break;
            case 'views':
                orderConditions = [['views', 'DESC'], ['createdAt', 'DESC']];
                break;
            default:
                orderConditions = [['createdAt', 'DESC']];
        }

        const { count, rows: posts } = await global.Post.findAndCountAll({
            where: whereConditions,
            include: [
                {
                    model: global.User,
                    as: 'author',
                    attributes: ['userId', 'nickname', 'level', 'hasInstructorLicense']
                },
                {
                    model: global.Gym,
                    as: 'meetingGym',
                    attributes: ['id', 'name', 'address', 'avgCongestion'],
                    required: false
                },
                {
                    model: global.Comment,
                    as: 'comments',
                    include: [{
                        model: global.User,
                        as: 'author',
                        attributes: ['userId', 'nickname', 'level']
                    }]
                }
            ],
            order: orderConditions,
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
        console.error('게시글 목록 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '게시글 목록을 불러올 수 없습니다.'
        });
    }
});

/**
 * 📝 게시글 상세 조회 API
 * GET /api/posts/:id
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // 조회수 증가
        await global.Post.increment('views', { where: { id } });
        
        const post = await global.Post.findByPk(id, {
            include: [
                {
                    model: global.User,
                    as: 'author',
                    attributes: ['userId', 'nickname', 'level', 'hasInstructorLicense', 'techniques']
                },
                {
                    model: global.Gym,
                    as: 'meetingGym',
                    attributes: ['id', 'name', 'address','avgCongestion'],
                    required: false
                },
                {
                    model: global.Comment,
                    as: 'comments',
                    where: { parentId: null },
                    required: false,
                    include: [
                        {
                            model: global.User,
                            as: 'author',
                            attributes: ['userId', 'nickname', 'level']
                        },
                        {
                            model: global.Comment,
                            as: 'replies',
                            include: [{
                                model: global.User,
                                as: 'author',
                                attributes: ['userId', 'nickname', 'level']
                            }]
                        }
                    ]
                }
            ]
        });

        if (!post) {
            return res.status(404).json({
                success: false,
                message: '게시글을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            post: post
        });

    } catch (error) {
        console.error('게시글 상세 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '게시글을 불러올 수 없습니다.'
        });
    }
});

/**
 * 📝 게시글 작성 API
 * POST /api/posts
 */
router.post('/', async (req, res) => {
    try {
        const {
            title,
            content,
            category,
            meetingDate,
            meetingGymId,
            maxPeople,
            imageUrl
        } = req.body;

        // 로그인 체크
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: '로그인이 필요합니다.'
            });
        }

        const userId = req.session.user.userId;

        // 기본 유효성 검사
        if (!title || !content || !category) {
            return res.status(400).json({
                success: false,
                message: '제목, 내용, 카테고리는 필수입니다.'
            });
        }

        // 모임 게시글 추가 검증
        if (category === '모임') {
            if (!meetingDate || !meetingGymId || !maxPeople) {
                return res.status(400).json({
                    success: false,
                    message: '모임 게시글은 일시, 장소, 인원이 필수입니다.'
                });
            }
        }

        const newPost = await global.Post.create({
            title,
            content,
            category,
            userId,
            meetingDate: category === '모임' ? meetingDate : null,
            meetingGymId: category === '모임' ? meetingGymId : meetingGymId || null,
            maxPeople: category === '모임' ? maxPeople : null,
            imageUrl: imageUrl || null
        });

        // 작성된 게시글 정보 반환
        const createdPost = await global.Post.findByPk(newPost.id, {
            include: [
                {
                    model: global.User,
                    as: 'author',
                    attributes: ['userId', 'nickname', 'level', 'hasInstructorLicense']
                },
                {
                    model: global.Gym,
                    as: 'meetingGym',
                    attributes: ['id', 'name', 'address'],
                    required: false
                }
            ]
        });

        res.status(201).json({
            success: true,
            message: '게시글이 성공적으로 작성되었습니다.',
            post: createdPost
        });

    } catch (error) {
        console.error('게시글 작성 오류:', error);
        res.status(500).json({
            success: false,
            message: '게시글 작성 중 오류가 발생했습니다.'
        });
    }
});

/**
 * 📝 게시글 수정 API
 * PUT /api/posts/:id
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            content,
            category,
            meetingDate,
            meetingGymId,
            maxPeople,
            imageUrl
        } = req.body;

        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: '로그인이 필요합니다.'
            });
        }

        const post = await global.Post.findByPk(id);
        
        if (!post) {
            return res.status(404).json({
                success: false,
                message: '게시글을 찾을 수 없습니다.'
            });
        }

        // 작성자 권한 확인
        if (post.userId !== req.session.user.userId) {
            return res.status(403).json({
                success: false,
                message: '게시글 수정 권한이 없습니다.'
            });
        }

        await post.update({
            title,
            content,
            category,
            meetingDate: category === '모임' ? meetingDate : null,
            meetingGymId: category === '모임' ? meetingGymId : meetingGymId || null,
            maxPeople: category === '모임' ? maxPeople : null,
            imageUrl: imageUrl || null
        });

        res.json({
            success: true,
            message: '게시글이 성공적으로 수정되었습니다.'
        });

    } catch (error) {
        console.error('게시글 수정 오류:', error);
        res.status(500).json({
            success: false,
            message: '게시글 수정 중 오류가 발생했습니다.'
        });
    }
});

/**
 * 🗑 게시글 삭제 API
 * DELETE /api/posts/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: '로그인이 필요합니다.'
            });
        }

        const post = await global.Post.findByPk(id);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: '게시글을 찾을 수 없습니다.'
            });
        }

        // 작성자 권한 확인
        if (post.userId !== req.session.user.userId) {
            return res.status(403).json({
                success: false,
                message: '게시글 삭제 권한이 없습니다.'
            });
        }

        await post.destroy();

        res.json({
            success: true,
            message: '게시글이 성공적으로 삭제되었습니다.'
        });

    } catch (error) {
        console.error('게시글 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: '게시글 삭제 중 오류가 발생했습니다.'
        });
    }
});

/**
 * ❤️ 게시글 좋아요 API
 * POST /api/posts/:id/like
 */
router.post('/:id/like', async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: '로그인이 필요합니다.'
            });
        }

        const post = await global.Post.findByPk(id);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: '게시글을 찾을 수 없습니다.'
            });
        }

        // 좋아요 수 증가
        await post.increment('likes');

        res.json({
            success: true,
            message: '좋아요가 추가되었습니다.',
            likes: post.likes + 1
        });

    } catch (error) {
        console.error('좋아요 오류:', error);
        res.status(500).json({
            success: false,
            message: '좋아요 처리 중 오류가 발생했습니다.'
        });
    }
});

/**
 * 💬 댓글 작성 API
 * POST /api/posts/:id/comments
 */
router.post('/:id/comments', async (req, res) => {
    try {
        const { id } = req.params;
        const { content, parentId } = req.body;

        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: '로그인이 필요합니다.'
            });
        }

        if (!content || content.trim() === '') {
            return res.status(400).json({
                success: false,
                message: '댓글 내용을 입력해주세요.'
            });
        }

        const comment = await global.Comment.create({
            content: content.trim(),
            postId: id,
            userId: req.session.user.userId,
            parentId: parentId || null
        });

        // 생성된 댓글 정보 반환
        const createdComment = await global.Comment.findByPk(comment.id, {
            include: [{
                model: global.User,
                as: 'author',
                attributes: ['userId', 'nickname', 'level']
            }]
        });

        res.status(201).json({
            success: true,
            message: '댓글이 성공적으로 작성되었습니다.',
            comment: createdComment
        });

    } catch (error) {
        console.error('댓글 작성 오류:', error);
        res.status(500).json({
            success: false,
            message: '댓글 작성 중 오류가 발생했습니다.'
        });
    }
});

// 기존 posts.js 파일 마지막에 추가할 댓글 삭제 API

/**
 * 🗑️ 댓글 삭제 API
 * DELETE /api/posts/:postId/comments/:commentId
 */
router.delete('/:postId/comments/:commentId', async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    // 로그인 체크
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: '로그인이 필요합니다.'
      });
    }

    const userId = req.session.user.userId;

    // 댓글 존재 확인
    const comment = await global.Comment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '댓글을 찾을 수 없습니다.'
      });
    }

    // 댓글 작성자 권한 확인
    if (comment.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: '댓글 삭제 권한이 없습니다.'
      });
    }

    // 게시글 확인
    if (comment.postId !== parseInt(postId)) {
      return res.status(400).json({
        success: false,
        message: '잘못된 요청입니다.'
      });
    }

    // 대댓글이 있는지 확인
    const replies = await global.Comment.findAll({
      where: { parentId: commentId }
    });

    if (replies.length > 0) {
      // 대댓글이 있으면 내용만 삭제 처리 (soft delete)
      await comment.update({
        content: '삭제된 댓글입니다.',
        userId: null
      });

      res.json({
        success: true,
        message: '댓글이 삭제되었습니다.',
        type: 'soft_delete'
      });
    } else {
      // 대댓글이 없으면 완전 삭제
      await comment.destroy();

      res.json({
        success: true,
        message: '댓글이 삭제되었습니다.',
        type: 'hard_delete'
      });
    }

  } catch (error) {
    console.error('댓글 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '댓글 삭제 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 📊 댓글 좋아요 API (선택사항)
 * POST /api/posts/:postId/comments/:commentId/like
 */
router.post('/:postId/comments/:commentId/like', async (req, res) => {
  try {
    const { commentId } = req.params;

    // 로그인 체크
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: '로그인이 필요합니다.'
      });
    }

    // 댓글 존재 확인
    const comment = await global.Comment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: '댓글을 찾을 수 없습니다.'
      });
    }

    // 댓글 좋아요 증가 (간단 구현)
    // 실제로는 별도의 CommentLike 테이블을 만들어 중복 체크를 해야 합니다
    await comment.increment('likes');

    res.json({
      success: true,
      message: '댓글에 좋아요가 추가되었습니다.',
      likes: comment.likes + 1
    });

  } catch (error) {
    console.error('댓글 좋아요 오류:', error);
    res.status(500).json({
      success: false,
      message: '댓글 좋아요 처리 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;