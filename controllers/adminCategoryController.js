import { PrismaClient } from '@prisma/client';
import { processAndSaveImage } from '../utils/imageProcessor.js';
import slugify from 'slugify';

const prisma = new PrismaClient();

// Get all categories
export const getAllCategories = async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return res.status(200).json({ result: 'success', data: categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Create a category
export const createCategory = async (req, res) => {
    try {
        const { title, seoTitle, seoDescription, parentCategory, status } = req.body;
        
        if (!title) {
            return res.status(400).json({ result: 'error', message: 'Title is required' });
        }

        let imageName = null;
        if (req.file) {
            // Process the uploaded image and get the UUID filename
            imageName = await processAndSaveImage(req.file.buffer, 'categories');
        }

        const slug = slugify(title, { lower: true, strict: true });

        const newCategory = await prisma.category.create({
            data: {
                title,
                slug,
                seoTitle: seoTitle || null,
                seoDescription: seoDescription || null,
                parentCategory: parentCategory ? String(parentCategory) : null,
                status: status !== undefined ? parseInt(status) : 1,
                image: imageName,
                userId: req.user ? parseInt(req.user.id) : 1,
            }
        });

        return res.status(201).json({ result: 'success', data: newCategory, message: 'Category created successfully' });
    } catch (error) {
        console.error('Error creating category:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Update a category
export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, seoTitle, seoDescription, parentCategory, status } = req.body;

        const categoryId = parseInt(id);
        const existingCategory = await prisma.category.findUnique({ where: { id: categoryId } });
        if (!existingCategory) {
            return res.status(404).json({ result: 'error', message: 'Category not found' });
        }

        let imageName = existingCategory.image;
        if (req.file) {
            // Process the newly uploaded image
            imageName = await processAndSaveImage(req.file.buffer, 'categories');
            // Optional: delete old image from disk here to save space
        }

        const slug = title ? slugify(title, { lower: true, strict: true }) : existingCategory.slug;

        const updatedCategory = await prisma.category.update({
            where: { id: categoryId },
            data: {
                title: title || existingCategory.title,
                slug: slug,
                seoTitle: seoTitle !== undefined ? seoTitle : existingCategory.seoTitle,
                seoDescription: seoDescription !== undefined ? seoDescription : existingCategory.seoDescription,
                parentCategory: parentCategory ? String(parentCategory) : null,
                status: status !== undefined ? parseInt(status) : existingCategory.status,
                image: imageName,
            }
        });

        return res.status(200).json({ result: 'success', data: updatedCategory, message: 'Category updated successfully' });
    } catch (error) {
        console.error('Error updating category:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Delete a category
export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const categoryId = parseInt(id);

        await prisma.category.delete({ where: { id: categoryId } });
        
        // Optional: Delete the category's image file from disk

        return res.status(200).json({ result: 'success', message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};
