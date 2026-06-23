-- Migration: 002_create_coupons.sql
-- Purpose : Add `coupons` table + coupon columns on `orders` for discount codes.
-- Database: MySQL (ecommerce_db)
-- Run with: mysql -u <DB_USER> -p <DB_NAME> < migrations/002_create_coupons.sql

CREATE TABLE IF NOT EXISTS `coupons` (
    `id`               INT           NOT NULL AUTO_INCREMENT,
    `code`             VARCHAR(20)   NOT NULL,
    `discount_percent` INT           NOT NULL,
    `min_order_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `max_uses`         INT           NULL DEFAULT NULL,      -- NULL = unlimited
    `used_count`       INT           NOT NULL DEFAULT 0,
    `active`           BOOLEAN       NOT NULL DEFAULT TRUE,
    `created_at`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_coupons_code` (`code`),
    CONSTRAINT `chk_coupons_discount_percent` CHECK (`discount_percent` BETWEEN 1 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Coupon fields stored on each order (informational; discount already reflected in total_amount)
ALTER TABLE `orders`
    ADD COLUMN `applied_coupon_code` VARCHAR(20)   NULL DEFAULT NULL,
    ADD COLUMN `discount_amount`     DECIMAL(10,2) NOT NULL DEFAULT 0.00;
