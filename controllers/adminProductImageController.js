import { PrismaClient } from '@prisma/client';
import { processAndSaveImage } from '../utils/imageProcessor.js';
import { deleteFromSupabase, getSupabasePublicUrl } from '../utils/supabaseStorage.js';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Get all gallery images for a specific product
export const getProductImages = async (req, res) => {
    try {
        const { id } = req.params;
        const productId = parseInt(id);

        if (isNaN(productId)) {
            return res.status(400).json({ result: 'error', message: 'Invalid product ID' });
        }

        const images = await prisma.image.findMany({
            where: { productId: productId },
            orderBy: { id: 'asc' }
        });

        const formatted = images.map(img => ({
            id: Number(img.id),
            productId: Number(img.productId),
            filename: img.filename,
            slug: img.slug,
            url: img.filename ? getSupabasePublicUrl('products', img.filename) : null,
            createdAt: img.createdAt
        }));

        return res.status(200).json({ result: 'success', data: formatted });
    } catch (error) {
        console.error('Error fetching product images:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Upload multiple gallery images for a product
export const uploadProductImages = async (req, res) => {
    try {
        const { id } = req.params;
        const productId = parseInt(id);

        if (isNaN(productId)) {
            return res.status(400).json({ result: 'error', message: 'Invalid product ID' });
        }

        const product = await prisma.product.findUnique({
            where: { id: productId }
        });

        if (!product) {
            return res.status(404).json({ result: 'error', message: 'Product not found' });
        }

        // Support both req.files (array) and req.file (single)
        const files = req.files && req.files.length > 0 
            ? req.files 
            : (req.file ? [req.file] : []);

        if (files.length === 0) {
            return res.status(400).json({ result: 'error', message: 'No images provided' });
        }

        const userId = req.user ? parseInt(req.user.id) : 1;
        const createdImages = [];

        for (const file of files) {
            // Process buffer with sharp to WebP & upload to Supabase
            const filename = await processAndSaveImage(file.buffer, 'products');
            const slug = uuidv4();

            const imageRecord = await prisma.image.create({
                data: {
                    productId: productId,
                    filename: filename,
                    slug: slug,
                    userId: userId,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });

            createdImages.push({
                id: Number(imageRecord.id),
                productId: Number(imageRecord.productId),
                filename: imageRecord.filename,
                slug: imageRecord.slug,
                url: getSupabasePublicUrl('products', filename)
            });
        }

        return res.status(201).json({
            result: 'success',
            data: createdImages,
            message: `${createdImages.length} image(s) uploaded successfully`
        });
    } catch (error) {
        console.error('Error uploading product images:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Delete a gallery image by image ID
export const deleteProductImage = async (req, res) => {
    try {
        const { imageId } = req.params;
        const id = parseInt(imageId);

        if (isNaN(id)) {
            return res.status(400).json({ result: 'error', message: 'Invalid image ID' });
        }

        const imageRecord = await prisma.image.findUnique({
            where: { id: id }
        });

        if (!imageRecord) {
            return res.status(404).json({ result: 'error', message: 'Image not found' });
        }

        // Delete file from Supabase storage
        if (imageRecord.filename) {
            try {
                await deleteFromSupabase('products', imageRecord.filename);
            } catch (storageErr) {
                console.warn('Could not delete file from Supabase storage:', storageErr);
            }
        }

        // Delete from database
        await prisma.image.delete({
            where: { id: id }
        });

        return res.status(200).json({
            result: 'success',
            message: 'Image deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting product image:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};
