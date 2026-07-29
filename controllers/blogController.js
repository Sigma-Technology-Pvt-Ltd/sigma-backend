import { PrismaClient } from '@prisma/client';
import { getApiBlogs, getApiBlog, getApiBlogCategories, getApiBlogCategory } from '../utils/helpers.js';

const prisma = new PrismaClient();

export const index = async (req, res) => {
    try {
        const limit = req.query.limit ? Number(req.query.limit) : undefined;
        const blogsData = await prisma.blog.findMany({
            where: { status: 1 },
            orderBy: { id: 'desc' },
            take: limit
        });

        const blogs = getApiBlogs(blogsData);

        return res.json({
            result: 'success',
            blogs: blogs
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
};

export const show = async (req, res) => {
    try {
        const blogSlug = req.params.blog;
        const blogData = await prisma.blog.findFirst({
            where: { slug: blogSlug }
        });

        if (!blogData) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        const relatedBlogsData = await prisma.blog.findMany({
            where: { 
                status: 1,
                categoryId: blogData.categoryId
            },
            orderBy: { id: 'desc' },
            take: 5
        });

        const categoriesData = await prisma.blogCategory.findMany({
            where: { status: 1 },
            orderBy: { id: 'desc' }
        });

        const categories = getApiBlogCategories(categoriesData);
        const blogs = getApiBlogs(relatedBlogsData);
        const blog = await getApiBlog(blogData);

        return res.json({
            result: 'success',
            blog: blog,
            blogs: blogs,
            categories: categories
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
};

export const category = async (req, res) => {
    try {
        const categorySlug = req.params.blog_category;
        const categoryData = await prisma.blogCategory.findFirst({
            where: { slug: categorySlug }
        });

        if (!categoryData) {
            return res.status(404).json({ error: 'Blog category not found' });
        }

        const blogsData = await prisma.blog.findMany({
            where: { 
                status: 1,
                categoryId: Number(categoryData.id)
            },
            orderBy: { id: 'desc' }
        });

        const blogs = getApiBlogs(blogsData);
        const category = await getApiBlogCategory(categoryData);

        return res.json({
            result: 'success',
            blogs: blogs,
            category: category
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Server error' });
    }
};
