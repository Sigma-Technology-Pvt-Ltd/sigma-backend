# API Specification

## 1. Authentication
All routes below are wrapped in an `apikey` middleware group. They require the following header in every request:
```
apikey: G4DPpoM7Cj19BF1AssDT9A2ZBIifZPV6QxzftUv0u7SFpM9oNxf0yXSHf3GKsbI9
```

## 2. API Routes & Responses

> [!NOTE]
> **Image URL Format:** Whenever an endpoint returns an image (e.g., in Products or Blogs), the backend returns a full absolute URL including the domain (e.g., `https://example.com/frontend/images/products/image.webp`), not just a relative path or filename. This is constructed using Laravel's `asset()` helper function. For example, in the `Product` model:
> ```php
> public function getImageUrlAttribute($value) {
>     $imageUrl = null;
>     if ( ! is_null($this->image)) {
>         $directory = '/frontend/images/products/';
>         $imagePath = public_path() . "{$directory}" . $this->image;
>         if (file_exists($imagePath)) $imageUrl = asset("$directory" . $this->image);
>     }
>     return $imageUrl;
> }
> ```

### Associates
- **URL:** `GET /api/associates`
- **Controller/Method:** `App\Http\Controllers\Frontend\Associate\AssociateController@index`
- **Response Structure:**
  ```json
  [
    {
      "title": "Category Title",
      "description": "Category Description",
      "items": [
        {
          "title": "Associate Name",
          "links": "Link URL",
          "image": "Image URL"
        }
      ]
    }
  ]
  ```

### Sister Concern
- **URL:** `GET /api/sister-concern`
- **Controller/Method:** `App\Http\Controllers\Frontend\Concern\ConcernController@index`
- **Response Structure:**
  ```json
  [
    {
      "title": "Title",
      "image": "Image URL",
      "description": "HTML Content"
    }
  ]
  ```

### Testimonials
- **URL:** `GET /api/testimonials`
- **Controller/Method:** `App\Http\Controllers\Frontend\Testimonial\TestimonialController@index`
- **Response Structure:**
  ```json
  [
    {
      "name": "Full Name",
      "company": "Company Name",
      "position": "Position",
      "message": "Message Content",
      "image": "Image URL"
    }
  ]
  ```

### Banners
- **URL:** `GET /api/banners` (and `/api/banners/offer`)
- **Controller/Method:** `App\Http\Controllers\Frontend\Banner\BannerController@index/offer`
- **Response Structure:**
  ```json
  [
    {
      "title": "Title",
      "type": "Type",
      "link": "Link URL",
      "subtitle": "Subtitle",
      "image": "Image URL"
    }
  ]
  ```

### Blogs
- **URL:** `GET /api/blogs`
- **Controller/Method:** `App\Http\Controllers\Frontend\Blog\BlogController@index`
- **Pagination:** This route does NOT use Laravel's `->paginate()`. It uses `->get()` and returns a flat array. You can pass a `limit` query parameter (e.g., `?limit=5`) to restrict the number of results, otherwise it returns all active blogs.
- **Response Structure:** Flat array of objects (slug, title, summary, image, date) under the `"blogs"` key.
- **URL:** `GET /api/blogs/{blog}`
- **Response Structure:** Single object with extended details (category, description)
- **URL:** `GET /api/blogs/categories/{blog_category}`
- **Response Structure:** Blog category details with products count.

### Brands
- **URL:** `GET /api/brands`
- **Controller/Method:** `App\Http\Controllers\Frontend\Brand\BrandController@index`
- **Response Structure:** Array of objects (id, slug, title, icon, image)

### FAQs
- **URL:** `GET /api/faqs`
- **Controller/Method:** `App\Http\Controllers\Frontend\Faq\FaqController@index`
- **Response Structure:** 
  ```json
  [
    {
      "title": "Faq Type Title",
      "faqs": [
        {
          "question": "Question String",
          "answer": "Answer String"
        }
      ]
    }
  ]
  ```

### Contact Us
- **URL:** `POST /api/contact-us`
- **Controller/Method:** `App\Http\Controllers\Frontend\Contact\ContactController@store`
- **Request Parameters:** Expects `name`, `email`, `phone`, `subject`, `message` (standard contact form data).

### Categories
- **URL:** `GET /api/categories` (Home root categories)
- **URL:** `GET /api/categories/navigation/lists` (Nav categories)
- **URL:** `GET /api/category/{category}` (Show single category & product lists)
  - **Query String:** `?categories=id1,id2` (optional array of category IDs to filter products)
- **URL:** `GET /api/categories/{category}/list` (Subcategory list)
- **URL:** `GET /api/category/{category}/filter` (Category filter tree)
- **Response Structure:** Returns hierarchical categories (title, slug, link, icon, image, subCategory nested array)

### Products
- **URL:** `GET /api/products/{category}`
- **Pagination:** This listing route does NOT use Laravel's `->paginate()`. It uses `->get()` and returns a flat array of all products for the category under the `"products"` key. There is no `data/links/meta` wrapper.
- **URL:** `GET /api/products/{product}/show`
- **Response Structure (Single):**
  ```json
  {
    "slug": "slug",
    "title": "Title",
    "description": "Desc",
    "summary": "Summary",
    "image": "Image",
    "brand_name": "Brand",
    "price": "Price formatted",
    "sale_price": "Sale formatted",
    "category": "Cat Name",
    "warranty": "...",
    "specification": "...",
    "installation": "...",
    "images": [],
    "downloads": [],
    "stock": 10,
    "type": "Type string"
  }
  ```

### Product Enquiry
- **URL:** `POST /api/products/{product}`
- **Request Parameters:** `name`, `email`, `phone_number`, `remarks`

### Projects
> [!WARNING]
> **Broken Endpoint:** The routes are mapped to `App\Http\Controllers\Frontend\Project\ProjectController`, which attempts to query the `App\Models\Project` model. However, neither the `Project` model nor a `projects` database table exists in the provided SQL dump or codebase. This endpoint appears broken in the old backend.
- **URL:** `GET /api/projects`
- **URL:** `GET /api/projects/{project}`

### Services
> [!WARNING]
> **Broken Endpoint:** Similar to Projects, the routes are mapped to `App\Http\Controllers\Frontend\Service\ServiceController`, which attempts to query the `App\Models\Service` model. Neither the `Service` model nor a `services` database table exists in the provided SQL dump or codebase.
- **URL:** `GET /api/services`
- **URL:** `GET /api/services/{service}`

### Plugins
- **URL:** `GET /api/plugins`
- **Response Structure:** Array of objects (title, type, code, tag_type)

### Pages
- **URL:** `GET /api/pages`
- **URL:** `GET /api/pages/{page}`
- **Response Structure:** Single page (slug, title, description, seo details)

### Subscriber
- **URL:** `POST /api/subscriber`
- **Request Parameters:** `email`

### Downloads
- **URL:** `GET /api/download-image/{download_file}`

## 3. Database Schema

```sql
CREATE TABLE `associations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `slug` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `category_id` int(11) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `links` varchar(255) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `order` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `association_categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `slug` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `status` int(11) NOT NULL DEFAULT 0,
  `order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `description` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `banners` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `slug` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL,
  `links` varchar(255) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `subtitle` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `blogs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `slug` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `summary` longtext DEFAULT NULL,
  `description` longtext DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 0,
  `seo_title` longtext DEFAULT NULL,
  `seo_keyword` longtext DEFAULT NULL,
  `seo_description` longtext DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `blog_categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `slug` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `status` int(11) NOT NULL DEFAULT 0,
  `image` varchar(255) DEFAULT NULL,
  `description` longtext DEFAULT NULL,
  `seo_title` longtext DEFAULT NULL,
  `seo_keyword` longtext DEFAULT NULL,
  `seo_description` longtext DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `brands` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` int(11) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `description` longtext DEFAULT NULL,
  `seo_title` longtext DEFAULT NULL,
  `seo_description` longtext DEFAULT NULL,
  `seo_keyword` longtext DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `link` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `candidates` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `slug` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone_number` varchar(255) NOT NULL,
  `current_address` varchar(255) NOT NULL,
  `permanent_address` varchar(255) NOT NULL,
  `date_of_birth` varchar(255) NOT NULL,
  `gender` varchar(255) NOT NULL,
  `post_name` varchar(255) NOT NULL,
  `education` varchar(255) NOT NULL,
  `experience` varchar(255) NOT NULL,
  `resume` varchar(255) NOT NULL,
  `remarks` longtext DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `catalogues` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `slug` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `file` varchar(255) NOT NULL,
  `status` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `slug` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `parent_category` varchar(255) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `description` longtext DEFAULT NULL,
  `seo_title` longtext DEFAULT NULL,
  `seo_keywords` longtext DEFAULT NULL,
  `seo_description` longtext DEFAULT NULL,
  `navigation_status` int(11) NOT NULL DEFAULT 0,
  `home_status` int(11) NOT NULL DEFAULT 0,
  `status` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `subtitle` varchar(255) DEFAULT NULL,
  `pdf` varchar(255) DEFAULT NULL,
  `link` varchar(255) DEFAULT NULL,
  `order` int(11) NOT NULL DEFAULT 0,
  `icon` longtext DEFAULT NULL,
  `home_order` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `concerns` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `slug` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `description` longtext DEFAULT NULL,
  `links` varchar(255) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `order` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `contact_forms` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `slug` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) NOT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `message` longtext NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `download_files` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `slug` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `filename` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `faqs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `slug` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `question` longtext NOT NULL,
  `answer` longtext NOT NULL,
  `type_id` int(11) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone_number` varchar(255) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `faq_types` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `slug` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `status` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `images` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `slug` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `filename` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `job_lists` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `slug` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `salary` varchar(255) NOT NULL DEFAULT 'Negotiable',
  `deadline` varchar(255) NOT NULL,
  `education` varchar(255) DEFAULT NULL,
  `experience` varchar(255) DEFAULT NULL,
  `no_of_vacancy` varchar(255) DEFAULT NULL,
  `type` varchar(255) NOT NULL,
  `description` longtext DEFAULT NULL,
  `summary` longtext DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `order` int(11) NOT NULL DEFAULT 0,
  `seo_title` varchar(255) DEFAULT NULL,
  `seo_keyword` varchar(255) DEFAULT NULL,
  `seo_description` longtext DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `model_has_permissions` (
  `permission_id` bigint(20) UNSIGNED NOT NULL,
  `model_type` varchar(255) NOT NULL,
  `model_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `model_has_roles` (
  `role_id` bigint(20) UNSIGNED NOT NULL,
  `model_type` varchar(255) NOT NULL,
  `model_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `pages` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `slug` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` longtext DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 0,
  `summary` longtext DEFAULT NULL,
  `seo_title` longtext DEFAULT NULL,
  `seo_keyword` longtext DEFAULT NULL,
  `seo_description` longtext DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `password_resets` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `permissions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `guard_name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `plugins` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `slug` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `code` longtext NOT NULL,
  `type` varchar(255) NOT NULL,
  `tag_type` varchar(255) NOT NULL,
  `status` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `products` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `slug` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `brand_id` int(11) DEFAULT NULL,
  `category_id` int(11) NOT NULL,
  `summary` longtext DEFAULT NULL,
  `description` longtext NOT NULL,
  `warranty` longtext DEFAULT NULL,
  `specification` longtext DEFAULT NULL,
  `installation` longtext DEFAULT NULL,
  `download` longtext DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `seo_title` longtext DEFAULT NULL,
  `seo_description` longtext DEFAULT NULL,
  `seo_keyword` longtext DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `price` varchar(255) DEFAULT NULL,
  `sale_price` varchar(255) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL,
  `stock` varchar(255) DEFAULT NULL,
  `shops` longtext DEFAULT NULL,
  `daraz_link` text DEFAULT NULL,
  `hardware_pasal_link` text DEFAULT NULL,
  `mero_pasal_link` text DEFAULT NULL,
  `order` int(11) NOT NULL DEFAULT 0,
  `order_status` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `product_enquiries` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `slug` varchar(255) NOT NULL,
  `product_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone_number` varchar(255) NOT NULL,
  `remarks` longtext DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `product_reviews` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `slug` varchar(255) NOT NULL,
  `product_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `review` longtext NOT NULL,
  `rating` int(11) NOT NULL,
  `status` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `roles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `guard_name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `role_has_permissions` (
  `permission_id` bigint(20) UNSIGNED NOT NULL,
  `role_id` bigint(20) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `shops` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `slug` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `subscribers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `slug` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `status` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `testimonials` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `slug` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `position` varchar(255) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `message` longtext NOT NULL,
  `status` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `phone_number` varchar(255) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


```
