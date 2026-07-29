import { PrismaClient } from '@prisma/client';
import { getApiCategories, getApiCategory, getApiProducts, getApiFilterSubCategories } from '../utils/helpers.js';

const prisma = new PrismaClient();

export const index = async (req, res) => {
    try {
        const categoriesData = await prisma.category.findMany({
            where: { 
                parentCategory: null,
                navigationStatus: 1,
                status: 1 
            },
            orderBy: { homeOrder: 'asc' }
        });

        const categories = await getApiCategories(categoriesData);

        return res.json({
            result: 'success',
            categories: categories
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
};

export const navigation = async (req, res) => {
    try {
        const categoriesData = await prisma.category.findMany({
            where: { 
                parentCategory: null,
                homeStatus: 1,
                status: 1 
            },
            orderBy: { order: 'asc' }
        });

        const categories = await getApiCategories(categoriesData);

        return res.json({
            result: 'success',
            categories: categories
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
};

export const show = async (req, res) => {
    try {
        const categorySlug = req.params.category;
        const categoryData = await prisma.category.findFirst({
            where: { slug: categorySlug }
        });

        if (!categoryData) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Get subcategory IDs
        const subcategories = await prisma.category.findMany({
            where: { parentCategory: categoryData.id.toString() },
            select: { id: true }
        });
        const subcategoryIds = subcategories.map(c => Number(c.id));

        // Get child category IDs
        const stringSubcategoryIds = subcategoryIds.map(id => id.toString());
        let childCategoryIds = [];
        if (stringSubcategoryIds.length > 0) {
            const childCategories = await prisma.category.findMany({
                where: { parentCategory: { in: stringSubcategoryIds } },
                select: { id: true }
            });
            childCategoryIds = childCategories.map(c => Number(c.id));
        }

        let productList = [];
        if (req.query.categories) {
            const requestedCategoryIds = req.query.categories.split(',').map(id => Number(id));
            productList = await prisma.product.findMany({
                where: {
                    categoryId: { in: requestedCategoryIds },
                    status: 1
                },
                orderBy: { order: 'asc' }
            });
        } else {
            const allCategoryIds = [Number(categoryData.id), ...subcategoryIds, ...childCategoryIds];
            productList = await prisma.product.findMany({
                where: {
                    categoryId: { in: allCategoryIds },
                    status: 1
                },
                orderBy: { order: 'asc' }
            });
        }

        const products = getApiProducts(productList);
        const category = await getApiCategory(categoryData);

        return res.json({
            result: 'success',
            category: category,
            products: products
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
};

export const categoryList = async (req, res) => {
    try {
        const categorySlug = req.params.category;
        const categoryData = await prisma.category.findFirst({
            where: { slug: categorySlug }
        });

        if (!categoryData) {
            return res.status(404).json({ error: 'Category not found' });
        }

        const categoriesData = await prisma.category.findMany({
            where: { 
                parentCategory: categoryData.id.toString(),
                status: 1
            },
            orderBy: { order: 'asc' }
        });

        let categories = [];
        if (categoriesData.length > 0) {
            categories = await getApiCategories(categoriesData);
        }
        
        const category = await getApiCategory(categoryData);

        return res.json({
            result: 'success',
            categories: categories,
            category: category
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
};

export const filter = async (req, res) => {
    try {
        const categorySlug = req.params.category;
        const categoryData = await prisma.category.findFirst({
            where: { slug: categorySlug }
        });

        if (!categoryData) {
            return res.status(404).json({ error: 'Category not found' });
        }

        const categoriesData = await prisma.category.findMany({
            where: { parentCategory: null },
            orderBy: { order: 'asc' }
        });

        const categoryList = [];
        for (const item of categoriesData) {
            categoryList.push({
                id: Number(item.id),
                slug: item.slug,
                title: item.title,
                subtitle: item.subtitle,
                checked: categoryData.id.toString() === item.id.toString(),
                description: item.description,
                subCategory: await getApiFilterSubCategories(item.id, categoryData.id)
            });
        }

        return res.json({
            result: 'success',
            categories: categoryList
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
};
