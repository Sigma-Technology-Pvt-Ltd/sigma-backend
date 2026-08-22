import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);
const BUCKET = process.env.SUPABASE_BUCKET || 'sigma-media';

/**
 * Image / File Proxy Route
 * GET /images/:folder/:filename
 * 
 * Fetches file from Supabase Storage with fallback folder search
 * and serves it through our backend domain.
 */
router.get('/:folder/:filename', async (req, res) => {
    const { folder, filename } = req.params;

    try {
        // Try requested folder first
        let fileRes = await supabase.storage.from(BUCKET).download(`${folder}/${filename}`);

        // If not found, try fallback folders
        if (fileRes.error || !fileRes.data) {
            const fallbackFolders = ['products', 'documents', 'downloads', 'blogs', 'brands', 'banners', 'concerns', 'associations', 'testimonials', 'ticket-media', ''];
            for (const f of fallbackFolders) {
                if (f === folder) continue;
                const path = f ? `${f}/${filename}` : filename;
                const attempt = await supabase.storage.from(BUCKET).download(path);
                if (!attempt.error && attempt.data) {
                    fileRes = attempt;
                    break;
                }
            }
        }

        if (fileRes.error || !fileRes.data) {
            return res.status(404).json({ message: 'Image or document not found' });
        }

        const data = fileRes.data;
        const ext = filename.split('.').pop().toLowerCase();
        const contentTypes = {
            webp: 'image/webp',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            svg: 'image/svg+xml',
            pdf: 'application/pdf',
            doc: 'application/msword',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };
        const contentType = contentTypes[ext] || 'application/octet-stream';

        res.set('Content-Type', contentType);
        res.set('Cache-Control', 'public, max-age=604800, immutable');

        const buffer = Buffer.from(await data.arrayBuffer());
        return res.send(buffer);

    } catch (err) {
        console.error(`[imageProxy] Failed to serve ${folder}/${filename}:`, err.message);
        return res.status(500).json({ message: 'Failed to serve file' });
    }
});

export default router;
