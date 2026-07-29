import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("=== CLEARING TEST DATA ===");

    const dr = await prisma.downloadFile.deleteMany({ where: { slug: { startsWith: 'test-download-file' } } });
    console.log(`Deleted ${dr.count} test download files`);

    const er = await prisma.productEnquiry.deleteMany({ where: { email: 'test@example.com' } });
    console.log(`Deleted ${er.count} test product enquiries`);

    const cr = await prisma.contactForm.deleteMany({ where: { email: 'jane@example.com' } });
    const cr2 = await prisma.contactForm.deleteMany({ where: { email: 'john@example.com' } });
    const cr3 = await prisma.contactForm.deleteMany({ where: { name: 'John Doe' } });
    console.log(`Deleted ${cr.count + cr2.count + cr3.count} test contact forms`);

    const sr = await prisma.subscriber.deleteMany({ where: { email: 'john@example.com' } });
    console.log(`Deleted ${sr.count} test subscribers`);

    const pr = await prisma.product.deleteMany({ where: { slug: 'test-product' } });
    console.log(`Deleted ${pr.count} test products`);

    const br = await prisma.brand.deleteMany({ where: { slug: 'test-brand' } });
    console.log(`Deleted ${br.count} test brands`);

    const blr = await prisma.blog.deleteMany({ where: { slug: 'test-blog' } });
    console.log(`Deleted ${blr.count} test blogs`);

    const bcr = await prisma.blogCategory.deleteMany({ where: { slug: 'test-blog-cat' } });
    console.log(`Deleted ${bcr.count} test blog categories`);

    const subcr = await prisma.category.deleteMany({ where: { slug: 'test-subcategory' } });
    console.log(`Deleted ${subcr.count} test subcategories`);

    const catr = await prisma.category.deleteMany({ where: { slug: 'test-category' } });
    console.log(`Deleted ${catr.count} test categories`);

    console.log("\n=== VERIFYING TABLES ARE EMPTY ===");
    console.log(`downloadFile count: ${await prisma.downloadFile.count()}`);
    console.log(`productEnquiry count: ${await prisma.productEnquiry.count()}`);
    console.log(`contactForm count: ${await prisma.contactForm.count()}`);
    console.log(`subscriber count: ${await prisma.subscriber.count()}`);
    console.log(`product count: ${await prisma.product.count()}`);
    console.log(`brand count: ${await prisma.brand.count()}`);
    console.log(`blog count: ${await prisma.blog.count()}`);
    console.log(`blogCategory count: ${await prisma.blogCategory.count()}`);
    console.log(`category count: ${await prisma.category.count()}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
