import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const cat = await prisma.category.create({
        data: { slug: 'test-category', title: 'Test Category', userId: 1, status: 1, navigationStatus: 1, homeStatus: 1 }
    });
    const subcat = await prisma.category.create({
        data: { slug: 'test-subcategory', title: 'Test Subcategory', userId: 1, parentCategory: cat.id.toString(), status: 1 }
    });
    const brand = await prisma.brand.create({
        data: { slug: 'test-brand', title: 'Test Brand', userId: 1, status: 1 }
    });
    const prod = await prisma.product.create({
        data: { slug: 'test-product', title: 'Test Product', categoryId: Number(cat.id), brandId: Number(brand.id), price: "99.99", userId: 1, status: 1, description: 'Test description' }
    });
    const blogCat = await prisma.blogCategory.create({
        data: { slug: 'test-blog-cat', title: 'Test Blog Cat', userId: 1, status: 1 }
    });
    const blog = await prisma.blog.create({
        data: { slug: 'test-blog', title: 'Test Blog', categoryId: Number(blogCat.id), userId: 1, status: 1 }
    });
    console.log("Seeded data successfully!");
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
