import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Search records to preview before deleting
export const searchCleanup = async (req, res) => {
    try {
        const { keyword, afterDate } = req.body;

        if (!keyword && !afterDate) {
            return res.status(400).json({ result: 'error', message: 'Provide keyword or afterDate to search.' });
        }

        const dateFilter = afterDate ? { createdAt: { gte: new Date(afterDate) } } : {};

        const keywordFilter = keyword
            ? { title: { contains: keyword, mode: 'insensitive' } }
            : {};

        const combinedFilter = { ...dateFilter, ...keywordFilter };

        const [products, blogs, careers, categories, blogCategories, banners, testimonials, faqs, tickets] = await Promise.all([
            prisma.product.findMany({ where: combinedFilter, select: { id: true, title: true, createdAt: true }, orderBy: { createdAt: 'desc' } }),
            prisma.blog.findMany({ where: combinedFilter, select: { id: true, title: true, createdAt: true }, orderBy: { createdAt: 'desc' } }),
            prisma.career.findMany({ where: combinedFilter, select: { id: true, title: true, createdAt: true }, orderBy: { createdAt: 'desc' } }),
            prisma.category.findMany({ where: combinedFilter, select: { id: true, title: true, createdAt: true }, orderBy: { createdAt: 'desc' } }),
            prisma.blogCategory.findMany({ where: combinedFilter, select: { id: true, title: true, createdAt: true }, orderBy: { createdAt: 'desc' } }),
            prisma.banner.findMany({ where: combinedFilter, select: { id: true, title: true, createdAt: true }, orderBy: { createdAt: 'desc' } }),
            prisma.testimonial.findMany({ where: { ...dateFilter, ...(keyword ? { fullName: { contains: keyword, mode: 'insensitive' } } : {}) }, select: { id: true, fullName: true, createdAt: true }, orderBy: { createdAt: 'desc' } }),
            prisma.faq.findMany({ where: { ...dateFilter, ...(keyword ? { question: { contains: keyword, mode: 'insensitive' } } : {}) }, select: { id: true, question: true, createdAt: true }, orderBy: { createdAt: 'desc' } }),
            prisma.ticket.findMany({
                where: {
                    ...dateFilter,
                    ...(keyword ? {
                        OR: [
                            { ticketNumber: { contains: keyword, mode: 'insensitive' } },
                            { customerName: { contains: keyword, mode: 'insensitive' } },
                            { customerEmail: { contains: keyword, mode: 'insensitive' } },
                            { productName: { contains: keyword, mode: 'insensitive' } },
                            { description: { contains: keyword, mode: 'insensitive' } },
                        ]
                    } : {})
                },
                select: { id: true, ticketNumber: true, customerName: true, createdAt: true },
                orderBy: { createdAt: 'desc' }
            }),
        ]);

        res.json({
            result: 'success',
            data: {
                products: products.map(r => ({ ...r, type: 'product', displayTitle: r.title })),
                blogs: blogs.map(r => ({ ...r, type: 'blog', displayTitle: r.title })),
                careers: careers.map(r => ({ ...r, type: 'career', displayTitle: r.title })),
                categories: categories.map(r => ({ ...r, type: 'category', displayTitle: r.title })),
                blogCategories: blogCategories.map(r => ({ ...r, type: 'blogCategory', displayTitle: r.title })),
                banners: banners.map(r => ({ ...r, type: 'banner', displayTitle: r.title })),
                testimonials: testimonials.map(r => ({ ...r, type: 'testimonial', displayTitle: r.fullName })),
                faqs: faqs.map(r => ({ ...r, type: 'faq', displayTitle: r.question })),
                tickets: tickets.map(r => ({ ...r, type: 'ticket', displayTitle: `${r.ticketNumber} — ${r.customerName}` })),
            }
        });
    } catch (error) {
        console.error('Cleanup search failed', error);
        res.status(500).json({ result: 'error', message: 'Failed to search records' });
    }
};

// Delete selected records by type and IDs
export const deleteCleanup = async (req, res) => {
    try {
        const { selections } = req.body;
        // selections: { products: [1,2,3], blogs: [4,5], careers: [], tickets: [], ... }

        if (!selections) {
            return res.status(400).json({ result: 'error', message: 'No selections provided.' });
        }

        const results = {};

        if (selections.products?.length) {
            await prisma.product.deleteMany({ where: { id: { in: selections.products.map(Number) } } });
            results.products = selections.products.length;
        }
        if (selections.blogs?.length) {
            await prisma.blog.deleteMany({ where: { id: { in: selections.blogs.map(Number) } } });
            results.blogs = selections.blogs.length;
        }
        if (selections.careers?.length) {
            await prisma.career.deleteMany({ where: { id: { in: selections.careers.map(Number) } } });
            results.careers = selections.careers.length;
        }
        if (selections.categories?.length) {
            await prisma.category.deleteMany({ where: { id: { in: selections.categories.map(Number) } } });
            results.categories = selections.categories.length;
        }
        if (selections.blogCategories?.length) {
            await prisma.blogCategory.deleteMany({ where: { id: { in: selections.blogCategories.map(Number) } } });
            results.blogCategories = selections.blogCategories.length;
        }
        if (selections.banners?.length) {
            await prisma.banner.deleteMany({ where: { id: { in: selections.banners.map(Number) } } });
            results.banners = selections.banners.length;
        }
        if (selections.testimonials?.length) {
            await prisma.testimonial.deleteMany({ where: { id: { in: selections.testimonials.map(Number) } } });
            results.testimonials = selections.testimonials.length;
        }
        if (selections.faqs?.length) {
            await prisma.faq.deleteMany({ where: { id: { in: selections.faqs.map(Number) } } });
            results.faqs = selections.faqs.length;
        }
        if (selections.tickets?.length) {
            await prisma.ticket.deleteMany({ where: { id: { in: selections.tickets.map(Number) } } });
            results.tickets = selections.tickets.length;
        }

        const totalDeleted = Object.values(results).reduce((a, b) => a + b, 0);
        res.json({ result: 'success', message: `Successfully deleted ${totalDeleted} records.`, deleted: results });
    } catch (error) {
        console.error('Cleanup delete failed', error);
        res.status(500).json({ result: 'error', message: 'Failed to delete records' });
    }
};
