import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);
const BUCKET = process.env.SUPABASE_BUCKET || 'sigma-media';

/**
 * Image Proxy Route
 * GET /images/:folder/:filename
 * 
 * Fetches image from Supabase Storage and serves it through our backend.
 * This hides the Supabase URL — clients only see our domain.
 * 
 * e.g. https://api.yourdomain.com/images/products/uuid.webp
 */
router.get('/:folder/:filename', async (req, res) => {
    const { folder, filename } = req.params;

    try {
        // Download file from Supabase
        const { data, error } = await supabase.storage
            .from(BUCKET)
            .download(`${folder}/${filename}`);

        if (error || !data) {
            return res.status(404).json({ message: 'Image not found' });
        }

        // Determine content type from extension
        const ext = filename.split('.').pop().toLowerCase();
        const contentTypes = {
            webp: 'image/webp',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            svg: 'image/svg+xml',
            pdf: 'application/pdf',
        };
        const contentType = contentTypes[ext] || 'application/octet-stream';

        // Cache for 7 days (images don't change)
        res.set('Content-Type', contentType);
        res.set('Cache-Control', 'public, max-age=604800, immutable');

        // Convert Blob to Buffer and send
        const buffer = Buffer.from(await data.arrayBuffer());
        return res.send(buffer);

    } catch (err) {
        console.error(`[imageProxy] Failed to serve ${folder}/${filename}:`, err.message);
        return res.status(500).json({ message: 'Failed to serve image' });
    }
});

export default router;
