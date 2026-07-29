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

    // Convert to webp with sharp
    const webpBuffer = await sharp(buffer)
        .webp({ quality: 80 })
        .toBuffer();

    // Upload to Supabase bucket
    await uploadToSupabase(webpBuffer, subfolder, filename, 'image/webp');

    return filename;
};
