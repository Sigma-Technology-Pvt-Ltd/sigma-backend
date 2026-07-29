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
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sigma Technologies API</title>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background-color: #0f172a;
                    color: #f8fafc;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                }
                .container {
                    text-align: center;
                    background: #1e293b;
                    padding: 3rem;
                    border-radius: 16px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                    border-top: 4px solid #3b82f6;
                    max-width: 600px;
                }
                h1 {
                    margin: 0 0 1rem;
                    font-size: 2.5rem;
                    background: linear-gradient(to right, #60a5fa, #a855f7);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                p {
                    font-size: 1.2rem;
                    color: #94a3b8;
                    margin-bottom: 2rem;
                }
                .status {
                    display: inline-block;
                    background: rgba(34, 197, 94, 0.1);
                    color: #4ade80;
                    padding: 0.5rem 1.2rem;
                    border-radius: 999px;
                    font-weight: bold;
                    border: 1px solid rgba(34, 197, 94, 0.2);
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Sigma Technologies API</h1>
                <p>The backend core is running smoothly and is ready to accept connections.</p>
                <div class="status">● System Online</div>
            </div>
        </body>
        </html>
    `);
});

// Routes
app.use('/images', imageRoutes);    // Image proxy — hides Supabase URL
app.use('/api/admin', adminRoutes);
app.use('/api', apiRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
