import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import { removeFromDiskCache } from '../routes/images.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const bucketName = process.env.SUPABASE_BUCKET || 'sigma-media';

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('[supabaseStorage] SUPABASE_URL or SUPABASE_SERVICE_KEY not set. Image uploads will fail.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const prisma = new PrismaClient();

/**
 * Upload a file buffer to Supabase Storage
 * @param {Buffer} buffer - File buffer
 * @param {string} folder - Folder inside bucket (e.g. 'products', 'banners')
 * @param {string} filename - Filename to save as
 * @param {string} contentType - MIME type (default: 'image/webp')
 * @returns {Promise<string>} - filename
 */
export const uploadToSupabase = async (buffer, folder, filename, contentType = 'image/webp') => {
    const filePath = `${folder}/${filename}`;

    const { error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, buffer, {
            contentType,
            upsert: true,
            cacheControl: '31536000',
        });

    if (error) {
        throw new Error(`Supabase upload failed: ${error.message}`);
    }

    return filename;
};

/**
 * Get public URL for a file in Supabase Storage
 */
export const getSupabasePublicUrl = (folder, filename) => {
    if (!filename) return null;
    const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(`${folder}/${filename}`);
    return data.publicUrl;
};

/**
 * Delete a file from Supabase Storage AND unlink from local disk cache
 * @param {string} folder - Folder inside bucket
 * @param {string} filename - Filename to delete
 */
export const deleteFromSupabase = async (folder, filename) => {
    if (!filename) return;
    const cleanFilename = filename.split('/').pop().split('?')[0];
    if (!cleanFilename) return;

    // Remove from local disk cache
    removeFromDiskCache(cleanFilename);

    // Remove from Supabase Storage
    try {
        const { error } = await supabase.storage
            .from(bucketName)
            .remove([`${folder}/${cleanFilename}`]);
        if (error) {
            console.error(`[supabaseStorage] Delete failed for ${folder}/${cleanFilename}:`, error.message);
        }
    } catch (err) {
        console.warn(`[supabaseStorage] Exception during delete:`, err.message);
    }
};

/**
 * Maintenance routine: Clean orphaned files from Supabase Storage
 * Enforces the 1 GB storage limit by scanning all Prisma tables and purging unreferenced assets.
 */
export const cleanSupabaseOrphans = async () => {
    console.log('[StorageCleanup] Starting database orphan audit for Sigma Technologies...');
    const activeFiles = new Set();

    const registerActive = (val) => {
        if (!val || typeof val !== 'string') return;
        const clean = val.split('/').pop().split('?')[0].trim();
        if (clean && clean.length > 3) activeFiles.add(clean);
    };

    try {
        // 1. Products (image, download)
        const products = await prisma.product.findMany({ select: { image: true, download: true } });
        products.forEach(p => {
            registerActive(p.image);
            registerActive(p.download);
        });

        // 2. Product Images (gallery)
        const productImages = await prisma.productImage.findMany({ select: { image: true } });
        productImages.forEach(pi => registerActive(pi.image));

        // 3. Categories (image)
        const categories = await prisma.category.findMany({ select: { image: true } });
        categories.forEach(c => registerActive(c.image));

        // 4. Banners (image)
        const banners = await prisma.banner.findMany({ select: { image: true } });
        banners.forEach(b => registerActive(b.image));

        // 5. Blogs (image)
        const blogs = await prisma.blog.findMany({ select: { image: true } });
        blogs.forEach(b => registerActive(b.image));

        // 6. Brands (image)
        const brands = await prisma.brand.findMany({ select: { image: true } });
        brands.forEach(b => registerActive(b.image));

        // 7. Associates (image)
        const associates = await prisma.associate.findMany({ select: { image: true } });
        associates.forEach(a => registerActive(a.image));

        // 8. Concerns (image)
        const concerns = await prisma.concern.findMany({ select: { image: true } });
        concerns.forEach(c => registerActive(c.image));

        // 9. Testimonials (image)
        const testimonials = await prisma.testimonial.findMany({ select: { image: true } });
        testimonials.forEach(t => registerActive(t.image));
    } catch (dbErr) {
        console.error('[StorageCleanup] DB query error during orphan scan:', dbErr.message);
        throw new Error('Database query failed during orphan audit');
    }

    const folders = ['products', 'categories', 'banners', 'blogs', 'brands', 'associations', 'concerns', 'testimonials', 'documents'];
    const report = {
        activeFilesFound: activeFiles.size,
        purgedCount: 0,
        purgedFiles: [],
        errors: []
    };

    for (const folder of folders) {
        try {
            const { data: files, error } = await supabase.storage.from(bucketName).list(folder, { limit: 1000 });
            if (error) {
                report.errors.push(`Error listing ${folder}: ${error.message}`);
                continue;
            }

            const orphans = (files || [])
                .filter(f => f.name && !f.name.startsWith('.') && !activeFiles.has(f.name))
                .map(f => `${folder}/${f.name}`);

            if (orphans.length > 0) {
                const { error: removeErr } = await supabase.storage.from(bucketName).remove(orphans);
                if (removeErr) {
                    report.errors.push(`Error purging from ${folder}: ${removeErr.message}`);
                } else {
                    report.purgedCount += orphans.length;
                    report.purgedFiles.push(...orphans);
                    orphans.forEach(p => removeFromDiskCache(p.split('/').pop()));
                }
            }
        } catch (err) {
            report.errors.push(`Exception on ${folder}: ${err.message}`);
        }
    }

    console.log('[StorageCleanup] Sigma orphan audit completed:', report);
    return report;
};

export { bucketName, supabase };
