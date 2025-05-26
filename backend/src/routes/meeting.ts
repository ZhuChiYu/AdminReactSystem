import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    code: 0,
    message: '会议管理功能开发中...',
    data: { records: [], total: 0, current: 1, size: 10, pages: 0 },
    timestamp: Date.now(),
    path: req.path,
  });
});

export default router;
