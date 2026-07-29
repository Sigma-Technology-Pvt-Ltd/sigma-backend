import { PrismaClient } from '@prisma/client';
import { processAndSaveImage } from '../utils/imageProcessor.js';
import slugify from 'slugify';

const prisma = new PrismaClient();

// Get all blog categories
export const getAllBlogCategories = async (req, res) => {
    try {
        const categories = await prisma.blogCategory.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return res.status(200).json({ result: 'success', data: categories });
    } catch (error) {
        console.error('Error fetching blog categories:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Create a blog category
export const createBlogCategory = async (req, res) => {
    try {
        const { title, description, status, seoTitle, seoKeyword, seoDescription } = req.body;
        
        if (!title) {
            return res.status(400).json({ result: 'error', message: 'Title is required' });
        }

        let imageName = null;
        if (req.file) {
            imageName = await processAndSaveImage(req.file.buffer, 'blog_categories');
        }

        const slug = slugify(title, { lower: true, strict: true });

        const newCategory = await prisma.blogCategory.create({
            data: {
                title,
                slug,
                description: description || null,
                seoTitle: seoTitle || null,
                seoKeyword: seoKeyword || null,
                seoDescription: seoDescription || null,
                status: status !== undefined ? parseInt(status) : 1,
                image: imageName,
                userId: req.user ? parseInt(req.user.id) : 1,
            }
        });

        return res.status(201).json({ result: 'success', data: newCategory, message: 'Blog category created successfully' });
    } catch (error) {
        console.error('Error creating blog category:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Update a blog category
export const updateBlogCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, status, seoTitle, seoKeyword, seoDescription } = req.body;

        const categoryId = parseInt(id);
        const existingCategory = await prisma.blogCategory.findUnique({ where: { id: categoryId } });
        if (!existingCategory) {
            return res.status(404).json({ result: 'error', message: 'Blog category not found' });
        }

        let imageName = existingCategory.image;
        if (req.file) {
            imageName = await processAndSaveImage(req.file.buffer, 'blog_categories');
        }

        const slug = title ? slugify(title, { lower: true, strict: true }) : existingCategory.slug;

        const updatedCategory = await prisma.blogCategory.update({
            where: { id: categoryId },
            data: {
                title: title || existingCategory.title,
                slug: slug,
                description: description !== undefined ? description : existingCategory.description,
                seoTitle: seoTitle !== undefined ? seoTitle : existingCategory.seoTitle,
                seoKeyword: seoKeyword !== undefined ? seoKeyword : existingCategory.seoKeyword,
                seoDescription: seoDescription !== undefined ? seoDescription : existingCategory.seoDescription,
                status: status !== undefined ? parseInt(status) : existingCategory.status,
                image: imageName,
            }
        });

        return res.status(200).json({ result: 'success', data: updatedCategory, message: 'Blog category updated successfully' });
    } catch (error) {
        console.error('Error updating blog category:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Delete a blog category
export const deleteBlogCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const categoryId = parseInt(id);

        await prisma.blogCategory.delete({ where: { id: categoryId } });
        
        return res.status(200).json({ result: 'success', message: 'Blog category deleted successfully' });
    } catch (error) {
        console.error('Error deleting blog category:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};
