import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Image folder mapping — matches Supabase bucket folder names
const FOLDER_MAP = {
    '/frontend/images/products/':       'products',
    '/frontend/images/blogs/':          'blogs',
    '/frontend/images/banners/':        'banners',
    '/frontend/images/careers/':        'careers',
    '/frontend/images/categories/':     'categories',
    '/frontend/images/blog_categories/':'blog_categories',
    '/frontend/images/testimonials/':   'testimonials',
    '/frontend/images/brands/':         'brands',
    '/frontend/pdf/':                   'documents',
};

export function getImageUrl(imagePath, directory) {
    if (!imagePath) return null;
    // Return URL through frontend domain — Supabase completely hidden
    // Vercel rewrites /images/* → Supabase in production
    // Backend proxy /images/* → Supabase in local dev
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const folder = FOLDER_MAP[directory] || 'products';
    return `${frontendUrl}/images/${folder}/${imagePath}`;
}

export function getNoImage() {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    return `${frontendUrl}/images/no-image.jpg`;
}

// Ensure BigInt is serialized correctly in JSON responses
BigInt.prototype.toJSON = function() {
    return this.toString();
}

export async function getApiCategories(items) {
    // Single query to get all active categories and avoid N+1 DB roundtrips
    const allCategories = await prisma.category.findMany({
        where: { status: 1 },
        orderBy: { order: 'asc' }
    });

    const categoryMap = new Map();
    for (const cat of allCategories) {
        const parentKey = cat.parentCategory ? String(cat.parentCategory) : 'root';
        if (!categoryMap.has(parentKey)) {
            categoryMap.set(parentKey, []);
        }
        categoryMap.get(parentKey).push(cat);
    }

    function buildSubCategories(parentId) {
        const children = categoryMap.get(String(parentId)) || [];
        return children.map(item => ({
            slug: item.slug,
            title: item.title,
            subtitle: item.subtitle,
            link: item.link,
            pdf: item.pdf ? getImageUrl(item.pdf, '/frontend/pdf/') : null,
            icon: item.icon,
            image: item.image ? getImageUrl(item.image, '/frontend/images/categories/') : '',
            order: item.order,
            subCategory: buildSubCategories(item.id)
        }));
    }

    const categories = [];
    for (const item of items) {
        categories.push({
            slug: item.slug,
            title: item.title,
            subtitle: item.subtitle,
            icon: item.icon,
            link: item.link,
            pdf: item.pdf ? getImageUrl(item.pdf, '/frontend/pdf/') : null,
            image: item.image ? getImageUrl(item.image, '/frontend/images/categories/') : '',
            subCategory: buildSubCategories(item.id)
        });
    }
    return categories;
}

export async function getApiCategory(category) {
    if (!category) return {};

    let subCategory = null;
    let subCategoryLink = null;
    let childCategory = null;
    let childCategoryLink = null;

    if (category.parentCategory) {
        const parent = await prisma.category.findUnique({
            where: { id: BigInt(category.parentCategory) }
        });
        
        if (parent) {
            if (parent.parentCategory) {
                const grandParent = await prisma.category.findUnique({
                    where: { id: BigInt(parent.parentCategory) }
                });
                if (grandParent) {
                    subCategory = grandParent.title;
                    subCategoryLink = grandParent.slug;
                    childCategory = parent.title;
                    childCategoryLink = parent.slug;
                }
            } else {
                subCategory = parent.title;
                subCategoryLink = parent.slug;
            }
        }
    }

    return {
        title: category.title,
        slug: category.slug,
        subtitle: category.subtitle,
        description: category.description,
        sub_category_link: subCategoryLink,
        sub_category: subCategory,
        link: category.link,
        child_category: childCategory,
        child_category_link: childCategoryLink,
        seo_title: category.seoTitle,
        seo_keyword: category.seoKeywords || category.seoKeyword,
        seo_description: category.seoDescription
    };
}

export async function getApiFilterSubCategories(categoryId, currentCategoryId) {
    const categoryList = await prisma.category.findMany({
        where: { parentCategory: categoryId.toString() },
        orderBy: { title: 'asc' }
    });

    const categories = [];
    for (const item of categoryList) {
        let checked = false;
        if (currentCategoryId) {
            if (currentCategoryId.toString() === item.id.toString()) {
                checked = true;
            } else if (currentCategoryId.toString() === item.parentCategory) {
                checked = true;
            }
        }

        categories.push({
            id: Number(item.id),
            slug: item.slug,
            title: item.title,
            checked: checked,
            image: item.image ? getImageUrl(item.image, '/frontend/images/categories/') : null,
            childCategory: await getApiFilterSubCategories(item.id, currentCategoryId)
        });
    }
    return categories;
}

export function getApiProducts(items) {
    return items.map(item => ({
        slug: item.slug,
        title: item.title,
        summary: item.summary,
        order_status: Number(item.orderStatus || 0),
        type: item.type,
        image: item.image ? getImageUrl(item.image, '/frontend/images/products/') : null,
        price: item.price ? Number(item.price).toFixed(2) : 0,
        sale_price: item.salePrice ? Number(item.salePrice).toFixed(2) : 0
    }));
}

export async function getApiProduct(item) {
    if (!item) return {};

    const brand = item.brandId ? await prisma.brand.findUnique({ where: { id: BigInt(item.brandId) } }) : null;
    const category = item.categoryId ? await prisma.category.findUnique({ where: { id: BigInt(item.categoryId) } }) : null;
    const images = await prisma.image.findMany({ where: { productId: Number(item.id) } });
    const downloads = await prisma.downloadFile.findMany({ where: { productId: Number(item.id) } });

    return {
        slug: item.slug,
        title: item.title,
        description: item.description,
        summary: item.summary,
        image: item.image ? getImageUrl(item.image, '/frontend/images/products/') : null,
        brand_name: brand ? brand.title : null,
        brand_image: brand && brand.image ? getImageUrl(brand.image, '/frontend/images/brands/') : null,
        brand_link: brand ? brand.link : null,
        price: Number(item.price) > 0 ? Number(item.price).toFixed(2) : '',
        sale_price: Number(item.salePrice) > 0 ? Number(item.salePrice).toFixed(2) : '',
        category: category ? category.title : '',
        brand: brand ? brand.title : '',
        warranty: item.warranty,
        specification: item.specification,
        installation: item.installation,
        images: images.map(img => ({
            id: Number(img.id),
            image: img.filename ? getImageUrl(img.filename, '/frontend/images/products/') : null,
            slug: img.slug
        })),
        downloads: downloads.map(dl => ({
            id: Number(dl.id),
            image: dl.filename ? getImageUrl(dl.filename, '/frontend/images/products/') : null,
            slug: dl.slug
        })),
        stock: Number(item.stock || 0),
        type: item.type,
        order_status: Number(item.orderStatus || 0),
        seo_title: item.seoTitle,
        seo_keyword: item.seoKeyword,
        seo_description: item.seoDescription,
        daraz_link: item.darazLink,
        hardware_pasal_link: item.hardwarePasalLink,
        mero_pasal_link: item.meroPasalLink
    };
}

export function getApiBlogs(blogs) {
    return blogs.map(blog => {
        let dateStr = '';
        if (blog.createdAt) {
            const month = blog.createdAt.toLocaleString('en-US', { month: 'short' });
            const day = blog.createdAt.getDate().toString().padStart(2, '0');
            const year = blog.createdAt.getFullYear();
            dateStr = `${day} ${month}, ${year}`; // 'd M, Y' e.g. 09 Jul, 2026 -> wait, PHP 'd M, Y' is '09 Jul, 2026'
        }
        return {
            slug: blog.slug,
            title: blog.title,
            summary: blog.summary,
            image: blog.image ? getImageUrl(blog.image, '/frontend/images/blogs/') : null,
            date: dateStr
        };
    });
}

export async function getApiBlog(blog) {
    if (!blog) return {};
    
    let dateStr = '';
    if (blog.createdAt) {
        const month = blog.createdAt.toLocaleString('en-US', { month: 'short' });
        const day = blog.createdAt.getDate().toString().padStart(2, '0');
        const year = blog.createdAt.getFullYear();
        dateStr = `${day} ${month}, ${year}`;
    }

    const category = blog.categoryId ? await prisma.blogCategory.findUnique({ where: { id: BigInt(blog.categoryId) } }) : null;

    return {
        slug: blog.slug,
        title: blog.title,
        summary: blog.summary,
        category: category ? category.title : null,
        category_slug: category ? category.slug : null,
        description: blog.description,
        image: blog.image ? getImageUrl(blog.image, '/frontend/images/blogs/') : getNoImage(),
        date: dateStr
    };
}

export function getApiBlogCategories(items) {
    return items.map(item => ({
        title: item.title,
        slug: item.slug
    }));
}

export async function getApiBlogCategory(item) {
    if (!item) return [];
    
    const productsCount = await prisma.blog.count({
        where: { categoryId: Number(item.id) }
    });

    return {
        title: item.title,
        slug: item.slug,
        products: productsCount
    };
}
