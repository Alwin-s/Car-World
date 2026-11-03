CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS citext;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('customer', 'inspector', 'admin', 'ops', 'dealer');

-- CreateEnum
CREATE TYPE "service_code" AS ENUM ('PDI', 'UCI', 'VSH', 'SYC', 'BUC', 'B2B');

-- CreateEnum
CREATE TYPE "booking_status" AS ENUM ('draft', 'pending_payment', 'confirmed', 'inspector_assigned', 'en_route', 'in_progress', 'report_ready', 'completed', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('created', 'authorized', 'paid', 'failed', 'refunded', 'partially_refunded');

-- CreateEnum
CREATE TYPE "fuel_type" AS ENUM ('petrol', 'diesel', 'cng', 'electric', 'hybrid', 'lpg');

-- CreateEnum
CREATE TYPE "transmission" AS ENUM ('manual', 'automatic', 'amt', 'cvt', 'dct', 'ev');

-- CreateEnum
CREATE TYPE "vehicle_segment" AS ENUM ('hatchback', 'sedan', 'suv', 'muv', 'luxury', 'ev');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" CITEXT,
    "password_hash" TEXT,
    "role" "user_role" NOT NULL DEFAULT 'customer',
    "preferred_lang" TEXT NOT NULL DEFAULT 'en',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "phone_verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "phone" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "consumed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip" INET,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Tamil Nadu',
    "is_active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "district_id" INTEGER NOT NULL,
    "line" TEXT NOT NULL,
    "landmark" TEXT,
    "pincode" TEXT,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" SERIAL NOT NULL,
    "code" "service_code" NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "description_md" TEXT,
    "hero_image_url" TEXT,
    "is_bookable" BOOLEAN NOT NULL DEFAULT true,
    "is_coming_soon" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packages" (
    "id" SERIAL NOT NULL,
    "service_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "checkpoints_count" INTEGER,
    "inclusions" JSONB NOT NULL DEFAULT '[]',
    "est_duration_min" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_prices" (
    "id" SERIAL NOT NULL,
    "package_id" INTEGER NOT NULL,
    "segment" "vehicle_segment" NOT NULL,
    "district_id" INTEGER,
    "base_price_paise" INTEGER NOT NULL,
    "travel_fee_paise" INTEGER NOT NULL DEFAULT 0,
    "gst_percent" DECIMAL(4,2) NOT NULL DEFAULT 18.00,
    "valid_from" DATE NOT NULL DEFAULT CURRENT_DATE,
    "valid_to" DATE,

    CONSTRAINT "package_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_makes" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "logo_url" TEXT,

    CONSTRAINT "vehicle_makes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_models" (
    "id" SERIAL NOT NULL,
    "make_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "segment" "vehicle_segment" NOT NULL,

    CONSTRAINT "vehicle_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_variants" (
    "id" SERIAL NOT NULL,
    "model_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "fuel" "fuel_type" NOT NULL,
    "transmission" "transmission" NOT NULL,

    CONSTRAINT "vehicle_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "owner_user_id" UUID,
    "make_id" INTEGER,
    "model_id" INTEGER,
    "variant_id" INTEGER,
    "registration_no" TEXT,
    "vin" TEXT,
    "manufacture_year" INTEGER,
    "color" TEXT,
    "odometer_km" INTEGER,
    "owners_count" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "booking_no" TEXT NOT NULL,
    "user_id" UUID,
    "service_id" INTEGER NOT NULL,
    "package_id" INTEGER NOT NULL,
    "vehicle_id" UUID,
    "address_id" UUID,
    "contact_name" TEXT,
    "contact_phone" TEXT,
    "contact_email" CITEXT,
    "seller_or_dealer_name" TEXT,
    "seller_phone" TEXT,
    "slot_start" TIMESTAMPTZ,
    "slot_end" TIMESTAMPTZ,
    "inspector_id" UUID,
    "status" "booking_status" NOT NULL DEFAULT 'draft',
    "price_base_paise" INTEGER,
    "price_travel_paise" INTEGER,
    "discount_paise" INTEGER NOT NULL DEFAULT 0,
    "gst_paise" INTEGER,
    "total_paise" INTEGER,
    "wizard_step" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "cancelled_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_status_history" (
    "id" BIGSERIAL NOT NULL,
    "booking_id" UUID NOT NULL,
    "from_status" "booking_status",
    "to_status" "booking_status" NOT NULL,
    "changed_by" UUID,
    "note" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "booking_id" UUID NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'razorpay',
    "provider_order_id" TEXT,
    "provider_payment_id" TEXT,
    "amount_paise" INTEGER NOT NULL,
    "status" "payment_status" NOT NULL DEFAULT 'created',
    "raw_payload" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "otp_codes_phone_created_at_idx" ON "otp_codes"("phone", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "districts_name_state_key" ON "districts"("name", "state");

-- CreateIndex
CREATE UNIQUE INDEX "services_code_key" ON "services"("code");

-- CreateIndex
CREATE UNIQUE INDEX "package_prices_package_id_segment_key" ON "package_prices"("package_id", "segment");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_makes_name_key" ON "vehicle_makes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_models_make_id_name_key" ON "vehicle_models"("make_id", "name");

-- CreateIndex
CREATE INDEX "vehicles_registration_no_idx" ON "vehicles"("registration_no");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_booking_no_key" ON "bookings"("booking_no");

-- CreateIndex
CREATE INDEX "bookings_user_id_created_at_idx" ON "bookings"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "bookings_inspector_id_slot_start_idx" ON "bookings"("inspector_id", "slot_start");

-- CreateIndex
CREATE INDEX "bookings_status_slot_start_idx" ON "bookings"("status", "slot_start");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_order_id_key" ON "payments"("provider_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_payment_id_key" ON "payments"("provider_payment_id");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_prices" ADD CONSTRAINT "package_prices_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_prices" ADD CONSTRAINT "package_prices_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_models" ADD CONSTRAINT "vehicle_models_make_id_fkey" FOREIGN KEY ("make_id") REFERENCES "vehicle_makes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_variants" ADD CONSTRAINT "vehicle_variants_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "vehicle_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_make_id_fkey" FOREIGN KEY ("make_id") REFERENCES "vehicle_makes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "vehicle_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "vehicle_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_inspector_id_fkey" FOREIGN KEY ("inspector_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
