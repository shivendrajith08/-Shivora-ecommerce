-- Migration: 001_create_addresses.sql
-- Purpose : Add `addresses` table for saved user shipping addresses.
-- Database: MySQL (ecommerce_db)
-- Run with: mysql -u <DB_USER> -p <DB_NAME> < migrations/001_create_addresses.sql

CREATE TABLE IF NOT EXISTS `addresses` (
    `id`            INT           NOT NULL AUTO_INCREMENT,
    `user_id`       INT           NOT NULL,
    `full_name`     VARCHAR(120)  NOT NULL,
    `phone`         VARCHAR(20)   NOT NULL,
    `address_line1` VARCHAR(255)  NOT NULL,
    `address_line2` VARCHAR(255)  NULL,
    `city`          VARCHAR(100)  NOT NULL,
    `state`         VARCHAR(100)  NOT NULL,
    `pincode`       VARCHAR(10)   NOT NULL,
    `is_default`    BOOLEAN       NOT NULL DEFAULT FALSE,
    `created_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `ix_addresses_user_id` (`user_id`),
    CONSTRAINT `fk_addresses_user_id`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
