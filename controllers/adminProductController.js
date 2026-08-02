import { PrismaClient } from '@prisma/client';
import { processAndSaveImage } from '../utils/imageProcessor.js';
import slugify from 'slugify';

const prisma = new PrismaClient();

// Get all products
export const getAllProducts = async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return res.status(200).json({ result: 'success', data: products });
    } catch (error) {
        console.error('Error fetching products:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Create a product
export const createProduct = async (req, res) => {
    try {
        const { title, categoryId, summary, description, status, seoTitle, seoDescription, price, salePrice, specification } = req.body;
        
        if (!title || !categoryId) {
            return res.status(400).json({ result: 'error', message: 'Title and Category are required' });
        }

        let imageName = null;
        if (req.file) {
            // Process the uploaded image and get the UUID filename
            imageName = await processAndSaveImage(req.file.buffer, 'products');
        }

        const slug = slugify(title, { lower: true, strict: true });

        const newProduct = await prisma.product.create({
            data: {
                title,
                slug,
                categoryId: parseInt(categoryId),
                summary: summary || null,
                description: description || '',
                status: status !== undefined ? parseInt(status) : 1,
                seoTitle: seoTitle || null,
                seoDescription: seoDescription || null,
                price: price || null,
                salePrice: salePrice || null,
                specification: specification || null,
                image: imageName,
                userId: req.user ? parseInt(req.user.id) : 1,
            }
        });

        return res.status(201).json({ result: 'success', data: newProduct, message: 'Product created successfully' });
    } catch (error) {
        console.error('Error creating product:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Update a product
export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, categoryId, summary, description, status, seoTitle, seoDescription, price, salePrice, specification } = req.body;

        const productId = parseInt(id);
        const existingProduct = await prisma.product.findUnique({ where: { id: productId } });
        if (!existingProduct) {
            return res.status(404).json({ result: 'error', message: 'Product not found' });
        }

        let imageName = existingProduct.image;
        if (req.file) {
            // Process the newly uploaded image
            imageName = await processAndSaveImage(req.file.buffer, 'products');
        }

        const slug = title ? slugify(title, { lower: true, strict: true }) : existingProduct.slug;

        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: {
                title: title || existingProduct.title,
                slug: slug,
                categoryId: categoryId ? parseInt(categoryId) : existingProduct.categoryId,
                summary: summary !== undefined ? summary : existingProduct.summary,
                description: description !== undefined ? description : existingProduct.description,
                status: status !== undefined ? parseInt(status) : existingProduct.status,
                seoTitle: seoTitle !== undefined ? seoTitle : existingProduct.seoTitle,
                seoDescription: seoDescription !== undefined ? seoDescription : existingProduct.seoDescription,
                price: price !== undefined ? price : existingProduct.price,
                salePrice: salePrice !== undefined ? salePrice : existingProduct.salePrice,
                specification: specification !== undefined ? specification : existingProduct.specification,
                image: imageName,
            }
        });

        return res.status(200).json({ result: 'success', data: updatedProduct, message: 'Product updated successfully' });
    } catch (error) {
        console.error('Error updating product:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Delete a product
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const productId = parseInt(id);

        await prisma.product.delete({ where: { id: productId } });
        
        return res.status(200).json({ result: 'success', message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};
