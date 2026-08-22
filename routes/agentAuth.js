import express from 'express';
import * as agentAuthController from '../controllers/agentAuthController.js';
import { loginLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Rate-limited login — prevents brute-force on agent accounts
router.post('/login', loginLimiter, agentAuthController.login);
router.post('/logout', agentAuthController.logout);

export default router;
