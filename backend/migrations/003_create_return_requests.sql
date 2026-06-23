-- Migration: 003_create_return_requests.sql
-- Purpose : Return Request system (user requests -> admin approve/reject).
-- Database: MySQL (ecommerce_db)
-- Run with: mysql -u <DB_USER> -p <DB_NAME> < migrations/003_create_return_requests.sql

CREATE TABLE IF NOT EXISTS `return_requests` (
    `id`          INT       NOT NULL AUTO_INCREMENT,
    `order_id`    INT       NOT NULL,
    `user_id`     INT       NOT NULL,
    `reason`      ENUM('Damaged product','Wrong item received','Not as described','Changed my mind','Other') NOT NULL,
    `description` TEXT      NULL,
    `status`      ENUM('Requested','Approved','Rejected') NOT NULL DEFAULT 'Requested',
    `admin_note`  TEXT      NULL,
    `created_at`  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_return_requests_order_id` (`order_id`),
    KEY `ix_return_requests_user_id` (`user_id`),
    CONSTRAINT `fk_return_requests_order_id`
        FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_return_requests_user_id`
        FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
