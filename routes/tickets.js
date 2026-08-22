import express from 'express';
import * as ticketController from '../controllers/ticketController.js';
import { verifyAgentToken } from '../middleware/agentAuthMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { formLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// ─── Public Route ─────────────────────────────────────────────────────────────
router.get('/products', ticketController.getPublicProducts);

// Rate-limited + multi-image upload
router.post(
    '/',
    formLimiter,
    upload.array('images', 10),
    ticketController.createTicket
);

// ─── Agent-Protected Routes ───────────────────────────────────────────────────
router.use(verifyAgentToken);

router.get('/', ticketController.getTickets);
router.get('/:id', ticketController.getTicket);
router.patch('/:id/pick', ticketController.pickTicket);
router.patch('/:id/status', ticketController.updateStatus);
router.post('/:id/remarks', ticketController.addRemark);

export default router;
