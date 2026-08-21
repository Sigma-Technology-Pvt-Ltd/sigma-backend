import express from 'express';
import { apiKeyMiddleware } from '../middleware/auth.js';
import * as associateController from '../controllers/associateController.js';
import * as concernController from '../controllers/concernController.js';
import * as testimonialController from '../controllers/testimonialController.js';
import * as bannerController from '../controllers/bannerController.js';
import * as brandController from '../controllers/brandController.js';
import * as faqController from '../controllers/faqController.js';
import * as pluginController from '../controllers/pluginController.js';
import * as pageController from '../controllers/pageController.js';
import { formLimiter } from '../server.js';

const router = express.Router();

router.use(apiKeyMiddleware);

// Phase A routes
router.get('/associates', associateController.index);
router.get('/sister-concern', concernController.index);
router.get('/testimonials', testimonialController.index);
router.get('/banners', bannerController.index);
router.get('/banners/offer', bannerController.offer);
router.get('/brands', brandController.index);
router.get('/faqs', faqController.index);
router.get('/plugins', pluginController.index);
router.get('/pages', pageController.index);
router.get('/pages/:page', pageController.show);

// Phase B routes
import * as categoryController from '../controllers/categoryController.js';
import * as productController from '../controllers/productController.js';
import * as blogController from '../controllers/blogController.js';
import * as enquiryController from '../controllers/enquiryController.js';
import * as contactController from '../controllers/contactController.js';
import * as subscriberController from '../controllers/subscriberController.js';

// Category
router.get('/categories', categoryController.index);
router.get('/categories/navigation/lists', categoryController.navigation);
router.get('/category/:category', categoryController.show);
router.get('/categories/:category/list', categoryController.categoryList);
router.get('/category/:category/filter', categoryController.filter);

// Product
router.get('/products/:category', productController.index);
router.get('/products/:product/show', productController.show);

// Product Enquiry
router.post('/products/:product', formLimiter, enquiryController.store);

// Blog
router.get('/blogs', blogController.index);
router.get('/blogs/:blog', blogController.show);
router.get('/blogs/categories/:blog_category', blogController.category);

// Phase C routes
router.post('/contact-us', formLimiter, contactController.store);
router.post('/subscriber', formLimiter, subscriberController.store);
router.get('/download-image/:download_file', productController.downloadImage);

export default router;
