export const apiKeyMiddleware = (req, res, next) => {
    const apiKey = req.headers['apikey'];
    
    if (!apiKey || apiKey !== process.env.API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    next();
};
