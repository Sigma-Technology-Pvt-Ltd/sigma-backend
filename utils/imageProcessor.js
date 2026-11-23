import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { uploadToSupabase } from './supabaseStorage.js';
import { saveToDiskCache } from '../routes/images.js';

const SIZING_PRESETS = {
    brands: { width: 400, height: 400, quality: 85 },
    logos: { width: 400, height: 400, quality: 85 },
    categories: { width: 600, height: 600, quality: 80 },
    testimonials: { width: 400, height: 400, quality: 80 },
    products: { width: 1200, height: 1200, quality: 80 },
    blogs: { width: 1200, height: 800, quality: 80 },
    concerns: { width: 600, height: 400, quality: 80 },
    associations: { width: 400, height: 250, quality: 85 },
    banners: { width: 1600, height: 900, quality: 80 },
    default: { width: 1200, height: 1200, quality: 80 }
};

/**
 * Processes an uploaded image buffer with context-aware sizing presets,
 * converts to WEBP, immediately pre-caches to Render SSD disk cache,
 * and uploads to Supabase Storage.
 * 
 * @param {Buffer} buffer - The image buffer from multer
 * @param {string} subfolder - The destination folder (e.g. 'categories', 'products')
 * @returns {Promise<string>} - The generated filename (e.g. 'uuid.webp')
 */
export const processAndSaveImage = async (buffer, subfolder = 'products') => {
    const filename = `${uuidv4()}.webp`;
    const preset = SIZING_PRESETS[subfolder] || SIZING_PRESETS.default;

    // Resize to context dimensions, strip EXIF metadata, and convert to WebP
    const webpBuffer = await sharp(buffer)
        .rotate() // Auto-orient based on EXIF and strip metadata
        .resize({
            width: preset.width,
            height: preset.height,
            fit: 'inside',
            withoutEnlargement: true
        })
        .webp({ quality: preset.quality, effort: 4 })
        .toBuffer();

    // 1. Immediately pre-cache to Render local SSD disk cache
    saveToDiskCache(filename, webpBuffer);

    // 2. Upload to Supabase bucket
    await uploadToSupabase(webpBuffer, subfolder, filename, 'image/webp');

    return filename;
};
