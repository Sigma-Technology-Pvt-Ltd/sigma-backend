import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sigma_fallback_secret_key';

export const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ result: 'error', message: 'Unauthorized: No token provided' });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ result: 'error', message: 'Unauthorized: Token missing' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Attach user payload to request
        
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ result: 'error', message: 'Unauthorized: Token expired' });
        }
        return res.status(401).json({ result: 'error', message: 'Unauthorized: Invalid token' });
    }
};
