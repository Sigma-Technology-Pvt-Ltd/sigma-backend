import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';
import adminRoutes from './routes/admin.js';
import imageRoutes from './routes/images.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL,
    'http://localhost:5173',
    'http://localhost:3001'
].filter(Boolean);
app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));
app.use(express.json());

// Root route for health check / confirmation
app.get('/', (req, res) => {
    res.json({ message: 'Sigma Technologies Backend API is running 🚀', status: 'online' });
});

// Routes
app.use('/images', imageRoutes);    // Image proxy — hides Supabase URL
app.use('/api/admin', adminRoutes);
app.use('/api', apiRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
