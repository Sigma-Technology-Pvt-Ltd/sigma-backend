import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { uploadToSupabase } from './supabaseStorage.js';

/**
 * Processes an uploaded image buffer, converts it to WEBP, and uploads to Supabase.
 * @param {Buffer} buffer - The image buffer from multer
 * @param {string} subfolder - The destination folder (e.g. 'categories', 'products')
 * @returns {Promise<string>} - The generated filename (e.g. 'uuid.webp')
 */
export const processAndSaveImage = async (buffer, subfolder) => {
    const filename = `${uuidv4()}.webp`;

    // Resize to safe maximum dimensions and convert to WebP
    const webpBuffer = await sharp(buffer)
        .resize({
            width: 1920,
            height: 1080,
            fit: 'inside',
            withoutEnlargement: true
        })
        .webp({ quality: 75, effort: 4 })
        .toBuffer();

    // Upload to Supabase bucket
    await uploadToSupabase(webpBuffer, subfolder, filename, 'image/webp');

    return filename;
};
