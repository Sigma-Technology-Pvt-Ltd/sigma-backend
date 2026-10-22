import { PrismaClient } from '@prisma/client';
import { getApiProducts, getApiProduct } from '../utils/helpers.js';
import { getImageUrl } from '../utils/helpers.js';
import cache from '../utils/cache.js';

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
        const cacheKey = `product:${productSlug}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            return res.json(cached);
        }

        const productData = await prisma.product.findFirst({
            where: { slug: productSlug }
        });

        if (!productData) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Parallelize related products, full product details, and shops queries
        const [relatedProductsData, product, shopsData] = await Promise.all([
            prisma.product.findMany({
                where: { 
                    categoryId: productData.categoryId,
                    status: 1,
                    id: { not: productData.id }
                },
                take: 8
            }),
            getApiProduct(productData),
            prisma.shop.findMany({
                where: { status: 1 },
                orderBy: { id: 'asc' }
            })
        ]);

        const products = getApiProducts(relatedProductsData);
        
        const shops = shopsData.map(item => ({
            website: item.website,
            title: item.title,
            image: item.image ? getImageUrl(item.image, '/frontend/images/shops/') : null
        }));

        const responseData = {
            result: 'success',
            product: product,
            products: products,
            shops: shops
        };

        // Cache for 10 minutes (600s)
        cache.set(cacheKey, responseData, 600);

        return res.json(responseData);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
};

import { supabase, bucketName } from '../utils/supabaseStorage.js';

export const downloadImage = async (req, res) => {
    try {
        const fileParam = req.params.download_file;
        let downloadFile = await prisma.downloadFile.findFirst({
            where: { slug: fileParam }
        });

        if (!downloadFile) {
            const numericId = parseInt(fileParam);
            if (!isNaN(numericId)) {
                downloadFile = await prisma.downloadFile.findUnique({
                    where: { id: BigInt(numericId) }
                });
                if (!downloadFile) {
                    downloadFile = await prisma.downloadFile.findFirst({
                        where: { productId: numericId }
                    });
                }
            }
        }

        if (!downloadFile || !downloadFile.filename) {
            return res.status(404).json({ result: 'error', message: 'Download file not found' });
        }

        const filename = downloadFile.filename;
        const isPdf = filename.toLowerCase().endsWith('.pdf');

        // Fetch directly from Supabase Storage across documents/products/downloads
        let fileRes = null;
        const candidateFolders = ['documents', 'products', 'downloads', ''];
        for (const f of candidateFolders) {
            const path = f ? `${f}/${filename}` : filename;
            const attempt = await supabase.storage.from(bucketName).download(path);
            if (!attempt.error && attempt.data) {
                fileRes = attempt;
                break;
            }
        }

        if (!fileRes || !fileRes.data) {
            return res.status(404).json({ result: 'error', message: 'File not available on storage server' });
        }

        const arrayBuffer = await fileRes.data.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const ext = filename.split('.').pop().toLowerCase();
        const contentTypes = {
            pdf: 'application/pdf',
            doc: 'application/msword',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            png: 'image/png',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            webp: 'image/webp'
        };
        const contentType = contentTypes[ext] || (isPdf ? 'application/pdf' : 'application/octet-stream');

        // Determine a clean, human-readable download filename with product name
        let productTitle = '';
        if (downloadFile.productId) {
            try {
                const prod = await prisma.product.findUnique({
                    where: { id: BigInt(downloadFile.productId) },
                    select: { title: true }
                });
                if (prod && prod.title) {
                    productTitle = prod.title.trim();
                }
            } catch (e) {}
        }

        let docTitle = downloadFile.title || downloadFile.originalFilename || '';
        if (docTitle.toLowerCase().endsWith('.pdf')) {
            docTitle = docTitle.substring(0, docTitle.length - 4);
        }

        let outName = '';
        if (productTitle && docTitle) {
            outName = `${productTitle} - ${docTitle}`;
        } else if (productTitle) {
            outName = `${productTitle} - Product Catalog`;
        } else if (docTitle) {
            outName = docTitle;
        } else {
            outName = 'Sigma - Product Catalog';
        }

        // Sanitize outName for safe filenames across all operating systems
        outName = outName.replace(/[<>:"/\\|?*]+/g, ' ').replace(/\s+/g, ' ').trim();
        if (contentType.includes('pdf') && !outName.toLowerCase().endsWith('.pdf')) {
            outName += '.pdf';
        } else if (!contentType.includes('pdf') && ext && !outName.toLowerCase().endsWith(`.${ext}`)) {
            outName += `.${ext}`;
        }

        res.set({
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${outName.replace(/"/g, '')}"; filename*=UTF-8''${encodeURIComponent(outName)}`
        });

        return res.send(buffer);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ result: 'error', message: 'Server error' });
    }
};
