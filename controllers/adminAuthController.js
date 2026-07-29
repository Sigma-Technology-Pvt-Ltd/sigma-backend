import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'sigma_fallback_secret_key';

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ result: 'error', message: 'Email and password are required' });
        }

        // 1. Find user by email
        const user = await prisma.user.findFirst({
            where: { email: email }
        });

        if (!user) {
            return res.status(401).json({ result: 'error', message: 'Invalid credentials' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        
        if (!passwordMatch) {
            return res.status(401).json({ result: 'error', message: 'Invalid credentials' });
        }

        // 3. Issue JWT token
        const payload = {
            id: user.id,
            email: user.email,
            name: user.name
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

        return res.status(200).json({
            result: 'success',
            message: 'Login successful',
            token: token,
            user: payload
        });

    } catch (error) {
        console.error('Admin login error:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

export const logout = async (req, res) => {
    try {
        // Logout is handled client side by discarding the token
        return res.status(200).json({
            result: 'success',
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Admin logout error:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};
