import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const index = async (req, res) => {
    try {
        const pages = await prisma.page.findMany({
            where: { status: 1 },
            orderBy: { id: 'desc' }
        });

        const formatted = pages.map(item => {
            let dateStr = '';
            if (item.updatedAt) {
                const month = item.updatedAt.toLocaleString('en-US', { month: 'short' });
                const day = item.updatedAt.getDate().toString().padStart(2, '0');
                const year = item.updatedAt.getFullYear();
                dateStr = `${month} ${day}, ${year}`;
            }

            return {
                slug: item.slug,
                title: item.title,
                description: item.description,
                date: dateStr
            };
        });

        return res.json({
            result: 'success',
            pages: formatted
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
};

export const show = async (req, res) => {
    try {
        const { page } = req.params;
        const item = await prisma.page.findFirst({
            where: { slug: page, status: 1 }
        });

        if (!item) {
            return res.status(404).json({ error: 'Page not found' });
        }

        const formatted = {
            slug: item.slug,
            title: item.title,
            description: item.description,
            seo_title: item.seoTitle,
            seo_description: item.seoDescription,
            seo_keyword: item.seoKeyword,
            created_at: item.createdAt,
            updated_at: item.updatedAt
        };

        return res.json({
            result: 'success',
            page: formatted
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
};
