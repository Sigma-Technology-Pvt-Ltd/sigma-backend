import express from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { supabase, bucketName } from '../utils/supabaseStorage.js';

const router = express.Router();

export const CACHE_DIR = process.env.MEDIA_CACHE_DIR || path.join(os.tmpdir(), 'sigma_media_cache');
if (!fs.existsSync(CACHE_DIR)) {
    try {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
    } catch (err) {
        console.warn('[sigmaMedia] Could not initialize cache directory:', err.message);
    }
}

const contentTypes = {
    webp: 'image/webp',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ico: 'image/x-icon'
};

function generateETag(buffer) {
    const hash = crypto.createHash('md5').update(buffer).digest('hex');
    return `"${buffer.length.toString(16)}-${hash.substring(0, 16)}"`;
}

export function getFromDiskCache(filename) {
    const cachePath = path.join(CACHE_DIR, filename);
    if (fs.existsSync(cachePath)) {
        try {
            return fs.readFileSync(cachePath);
        } catch {
            return null;
        }
    }
    return null;
}

export function saveToDiskCache(filename, buffer) {
    const cachePath = path.join(CACHE_DIR, filename);
    try {
        fs.writeFileSync(cachePath, buffer);
    } catch (err) {
        console.warn('[sigmaMedia] Disk cache write failed:', err.message);
    }
}

export function removeFromDiskCache(filename) {
    const cachePath = path.join(CACHE_DIR, filename);
    if (fs.existsSync(cachePath)) {
        try {
            fs.unlinkSync(cachePath);
        } catch {}
    }
}

function serveMediaResponse(req, res, filename, buffer, cacheHit = false) {
    const etag = generateETag(buffer);
    const ext = filename.split('.').pop().toLowerCase();
    const contentType = contentTypes[ext] || 'application/octet-stream';

    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.set('ETag', etag);
    res.set('X-Media-Cache', cacheHit ? 'HIT-DISK' : 'MISS-SUPABASE');

    // HTTP 304 conditional revalidation: saves 100% bandwidth on repeat views
    if (req.headers['if-none-match'] === etag) {
        return res.status(304).end();
    }

    return res.send(buffer);
}

/**
 * Image / File Proxy Route with Render /tmp/ local SSD disk cache & HTTP 304 validation
 * Handles GET /images/:folder/:filename and GET /api/media/:folder/:filename
 */
async function handleImageServing(req, res) {
    const { folder, filename } = req.params;

    if (!filename || filename === 'null' || filename === 'undefined' || filename.includes('..')) {
        return res.status(404).json({ message: 'Invalid or missing filename' });
    }

    // 1. FAST PATH: Check Render local SSD disk cache
    const cached = getFromDiskCache(filename);
    if (cached) {
        return serveMediaResponse(req, res, filename, cached, true);
    }

    // 2. Fallback check: check bundled public folder if available
    const localPublicPath = path.resolve('public', folder, filename);
    if (fs.existsSync(localPublicPath)) {
        try {
            const buffer = fs.readFileSync(localPublicPath);
            saveToDiskCache(filename, buffer);
            return serveMediaResponse(req, res, filename, buffer, false);
        } catch {}
    }

    // 3. COLD MISS: Download once from Supabase Storage
    try {
        const filePath = `${folder}/${filename}`;
        let fileRes = await supabase.storage.from(bucketName).download(filePath);

        // Fallback: if not in requested folder, try root or documents
        if (fileRes.error || !fileRes.data) {
            fileRes = await supabase.storage.from(bucketName).download(filename);
        }

        if (fileRes.error || !fileRes.data) {
            return res.status(404).json({ message: 'Image or document not found' });
        }

        const buffer = Buffer.from(await fileRes.data.arrayBuffer());
        saveToDiskCache(filename, buffer);

        return serveMediaResponse(req, res, filename, buffer, false);
    } catch (err) {
        console.error(`[imageProxy] Failed to serve ${folder}/${filename}:`, err.message);
        return res.status(500).json({ message: 'Failed to serve file' });
    }
}

router.get('/:folder/:filename', handleImageServing);

export default router;
