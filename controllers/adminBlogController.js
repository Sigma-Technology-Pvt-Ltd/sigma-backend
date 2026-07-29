import { PrismaClient } from '@prisma/client';
import { processAndSaveImage } from '../utils/imageProcessor.js';
import slugify from 'slugify';

const prisma = new PrismaClient();

// Get all blogs
export const getAllBlogs = async (req, res) => {
    try {
        const blogs = await prisma.blog.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return res.status(200).json({ result: 'success', data: blogs });
    } catch (error) {
        console.error('Error fetching blogs:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Create a blog
export const createBlog = async (req, res) => {
    try {
        const { title, categoryId, summary, description, status, seoTitle, seoKeyword, seoDescription } = req.body;
        
        if (!title || !categoryId) {
            return res.status(400).json({ result: 'error', message: 'Title and Category are required' });
        }

        let imageName = null;
        if (req.file) {
            imageName = await processAndSaveImage(req.file.buffer, 'blogs');
        }

        const slug = slugify(title, { lower: true, strict: true });

        const newBlog = await prisma.blog.create({
            data: {
                title,
                slug,
                categoryId: parseInt(categoryId),
                summary: summary || null,
                description: description || null,
                seoTitle: seoTitle || null,
                seoKeyword: seoKeyword || null,
                seoDescription: seoDescription || null,
                status: status !== undefined ? parseInt(status) : 1,
                image: imageName,
                userId: req.user ? parseInt(req.user.id) : 1,
            }
        });

        return res.status(201).json({ result: 'success', data: newBlog, message: 'Blog created successfully' });
    } catch (error) {
        console.error('Error creating blog:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Update a blog
export const updateBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, categoryId, summary, description, status, seoTitle, seoKeyword, seoDescription } = req.body;

        const blogId = parseInt(id);
        const existingBlog = await prisma.blog.findUnique({ where: { id: blogId } });
        if (!existingBlog) {
            return res.status(404).json({ result: 'error', message: 'Blog not found' });
        }

        let imageName = existingBlog.image;
        if (req.file) {
            imageName = await processAndSaveImage(req.file.buffer, 'blogs');
        }

        const slug = title ? slugify(title, { lower: true, strict: true }) : existingBlog.slug;

        const updatedBlog = await prisma.blog.update({
            where: { id: blogId },
            data: {
                title: title || existingBlog.title,
                slug: slug,
                categoryId: categoryId ? parseInt(categoryId) : existingBlog.categoryId,
                summary: summary !== undefined ? summary : existingBlog.summary,
                description: description !== undefined ? description : existingBlog.description,
                seoTitle: seoTitle !== undefined ? seoTitle : existingBlog.seoTitle,
                seoKeyword: seoKeyword !== undefined ? seoKeyword : existingBlog.seoKeyword,
                seoDescription: seoDescription !== undefined ? seoDescription : existingBlog.seoDescription,
                status: status !== undefined ? parseInt(status) : existingBlog.status,
                image: imageName,
            }
        });

        return res.status(200).json({ result: 'success', data: updatedBlog, message: 'Blog updated successfully' });
    } catch (error) {
        console.error('Error updating blog:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Delete a blog
export const deleteBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const blogId = parseInt(id);

        await prisma.blog.delete({ where: { id: blogId } });
        
        return res.status(200).json({ result: 'success', message: 'Blog deleted successfully' });
    } catch (error) {
        console.error('Error deleting blog:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};
