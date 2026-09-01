import { PrismaClient } from '@prisma/client';
import { getImageUrl } from '../utils/helpers.js';
import cache from '../utils/cache.js';

const prisma = new PrismaClient();

const fetchBanners = async (res, isOffer) => {
    const cacheKey = isOffer ? 'banners:offer' : 'banners:index';
    try {
        const cached = cache.get(cacheKey);
        if (cached) {
            return res.json(cached);
        }

        const whereClause = { status: 1 };
        if (isOffer) {
            whereClause.type = { in: ['Side Offer Banner', 'Middle Offer Banner'] };
        } else {
            whereClause.type = { in: ['Left Banner Design', 'Middle Banner Design', 'Bottom Banner Design'] };
        }

        const banners = await prisma.banner.findMany({
            where: whereClause,
            orderBy: { id: 'desc' }
        });

        const formatted = banners.map(item => ({
            title: item.title,
            type: item.type,
            link: item.links,
            subtitle: item.subtitle,
            image: getImageUrl(item.image, '/frontend/images/banners/')
        }));

        const responseData = {
            result: 'success',
            banners: formatted
        };

        cache.set(cacheKey, responseData, 600);
        return res.json(responseData);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
};

export const index = async (req, res) => {
    return fetchBanners(res, false);
};

export const offer = async (req, res) => {
    return fetchBanners(res, true);
};
