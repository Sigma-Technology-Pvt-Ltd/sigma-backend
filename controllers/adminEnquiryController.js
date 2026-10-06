import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all product enquiries enriched with product & category info
export const getAllEnquiries = async (req, res) => {
    try {
        const enquiries = await prisma.productEnquiry.findMany({
            orderBy: { createdAt: 'desc' }
        });

        // Collect product IDs
        const productIds = [...new Set(enquiries.map(e => e.productId).filter(Boolean))];
        
        // Fetch matching products
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, title: true, slug: true, price: true, salePrice: true, categoryId: true, image: true }
        });
        const productMap = new Map(products.map(p => [Number(p.id), p]));

        // Collect category IDs
        const categoryIds = [...new Set(products.map(p => p.categoryId).filter(Boolean))];
        const categories = await prisma.category.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, title: true, slug: true }
        });
        const categoryMap = new Map(categories.map(c => [Number(c.id), c]));

        const enriched = enquiries.map(e => {
            const prod = productMap.get(e.productId) || null;
            const cat = prod && prod.categoryId ? categoryMap.get(prod.categoryId) || null : null;
            return {
                id: Number(e.id),
                slug: e.slug,
                name: e.name,
                email: e.email,
                phoneNumber: e.phoneNumber,
                remarks: e.remarks,
                createdAt: e.createdAt,
                productId: e.productId,
                productTitle: prod ? prod.title : 'General Product',
                productSlug: prod ? prod.slug : null,
                productPrice: prod ? (prod.price || prod.salePrice || 0) : 0,
                productImage: prod ? prod.image : null,
                categoryId: prod ? prod.categoryId : null,
                categoryTitle: cat ? cat.title : 'Uncategorized'
            };
        });

        return res.status(200).json({ result: 'success', data: enriched });
    } catch (error) {
        console.error('Error fetching enquiries:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Get single enquiry with related category products for quotation building
export const getEnquiryById = async (req, res) => {
    try {
        const { id } = req.params;
        const enquiry = await prisma.productEnquiry.findUnique({
            where: { id: BigInt(id) }
        });

        if (!enquiry) {
            return res.status(404).json({ result: 'error', message: 'Enquiry not found' });
        }

        let product = null;
        let relatedProducts = [];
        let category = null;

        if (enquiry.productId) {
            product = await prisma.product.findUnique({
                where: { id: BigInt(enquiry.productId) },
                select: { id: true, title: true, slug: true, price: true, salePrice: true, categoryId: true, image: true, summary: true }
            });

            if (product && product.categoryId) {
                category = await prisma.category.findUnique({
                    where: { id: BigInt(product.categoryId) },
                    select: { id: true, title: true, slug: true }
                });

                // Fetch other products in same category for instant selection in quotation
                relatedProducts = await prisma.product.findMany({
                    where: { 
                        categoryId: product.categoryId,
                        status: 1
                    },
                    select: { id: true, title: true, slug: true, price: true, salePrice: true, image: true },
                    orderBy: { title: 'asc' }
                });
            }
        }

        return res.status(200).json({
            result: 'success',
            data: {
                id: Number(enquiry.id),
                slug: enquiry.slug,
                name: enquiry.name,
                email: enquiry.email,
                phoneNumber: enquiry.phoneNumber,
                remarks: enquiry.remarks,
                createdAt: enquiry.createdAt,
                product: product ? {
                    id: Number(product.id),
                    title: product.title,
                    slug: product.slug,
                    price: product.price,
                    salePrice: product.salePrice,
                    image: product.image,
                    summary: product.summary,
                    categoryId: product.categoryId
                } : null,
                category: category ? {
                    id: Number(category.id),
                    title: category.title,
                    slug: category.slug
                } : null,
                relatedProducts: relatedProducts.map(p => ({
                    id: Number(p.id),
                    title: p.title,
                    slug: p.slug,
                    price: p.price,
                    salePrice: p.salePrice,
                    image: p.image
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching single enquiry:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};

// Delete an enquiry
export const deleteEnquiry = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.productEnquiry.delete({
            where: { id: BigInt(id) }
        });
        return res.status(200).json({ result: 'success', message: 'Enquiry deleted successfully' });
    } catch (error) {
        console.error('Error deleting enquiry:', error);
        return res.status(500).json({ result: 'error', message: 'Internal server error' });
    }
};
