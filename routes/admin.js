import express from 'express';
import * as adminAuthController from '../controllers/adminAuthController.js';
import * as adminCategoryController from '../controllers/adminCategoryController.js';
import * as adminProductController from '../controllers/adminProductController.js';
import * as adminBannerController from '../controllers/adminBannerController.js';
import * as adminBlogCategoryController from '../controllers/adminBlogCategoryController.js';
import * as adminBlogController from '../controllers/adminBlogController.js';
import * as adminTestimonialController from '../controllers/adminTestimonialController.js';
import * as adminFaqController from '../controllers/adminFaqController.js';
import * as adminCareerController from '../controllers/adminCareerController.js';
import * as adminDownloadController from '../controllers/adminDownloadController.js';
import * as adminContactController from '../controllers/adminContactController.js';
import * as adminSubscriberController from '../controllers/adminSubscriberController.js';
import * as adminDashboardController from '../controllers/adminDashboardController.js';
import * as adminPreviewController from '../controllers/adminPreviewController.js';
import * as adminCleanupController from '../controllers/adminCleanupController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { upload, uploadDocument } from '../middleware/uploadMiddleware.js';
import { loginLimiter } from '../server.js';

const router = express.Router();

// Public admin routes
router.post('/login', loginLimiter, adminAuthController.login);
router.get('/preview/:id', adminPreviewController.getPreview);

// Protected admin routes
router.use(verifyToken);
router.post('/logout', adminAuthController.logout);

// Dashboard Routes
router.get('/dashboard-stats', adminDashboardController.getDashboardStats);

// Preview Routes
router.post('/preview', upload.single('image'), adminPreviewController.createPreview);

// Cleanup Routes (Test data removal)
router.post('/cleanup/search', adminCleanupController.searchCleanup);
router.post('/cleanup/delete', adminCleanupController.deleteCleanup);

// Category Routes
router.get('/categories', adminCategoryController.getAllCategories);
router.post('/categories', upload.single('image'), adminCategoryController.createCategory);
router.put('/categories/:id', upload.single('image'), adminCategoryController.updateCategory);
router.delete('/categories/:id', adminCategoryController.deleteCategory);

// Product Routes
router.get('/products', adminProductController.getAllProducts);
router.post('/products', upload.single('image'), adminProductController.createProduct);
router.put('/products/:id', upload.single('image'), adminProductController.updateProduct);
router.delete('/products/:id', adminProductController.deleteProduct);

// Banner Routes
router.get('/banners', adminBannerController.getAllBanners);
router.post('/banners', upload.single('image'), adminBannerController.createBanner);
router.put('/banners/:id', upload.single('image'), adminBannerController.updateBanner);
router.delete('/banners/:id', adminBannerController.deleteBanner);

// Blog Category Routes
router.get('/blog-categories', adminBlogCategoryController.getAllBlogCategories);
router.post('/blog-categories', upload.single('image'), adminBlogCategoryController.createBlogCategory);
router.put('/blog-categories/:id', upload.single('image'), adminBlogCategoryController.updateBlogCategory);
router.delete('/blog-categories/:id', adminBlogCategoryController.deleteBlogCategory);

// Blog Routes
router.get('/blogs', adminBlogController.getAllBlogs);
router.post('/blogs', upload.single('image'), adminBlogController.createBlog);
router.put('/blogs/:id', upload.single('image'), adminBlogController.updateBlog);
router.delete('/blogs/:id', adminBlogController.deleteBlog);

// Testimonial Routes
router.get('/testimonials', adminTestimonialController.getAllTestimonials);
router.post('/testimonials', upload.single('image'), adminTestimonialController.createTestimonial);
router.put('/testimonials/:id', upload.single('image'), adminTestimonialController.updateTestimonial);
router.delete('/testimonials/:id', adminTestimonialController.deleteTestimonial);

// FAQ Routes
router.get('/faqs/types', adminFaqController.getFaqTypes);
router.get('/faqs', adminFaqController.getAllFaqs);
router.post('/faqs', adminFaqController.createFaq);
router.put('/faqs/:id', adminFaqController.updateFaq);
router.delete('/faqs/:id', adminFaqController.deleteFaq);

// Career Routes
router.get('/careers', adminCareerController.getAllCareers);
router.post('/careers', upload.single('image'), adminCareerController.createCareer);
router.put('/careers/:id', upload.single('image'), adminCareerController.updateCareer);
router.delete('/careers/:id', adminCareerController.deleteCareer);

// Download Routes
router.get('/downloads', adminDownloadController.getAllDownloads);
router.post('/downloads', uploadDocument.single('file'), adminDownloadController.createDownload);
router.put('/downloads/:id', uploadDocument.single('file'), adminDownloadController.updateDownload);
router.delete('/downloads/:id', adminDownloadController.deleteDownload);

// Contact Routes
router.get('/contacts', adminContactController.getAllContacts);

// Subscriber Routes
router.get('/subscribers', adminSubscriberController.getAllSubscribers);

export default router;
