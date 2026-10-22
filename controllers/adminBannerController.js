import { PrismaClient } from '@prisma/client';
import { processAndSaveImage } from '../utils/imageProcessor.js';
import slugify from 'slugify';
import cache from '../utils/cache.js';

const prisma = new PrismaClient();

// Get all banners
export const getAllBanners = async (req, res) => {
    try {
        const banners = await prisma.banner.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return res.status(200).json({ result: 'success', data: banners });
    } catch (error) {
        console.error('Error fetching banners:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Get single banner by ID
export const getBannerById = async (req, res) => {
    try {
        const { id } = req.params;
        const banner = await prisma.banner.findUnique({
            where: { id: parseInt(id) }
        });
        if (!banner) {
            return res.status(404).json({ result: 'error', message: 'Banner not found' });
        }
        return res.status(200).json({ result: 'success', data: banner });
    } catch (error) {
        console.error('Error fetching banner by ID:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Create a banner
export const createBanner = async (req, res) => {
    try {
        const { title, type, links, subtitle, status } = req.body;
        const files = req.files || (req.file ? [req.file] : []);
        
        let imageName = null;
        const mainImageFile = files.find(f => f.fieldname === 'image');
        if (mainImageFile) {
            imageName = await processAndSaveImage(mainImageFile.buffer, 'banners');
        }

        let finalSubtitle = subtitle || null;
        if (req.body.clusterConfig) {
            try {
                let config = typeof req.body.clusterConfig === 'string' 
                    ? JSON.parse(req.body.clusterConfig) 
                    : req.body.clusterConfig;
                
                const clusterFiles = files.filter(f => f.fieldname.startsWith('cluster_'));
                for (const cFile of clusterFiles) {
                    const slotIndex = parseInt(cFile.fieldname.replace('cluster_', ''), 10);
                    if (!isNaN(slotIndex) && config.images && config.images[slotIndex]) {
                        const savedFilename = await processAndSaveImage(cFile.buffer, 'banners');
                        config.images[slotIndex].image = savedFilename;
                    }
                }
                finalSubtitle = JSON.stringify(config);
            } catch (err) {
                console.warn('Failed parsing clusterConfig on create:', err);
            }
        }

        // Generate a fallback slug since it's required by the schema
        const baseSlug = title ? slugify(title, { lower: true, strict: true }) : 'banner';
        const slug = `${baseSlug}-${Date.now()}`;

        const newBanner = await prisma.banner.create({
            data: {
                title: title || null,
                slug,
                type: type || null,
                links: links || null,
                subtitle: finalSubtitle,
                status: status !== undefined ? parseInt(status) : 1,
                image: imageName,
                userId: req.user ? parseInt(req.user.id) : 1,
            }
        });

        cache.del('banners:*');
        return res.status(201).json({ result: 'success', data: newBanner, message: 'Banner created successfully' });
    } catch (error) {
        console.error('Error creating banner:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Update a banner
export const updateBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, type, links, subtitle, status } = req.body;
        const files = req.files || (req.file ? [req.file] : []);

        const bannerId = parseInt(id);
        const existingBanner = await prisma.banner.findUnique({ where: { id: bannerId } });
        if (!existingBanner) {
            return res.status(404).json({ result: 'error', message: 'Banner not found' });
        }

        let imageName = existingBanner.image;
        const mainImageFile = files.find(f => f.fieldname === 'image');
        if (mainImageFile) {
            imageName = await processAndSaveImage(mainImageFile.buffer, 'banners');
        }

        let finalSubtitle = subtitle !== undefined ? subtitle : existingBanner.subtitle;
        if (req.body.clusterConfig) {
            try {
                let config = typeof req.body.clusterConfig === 'string' 
                    ? JSON.parse(req.body.clusterConfig) 
                    : req.body.clusterConfig;
                
                const clusterFiles = files.filter(f => f.fieldname.startsWith('cluster_'));
                for (const cFile of clusterFiles) {
                    const slotIndex = parseInt(cFile.fieldname.replace('cluster_', ''), 10);
                    if (!isNaN(slotIndex) && config.images && config.images[slotIndex]) {
                        const savedFilename = await processAndSaveImage(cFile.buffer, 'banners');
                        config.images[slotIndex].image = savedFilename;
                    }
                }
                finalSubtitle = JSON.stringify(config);
            } catch (err) {
                console.warn('Failed parsing clusterConfig on update:', err);
            }
        }

        const slug = title ? slugify(title, { lower: true, strict: true }) : existingBanner.slug;

        const updatedBanner = await prisma.banner.update({
            where: { id: bannerId },
            data: {
                title: title !== undefined ? title : existingBanner.title,
                slug,
                type: type !== undefined ? type : existingBanner.type,
                links: links !== undefined ? links : existingBanner.links,
                subtitle: finalSubtitle,
                status: status !== undefined ? parseInt(status) : existingBanner.status,
                image: imageName,
            }
        });

        cache.del('banners:*');
        return res.status(200).json({ result: 'success', data: updatedBanner, message: 'Banner updated successfully' });
    } catch (error) {
        console.error('Error updating banner:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Delete a banner
export const deleteBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const bannerId = parseInt(id);

        await prisma.banner.delete({ where: { id: bannerId } });
        
        cache.del('banners:*');
        return res.status(200).json({ result: 'success', message: 'Banner deleted successfully' });
    } catch (error) {
        console.error('Error deleting banner:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};
