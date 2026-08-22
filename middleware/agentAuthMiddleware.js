import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Agent auth middleware — verifies JWT and checks isActive status in DB.
 * Used on all protected ClaimDesk (agent-facing) routes.
 * The DB isActive check ensures that if an admin suspends an agent mid-session,
 * their next request is immediately rejected (Option A from the plan).
 */
export const verifyAgentToken = async (req, res, next) => {
    try {
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) {
            return res.status(500).json({ result: 'error', message: 'Internal server error: Authentication misconfigured' });
        }

        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ result: 'error', message: 'Unauthorized: No token provided' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ result: 'error', message: 'Unauthorized: Token missing' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        // Ensure this is an agent token (not an admin token)
        if (decoded.type !== 'agent') {
            return res.status(403).json({ result: 'error', message: 'Forbidden: Not an agent token' });
        }

        // DB check — ensures suspended agents are blocked immediately
        const agent = await prisma.agent.findUnique({
            where: { id: decoded.id },
            select: { id: true, name: true, email: true, role: true, isActive: true }
        });

        if (!agent) {
            return res.status(401).json({ result: 'error', message: 'Unauthorized: Agent account not found' });
        }

        if (!agent.isActive) {
            return res.status(401).json({ result: 'error', message: 'Unauthorized: Account suspended. Please contact your administrator.' });
        }

        req.agent = agent;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ result: 'error', message: 'Unauthorized: Token expired' });
        }
        return res.status(401).json({ result: 'error', message: 'Unauthorized: Invalid token' });
    }
};
