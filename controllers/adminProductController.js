import { PrismaClient } from '@prisma/client';
import { processAndSaveImage } from '../utils/imageProcessor.js';
import slugify from 'slugify';
import cache from '../utils/cache.js';

const prisma = new PrismaClient();

// Invalidate caches related to products and categories
const clearProductCaches = () => {
    cache.del('category:*');
    cache.del('categories:*');
    cache.del('product:*');
};

// Get all products
export const getAllProducts = async (req, res) => {
    try {
        const { categoryId } = req.query;
        const whereClause = categoryId ? { categoryId: parseInt(categoryId) } : {};

        const products = await prisma.product.findMany({
            where: whereClause,
            orderBy: [
                { order: 'asc' },
                { id: 'asc' }
            ]
        });
        return res.status(200).json({ result: 'success', data: products });
    } catch (error) {
        console.error('Error fetching products:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Reorder products (bulk update sequence)
export const reorderProducts = async (req, res) => {
    try {
        const { items } = req.body;
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ result: 'error', message: 'Items array is required ({ items: [{ id, order }] })' });
        }

        // Perform transactional update for all provided product orders
        await prisma.$transaction(
            items.map((item, index) =>
                prisma.product.update({
                    where: { id: parseInt(item.id) },
                    data: {
                        order: item.order !== undefined && item.order !== null ? parseInt(item.order) : (index + 1),
                        updatedAt: new Date()
                    }
                })
            )
        );

        // Clear cached frontend responses
        clearProductCaches();

        return res.status(200).json({ result: 'success', message: 'Product order updated successfully' });
    } catch (error) {
        console.error('Error reordering products:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Create a product
export const createProduct = async (req, res) => {
    try {
        const { title, categoryId, summary, description, status, seoTitle, seoDescription, price, salePrice, specification, type, orderStatus, order } = req.body;
        
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
                type: type || null,
                orderStatus: orderStatus !== undefined ? parseInt(orderStatus) : 0,
                order: order !== undefined && order !== '' ? parseInt(order) : 0,
                image: imageName,
                userId: req.user ? parseInt(req.user.id) : 1,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        });

        clearProductCaches();

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
        const { title, categoryId, summary, description, status, seoTitle, seoDescription, price, salePrice, specification, type, orderStatus, order } = req.body;

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
                type: type !== undefined ? (type || null) : existingProduct.type,
                orderStatus: orderStatus !== undefined ? parseInt(orderStatus) : existingProduct.orderStatus,
                order: order !== undefined && order !== '' ? parseInt(order) : existingProduct.order,
                image: imageName,
                updatedAt: new Date(),
            }
        });

        clearProductCaches();

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
        
        clearProductCaches();

        return res.status(200).json({ result: 'success', message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};
