import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { processAndSaveImage } from '../utils/imageProcessor.js';

const prisma = new PrismaClient();
const previewStore = new Map();

// Clean up old previews every 15 minutes to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of previewStore.entries()) {
        if (now - value.timestamp > 15 * 60 * 1000) {
            previewStore.delete(key);
        }
    }
}, 15 * 60 * 1000);

export const createPreview = async (req, res) => {
    try {
        const previewId = crypto.randomUUID();
        const previewData = { ...req.body };

        if (req.file) {
            try {
                const imageName = await processAndSaveImage(req.file.buffer, 'products');
                previewData.image = imageName;
            } catch (imgErr) {
                console.error('Failed to process preview image', imgErr);
            }
        } else if (req.body.existingImage) {
            previewData.image = req.body.existingImage;
        }

        if (req.body.downloads) {
            try {
                previewData.downloads = typeof req.body.downloads === 'string' ? JSON.parse(req.body.downloads) : req.body.downloads;
            } catch (dlErr) {
                console.error('Failed to parse preview downloads', dlErr);
            }
        }

        if (req.body.categoryId) {
            try {
                const cat = await prisma.category.findUnique({
                    where: { id: BigInt(req.body.categoryId) }
                });
                if (cat) previewData.category = cat.title;
            } catch (catErr) {
                console.error('Failed to fetch preview category', catErr);
            }
        }

        if (req.body.brandId) {
            try {
                const brand = await prisma.brand.findUnique({
                    where: { id: BigInt(req.body.brandId) }
                });
                if (brand) {
                    previewData.brand_name = brand.title;
                    previewData.brand_image = brand.image;
                }
            } catch (brandErr) {
                console.error('Failed to fetch preview brand', brandErr);
            }
        }

        previewStore.set(previewId, {
            data: previewData,
            timestamp: Date.now()
        });

        res.json({
            result: 'success',
            previewId: previewId
        });
    } catch (error) {
        console.error('Failed to create preview', error);
        res.status(500).json({ result: 'error', message: 'Failed to create preview' });
    }
};

export const getPreview = async (req, res) => {
    try {
        const { id } = req.params;
        const preview = previewStore.get(id);

        if (!preview) {
            return res.status(404).json({ result: 'error', message: 'Preview not found or expired' });
        }

        res.json({
            result: 'success',
            data: preview.data
        });
    } catch (error) {
        console.error('Failed to fetch preview', error);
        res.status(500).json({ result: 'error', message: 'Failed to fetch preview' });
    }
};
