-- ============================================================
-- E-Commerce Website Database Schema
-- MySQL 8.0+
-- ============================================================

DROP DATABASE IF EXISTS ecommerce_db;
CREATE DATABASE ecommerce_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ecommerce_db;

-- ------------------------------------------------------------
-- USERS TABLE
-- ------------------------------------------------------------
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- CATEGORIES TABLE
-- ------------------------------------------------------------
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(120) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- PRODUCTS TABLE
-- ------------------------------------------------------------
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    discount_price DECIMAL(10, 2) DEFAULT NULL,
    stock INT NOT NULL DEFAULT 0,
    sku VARCHAR(80) UNIQUE,
    category_id INT,
    image_url VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_category FOREIGN KEY (category_id)
        REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_products_category (category_id),
    INDEX idx_products_name (name),
    FULLTEXT INDEX ft_products_search (name, description)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- CART TABLE
-- ------------------------------------------------------------
CREATE TABLE cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_product FOREIGN KEY (product_id)
        REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY uq_cart_user_product (user_id, product_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- WISHLIST TABLE
-- ------------------------------------------------------------
CREATE TABLE wishlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_wishlist_product FOREIGN KEY (product_id)
        REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY uq_wishlist_user_product (user_id, product_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- ORDERS TABLE
-- ------------------------------------------------------------
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled')
        NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50) NOT NULL DEFAULT 'COD',
    shipping_name VARCHAR(100) NOT NULL,
    shipping_phone VARCHAR(20) NOT NULL,
    shipping_address VARCHAR(255) NOT NULL,
    shipping_city VARCHAR(100) NOT NULL,
    shipping_state VARCHAR(100) NOT NULL,
    shipping_pincode VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_orders_user (user_id),
    INDEX idx_orders_status (status)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- ORDER ITEMS TABLE
-- ------------------------------------------------------------
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT,
    product_name VARCHAR(200) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_orderitems_order FOREIGN KEY (order_id)
        REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_orderitems_product FOREIGN KEY (product_id)
        REFERENCES products(id) ON DELETE SET NULL,
    INDEX idx_orderitems_order (order_id)
) ENGINE=InnoDB;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default admin user (password: Admin@123)
-- Password hash generated with werkzeug.security.generate_password_hash
INSERT INTO users (name, email, password_hash, role) VALUES
('Site Admin', 'admin@example.com', 'scrypt:32768:8:1$nWe3LvqW9ctN1UVL$ffe7040fa31b911da6acb0796705cbb786665d4c06b697a9b18d828a1f2629925a8503c02717a7a7d2bbc50c6454c77cc124a4c14196bb4c5e7b1e2ff57b7ef6', 'admin');

-- Categories
INSERT INTO categories (name, slug, description) VALUES
('Electronics', 'electronics', 'Phones, laptops, gadgets and accessories'),
('Fashion', 'fashion', 'Clothing, footwear and accessories'),
('Home & Kitchen', 'home-kitchen', 'Furniture, decor and kitchen essentials'),
('Books', 'books', 'Fiction, non-fiction and educational books'),
('Sports & Fitness', 'sports-fitness', 'Sportswear and fitness equipment');

-- Sample products
INSERT INTO products (name, slug, description, price, discount_price, stock, sku, category_id, image_url) VALUES
('Wireless Bluetooth Headphones', 'wireless-bluetooth-headphones', 'Over-ear wireless headphones with noise cancellation and 30-hour battery life.', 2999.00, 2499.00, 50, 'ELEC-001', 1, NULL),
('Smartphone 128GB', 'smartphone-128gb', 'Latest generation smartphone with 128GB storage, triple camera and AMOLED display.', 18999.00, 17499.00, 30, 'ELEC-002', 1, NULL),
('Men''s Cotton T-Shirt', 'mens-cotton-tshirt', 'Comfortable 100% cotton round-neck t-shirt available in multiple colors.', 499.00, 399.00, 100, 'FASH-001', 2, NULL),
('Women''s Running Shoes', 'womens-running-shoes', 'Lightweight breathable running shoes with cushioned sole.', 1999.00, 1599.00, 60, 'FASH-002', 2, NULL),
('Non-Stick Cookware Set', 'non-stick-cookware-set', '5-piece non-stick cookware set suitable for all stovetops.', 2499.00, NULL, 25, 'HOME-001', 3, NULL),
('The Pragmatic Programmer', 'the-pragmatic-programmer-book', 'A classic guide for software developers covering best practices.', 899.00, 699.00, 40, 'BOOK-001', 4, NULL),
('Yoga Mat Premium', 'yoga-mat-premium', 'Anti-slip eco-friendly yoga mat, 6mm thickness.', 999.00, 799.00, 70, 'SPRT-001', 5, NULL),
('Adjustable Dumbbells Set', 'adjustable-dumbbells-set', 'Pair of adjustable dumbbells, 2kg to 20kg per side.', 5999.00, 5499.00, 15, 'SPRT-002', 5, NULL);
