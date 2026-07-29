import { PrismaClient } from '@prisma/client';
import { processAndSaveImage } from '../utils/imageProcessor.js';
import slugify from 'slugify';

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

// Create a banner
export const createBanner = async (req, res) => {
    try {
        const { title, type, links, subtitle, status } = req.body;
        
        let imageName = null;
        if (req.file) {
            imageName = await processAndSaveImage(req.file.buffer, 'banners');
        }

        // Generate a fallback slug since it's required by the schema, although banners might not use it directly.
        const baseSlug = title ? slugify(title, { lower: true, strict: true }) : 'banner';
        const slug = `${baseSlug}-${Date.now()}`;

        const newBanner = await prisma.banner.create({
            data: {
                title: title || null,
                slug,
                type: type || null,
                links: links || null,
                subtitle: subtitle || null,
                status: status !== undefined ? parseInt(status) : 1,
                image: imageName,
                userId: req.user ? parseInt(req.user.id) : 1,
            }
        });

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

        const bannerId = parseInt(id);
        const existingBanner = await prisma.banner.findUnique({ where: { id: bannerId } });
        if (!existingBanner) {
            return res.status(404).json({ result: 'error', message: 'Banner not found' });
        }

        let imageName = existingBanner.image;
        if (req.file) {
            imageName = await processAndSaveImage(req.file.buffer, 'banners');
        }

        const slug = title ? slugify(title, { lower: true, strict: true }) : existingBanner.slug;

        const updatedBanner = await prisma.banner.update({
            where: { id: bannerId },
            data: {
                title: title !== undefined ? title : existingBanner.title,
                slug,
                type: type !== undefined ? type : existingBanner.type,
                links: links !== undefined ? links : existingBanner.links,
                subtitle: subtitle !== undefined ? subtitle : existingBanner.subtitle,
                status: status !== undefined ? parseInt(status) : existingBanner.status,
                image: imageName,
            }
        });

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
        
        return res.status(200).json({ result: 'success', message: 'Banner deleted successfully' });
    } catch (error) {
        console.error('Error deleting banner:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};
