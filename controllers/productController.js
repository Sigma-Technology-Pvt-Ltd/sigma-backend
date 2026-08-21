import { PrismaClient } from '@prisma/client';
import { getApiProducts, getApiProduct } from '../utils/helpers.js';
import { getImageUrl } from '../utils/helpers.js';

const prisma = new PrismaClient();

export const index = async (req, res) => {
    try {
        const categorySlug = req.params.category;
        const categoryData = await prisma.category.findFirst({
            where: { slug: categorySlug }
        });

        if (!categoryData) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // The original Laravel controller ignores the category parameter entirely for index query, but route model binding enforces it exists.
        const productsData = await prisma.product.findMany({
            where: { status: 1 },
            orderBy: { order: 'asc' }
        });

        const products = getApiProducts(productsData);

        return res.json({
            result: 'success',
            products: products
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
};

export const show = async (req, res) => {
    try {
        const productSlug = req.params.product;
        const productData = await prisma.product.findFirst({
            where: { slug: productSlug }
        });

        if (!productData) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Fetch related products
        const relatedProductsData = await prisma.product.findMany({
            where: { 
                categoryId: productData.categoryId,
                status: 1,
                id: { not: productData.id }
            },
            take: 8
        });

        const products = getApiProducts(relatedProductsData);
        const product = await getApiProduct(productData);
        
        // Shops
        const shopsData = await prisma.shop.findMany({
            where: { status: 1 },
            orderBy: { id: 'asc' }
        });
        const shops = shopsData.map(item => ({
            website: item.website,
            title: item.title,
            image: item.image ? getImageUrl(item.image, '/frontend/images/shops/') : null
        }));

        return res.json({
            result: 'success',
            product: product,
            products: products,
            shops: shops
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
};

export const downloadImage = async (req, res) => {
    try {
        const fileSlug = req.params.download_file;
        const downloadFile = await prisma.downloadFile.findFirst({
            where: { slug: fileSlug }
        });

        if (!downloadFile) {
            return res.status(404).json({ result: 'error', message: 'Image download failed' });
        }

        const imageUrl = getImageUrl(downloadFile.filename, '/frontend/images/products/');
        if (!imageUrl) {
            return res.status(404).json({ result: 'error', message: 'Image download failed' });
        }

        const filename = downloadFile.filename.split('/').pop();

        // Proxy fetch the image
        const response = await fetch(imageUrl);
        if (!response.ok) {
            return res.status(404).json({ result: 'error', message: 'Image download failed' });
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = response.headers.get('content-type') || 'application/octet-stream';

        res.set({
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${filename}"`
        });

        return res.send(buffer);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ result: 'error', message: 'Server error' });
    }
};
