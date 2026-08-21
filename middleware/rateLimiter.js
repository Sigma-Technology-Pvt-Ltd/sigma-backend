import rateLimit from 'express-rate-limit';

// ─── Rate Limiters ──────────────────────────────────────────────────────────
// Login: 5 attempts per 15 minutes per IP — prevents brute-force
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { result: 'error', message: 'Too many login attempts. Please try again in 15 minutes.' }
});

// Public form submissions: 10 per hour per IP — prevents spam
export const formLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { result: 'error', message: 'Too many submissions. Please try again later.' }
});
