const fs = require('fs');

const extraModels = `
model Blog {
  id              BigInt    @id @default(autoincrement())
  slug            String
  userId          Int       @map("user_id")
  categoryId      Int       @map("category_id")
  title           String
  summary         String?   @db.Text
  description     String?   @db.Text
  image           String?
  status          Int       @default(0)
  seoTitle        String?   @map("seo_title") @db.Text
  seoKeyword      String?   @map("seo_keyword") @db.Text
  seoDescription  String?   @map("seo_description") @db.Text
  createdAt       DateTime? @map("created_at")
  updatedAt       DateTime? @map("updated_at")

  @@map("blogs")
}

model BlogCategory {
  id              BigInt    @id @default(autoincrement())
  slug            String
  userId          Int       @map("user_id")
  title           String
  status          Int       @default(0)
  image           String?
  description     String?   @db.Text
  seoTitle        String?   @map("seo_title") @db.Text
  seoKeyword      String?   @map("seo_keyword") @db.Text
  seoDescription  String?   @map("seo_description") @db.Text
  createdAt       DateTime? @map("created_at")
  updatedAt       DateTime? @map("updated_at")

  @@map("blog_categories")
}

model Candidate {
  id               BigInt    @id @default(autoincrement())
  slug             String
  name             String
  email            String
  phoneNumber      String    @map("phone_number")
  currentAddress   String    @map("current_address")
  permanentAddress String    @map("permanent_address")
  dateOfBirth      String    @map("date_of_birth")
  gender           String
  postName         String    @map("post_name")
  education        String
  experience       String
  resume           String
  remarks          String?   @db.Text
  createdAt        DateTime? @map("created_at")
  updatedAt        DateTime? @map("updated_at")

  @@map("candidates")
}

model Catalogue {
  id        BigInt    @id @default(autoincrement())
  slug      String
  userId    Int       @map("user_id")
  title     String
  image     String?
  file      String
  status    Int       @default(0)
  createdAt DateTime? @map("created_at")
  updatedAt DateTime? @map("updated_at")

  @@map("catalogues")
}

model Category {
  id               BigInt    @id @default(autoincrement())
  slug             String
  userId           Int       @map("user_id")
  title            String
  parentCategory   String?   @map("parent_category")
  image            String?
  description      String?   @db.Text
  seoTitle         String?   @map("seo_title") @db.Text
  seoKeywords      String?   @map("seo_keywords") @db.Text
  seoDescription   String?   @map("seo_description") @db.Text
  navigationStatus Int       @default(0) @map("navigation_status")
  homeStatus       Int       @default(0) @map("home_status")
  status           Int       @default(0)
  createdAt        DateTime? @map("created_at")
  updatedAt        DateTime? @map("updated_at")
  subtitle         String?
  pdf              String?
  link             String?
  order            Int       @default(0)
  icon             String?   @db.Text
  homeOrder        Int       @default(0) @map("home_order")

  @@map("categories")
}

model ContactForm {
  id        BigInt    @id @default(autoincrement())
  slug      String
  name      String
  email     String
  phone     String
  subject   String?
  message   String    @db.Text
  createdAt DateTime? @map("created_at")
  updatedAt DateTime? @map("updated_at")

  @@map("contact_forms")
}

model DownloadFile {
  id        BigInt    @id @default(autoincrement())
  slug      String
  userId    Int       @map("user_id")
  productId Int       @map("product_id")
  filename  String?
  createdAt DateTime? @map("created_at")
  updatedAt DateTime? @map("updated_at")

  @@map("download_files")
}

model FailedJob {
  id         BigInt    @id @default(autoincrement())
  uuid       String
  connection String    @db.Text
  queue      String    @db.Text
  payload    String    @db.Text
  exception  String    @db.Text
  failedAt   DateTime  @default(now()) @map("failed_at")

  @@map("failed_jobs")
}

model Image {
  id        BigInt    @id @default(autoincrement())
  slug      String
  userId    Int       @map("user_id")
  productId Int       @map("product_id")
  filename  String?
  createdAt DateTime? @map("created_at")
  updatedAt DateTime? @map("updated_at")

  @@map("images")
}

model JobList {
  id             BigInt    @id @default(autoincrement())
  slug           String
  title          String
  userId         Int       @map("user_id")
  salary         String    @default("Negotiable")
  deadline       String
  education      String?
  experience     String?
  noOfVacancy    String?   @map("no_of_vacancy")
  type           String
  description    String?   @db.Text
  summary        String?   @db.Text
  image          String?
  order          Int       @default(0)
  seoTitle       String?   @map("seo_title")
  seoKeyword     String?   @map("seo_keyword")
  seoDescription String?   @map("seo_description") @db.Text
  status         Int       @default(0)
  createdAt      DateTime? @map("created_at")
  updatedAt      DateTime? @map("updated_at")

  @@map("job_lists")
}

model Migration {
  id        Int    @id @default(autoincrement())
  migration String
  batch     Int

  @@map("migrations")
}

model ModelHasPermission {
  permissionId BigInt @map("permission_id")
  modelType    String @map("model_type")
  modelId      BigInt @map("model_id")

  @@id([permissionId, modelId, modelType])
  @@map("model_has_permissions")
}

model ModelHasRole {
  roleId    BigInt @map("role_id")
  modelType String @map("model_type")
  modelId   BigInt @map("model_id")

  @@id([roleId, modelId, modelType])
  @@map("model_has_roles")
}

model PasswordReset {
  email     String    @id
  token     String
  createdAt DateTime? @map("created_at")

  @@map("password_resets")
}

model Permission {
  id        BigInt    @id @default(autoincrement())
  name      String
  guardName String    @map("guard_name")
  createdAt DateTime? @map("created_at")
  updatedAt DateTime? @map("updated_at")

  @@map("permissions")
}

model Product {
  id                BigInt    @id @default(autoincrement())
  slug              String
  title             String
  userId            Int       @map("user_id")
  brandId           Int?      @map("brand_id")
  categoryId        Int       @map("category_id")
  summary           String?   @db.Text
  description       String    @db.Text
  warranty          String?   @db.Text
  specification     String?   @db.Text
  installation      String?   @db.Text
  download          String?   @db.Text
  image             String?
  seoTitle          String?   @map("seo_title") @db.Text
  seoDescription    String?   @map("seo_description") @db.Text
  seoKeyword        String?   @map("seo_keyword") @db.Text
  status            Int       @default(0)
  createdAt         DateTime? @map("created_at")
  updatedAt         DateTime? @map("updated_at")
  price             String?
  salePrice         String?   @map("sale_price")
  type              String?
  stock             String?
  shops             String?   @db.Text
  darazLink         String?   @map("daraz_link") @db.Text
  hardwarePasalLink String?   @map("hardware_pasal_link") @db.Text
  meroPasalLink     String?   @map("mero_pasal_link") @db.Text
  order             Int       @default(0)
  orderStatus       Int       @default(0) @map("order_status")

  @@map("products")
}

model ProductEnquiry {
  id          BigInt    @id @default(autoincrement())
  slug        String
  productId   Int       @map("product_id")
  name        String
  email       String
  phoneNumber String    @map("phone_number")
  remarks     String?   @db.Text
  createdAt   DateTime? @map("created_at")
  updatedAt   DateTime? @map("updated_at")

  @@map("product_enquiries")
}

model ProductReview {
  id        BigInt    @id @default(autoincrement())
  slug      String
  productId Int       @map("product_id")
  name      String
  email     String
  review    String    @db.Text
  rating    Int
  status    Int       @default(1)
  createdAt DateTime? @map("created_at")
  updatedAt DateTime? @map("updated_at")

  @@map("product_reviews")
}

model Role {
  id        BigInt    @id @default(autoincrement())
  name      String
  guardName String    @map("guard_name")
  createdAt DateTime? @map("created_at")
  updatedAt DateTime? @map("updated_at")

  @@map("roles")
}

model RoleHasPermission {
  permissionId BigInt @map("permission_id")
  roleId       BigInt @map("role_id")

  @@id([permissionId, roleId])
  @@map("role_has_permissions")
}

model Shop {
  id        BigInt    @id @default(autoincrement())
  slug      String
  userId    Int       @map("user_id")
  title     String
  image     String?
  status    Int       @default(0)
  createdAt DateTime? @map("created_at")
  updatedAt DateTime? @map("updated_at")
  website   String?

  @@map("shops")
}

model Subscriber {
  id        BigInt    @id @default(autoincrement())
  slug      String
  email     String
  status    Int       @default(0)
  createdAt DateTime? @map("created_at")
  updatedAt DateTime? @map("updated_at")

  @@map("subscribers")
}
`;

fs.appendFileSync('prisma/schema.prisma', extraModels);
