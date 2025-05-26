import { Router } from 'express';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    code: 0,
    message: '系统运行正常',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    timestamp: Date.now(),
    path: req.path,
  });
});

export default router;
