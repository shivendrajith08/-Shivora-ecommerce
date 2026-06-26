-- Migration: 004_add_user_order_number.sql
-- Purpose : Add user_order_number to orders so each user's orders start at #1.
-- Database: MySQL 8.0+ (ecommerce_db)
-- Run with: mysql -u <DB_USER> -p <DB_NAME> < migrations/004_add_user_order_number.sql

ALTER TABLE `orders`
    ADD COLUMN `user_order_number` INT NULL AFTER `user_id`;

-- Backfill: number each user's existing orders chronologically starting at 1
UPDATE `orders` o
JOIN (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) AS rn
    FROM `orders`
) ranked ON o.id = ranked.id
SET o.user_order_number = ranked.rn;
