import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getSitemap = async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            where: {
                status: 1
            },
            select: {
                slug: true,
                updatedAt: true
            },
            orderBy: { id: 'asc' }
        });

        const categories = await prisma.category.findMany({
            where: {
                status: 1
            },
            select: {
                slug: true,
                updatedAt: true
            },
            orderBy: { id: 'asc' }
        });

        let blogs = [];
        try {
            blogs = await prisma.blog.findMany({
                where: {
                    status: 1
                },
                select: {
                    slug: true,
                    updatedAt: true
                },
                orderBy: { id: 'asc' }
            });
        } catch (e) {}

        const staticPages = [
            { url: 'https://sigmatechnologies.com.np/', priority: '1.0', changefreq: 'daily' },
            { url: 'https://sigmatechnologies.com.np/products', priority: '0.9', changefreq: 'daily' },
            { url: 'https://sigmatechnologies.com.np/about-us', priority: '0.8', changefreq: 'weekly' },
            { url: 'https://sigmatechnologies.com.np/associations', priority: '0.7', changefreq: 'monthly' },
            { url: 'https://sigmatechnologies.com.np/sister-concern', priority: '0.7', changefreq: 'monthly' },
            { url: 'https://sigmatechnologies.com.np/contact-us', priority: '0.8', changefreq: 'monthly' },
            { url: 'https://sigmatechnologies.com.np/blogs', priority: '0.8', changefreq: 'weekly' },
            { url: 'https://sigmatechnologies.com.np/faqs', priority: '0.7', changefreq: 'weekly' },
            { url: 'https://sigmatechnologies.com.np/services', priority: '0.8', changefreq: 'monthly' },
            { url: 'https://sigmatechnologies.com.np/privacy-policy', priority: '0.5', changefreq: 'yearly' },
            { url: 'https://sigmatechnologies.com.np/terms-and-condition', priority: '0.5', changefreq: 'yearly' }
        ];

        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

        const escapeXmlLoc = (url) => {
            return encodeURI(url)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;');
        };

        for (const p of staticPages) {
            xml += `  <url>\n    <loc>${escapeXmlLoc(p.url)}</loc>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>\n`;
        }

        for (const c of categories) {
            if (!c.slug) continue;
            const lastMod = (c.updatedAt || c.updated_at) ? new Date(c.updatedAt || c.updated_at).toISOString().split('T')[0] : '2026-10-15';
            xml += `  <url>\n    <loc>${escapeXmlLoc(`https://sigmatechnologies.com.np/product-category/${c.slug}`)}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
        }

        for (const p of products) {
            if (!p.slug) continue;
            const lastMod = (p.updatedAt || p.updated_at) ? new Date(p.updatedAt || p.updated_at).toISOString().split('T')[0] : '2026-10-15';
            xml += `  <url>\n    <loc>${escapeXmlLoc(`https://sigmatechnologies.com.np/product/${p.slug}`)}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.85</priority>\n  </url>\n`;
        }

        for (const b of blogs) {
            if (!b.slug) continue;
            const lastMod = (b.updatedAt || b.updated_at) ? new Date(b.updatedAt || b.updated_at).toISOString().split('T')[0] : '2026-10-15';
            xml += `  <url>\n    <loc>${escapeXmlLoc(`https://sigmatechnologies.com.np/blogs/${b.slug}`)}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
        }

        xml += `</urlset>`;

        res.header('Content-Type', 'application/xml; charset=utf-8');
        res.header('Cache-Control', 'public, max-age=3600, s-maxage=86400');
        return res.status(200).send(xml);
    } catch (error) {
        console.error('[Sitemap Generation Error]:', error);
        return res.status(500).send('Error generating sitemap');
    }
};
