import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

/**
 * POST /api/agent-auth/login
 * Agent login — checks isActive before issuing token.
 */
export const login = async (req, res) => {
    try {
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) {
            return res.status(500).json({ result: 'error', message: 'Internal server error: Authentication misconfigured' });
        }

        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ result: 'error', message: 'Email and password are required' });
        }

        const agent = await prisma.agent.findUnique({ where: { email } });

        if (!agent) {
            return res.status(401).json({ result: 'error', message: 'Invalid credentials' });
        }

        if (!agent.isActive) {
            return res.status(401).json({ result: 'error', message: 'Your account has been suspended. Please contact your administrator.' });
        }

        const passwordMatch = await bcrypt.compare(password, agent.password);
        if (!passwordMatch) {
            return res.status(401).json({ result: 'error', message: 'Invalid credentials' });
        }

        const payload = {
            id: agent.id,
            email: agent.email,
            name: agent.name,
            role: agent.role,
            type: 'agent',  // Distinguishes agent tokens from admin tokens
        };

        // Short-lived token (8h) — combined with isActive DB check provides effective session control
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

        return res.status(200).json({
            result: 'success',
            message: 'Login successful',
            token,
            agent: { id: agent.id, name: agent.name, email: agent.email, role: agent.role }
        });

    } catch (error) {
        console.error('Agent login error:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

/**
 * POST /api/agent-auth/logout
 * Logout is handled client-side by discarding the token.
 */
export const logout = async (req, res) => {
    return res.status(200).json({ result: 'success', message: 'Logout successful' });
};
