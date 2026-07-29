import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const bucketName = process.env.SUPABASE_BUCKET || 'sigma-media';

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('[supabaseStorage] SUPABASE_URL or SUPABASE_SERVICE_KEY not set. Image uploads will fail.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Upload a file buffer to Supabase Storage
 * @param {Buffer} buffer - File buffer
 * @param {string} folder - Folder inside bucket (e.g. 'products', 'banners')
 * @param {string} filename - Filename to save as
 * @param {string} contentType - MIME type (default: 'image/webp')
 * @returns {Promise<string>} - filename (just the name, not full URL)
 */
export const uploadToSupabase = async (buffer, folder, filename, contentType = 'image/webp') => {
    const filePath = `${folder}/${filename}`;

    const { error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, buffer, {
            contentType,
            upsert: true, // overwrite if exists (safe for updates)
        });

    if (error) {
        throw new Error(`Supabase upload failed: ${error.message}`);
    }

    return filename;
};

/**
 * Get public URL for a file in Supabase Storage
 * @param {string} folder - Folder inside bucket (e.g. 'products')
 * @param {string} filename - Filename
 * @returns {string} - Full public URL
 */
export const getSupabasePublicUrl = (folder, filename) => {
    if (!filename) return null;
    const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(`${folder}/${filename}`);
    return data.publicUrl;
};

/**
 * Delete a file from Supabase Storage
 * @param {string} folder - Folder inside bucket
 * @param {string} filename - Filename to delete
 */
export const deleteFromSupabase = async (folder, filename) => {
    if (!filename) return;
    const { error } = await supabase.storage
        .from(bucketName)
        .remove([`${folder}/${filename}`]);
    if (error) {
        console.error(`[supabaseStorage] Delete failed for ${folder}/${filename}:`, error.message);
    }
};

export { bucketName, supabase };
