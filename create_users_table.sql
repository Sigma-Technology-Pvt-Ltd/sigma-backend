CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified_at" TIMESTAMP(3),
    "password" TEXT NOT NULL,
    "phone_number" TEXT,
    "image" TEXT,
    "remember_token" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),
    "user_id" INTEGER,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
