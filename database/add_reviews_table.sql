-- ------------------------------------------------------------
-- Migration: Add reviews table
-- ------------------------------------------------------------

USE ecommerce_db;

CREATE TABLE reviews (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    product_id      INT NOT NULL,
    user_id         INT NOT NULL,
    order_item_id   INT DEFAULT NULL,
    rating          INT NOT NULL,
    comment         TEXT DEFAULT NULL,
    photo_url       VARCHAR(255) DEFAULT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reviews_product    FOREIGN KEY (product_id)    REFERENCES products(id)     ON DELETE CASCADE,
    CONSTRAINT fk_reviews_user       FOREIGN KEY (user_id)       REFERENCES users(id)        ON DELETE CASCADE,
    CONSTRAINT fk_reviews_order_item FOREIGN KEY (order_item_id) REFERENCES order_items(id)  ON DELETE SET NULL,
    UNIQUE KEY uq_reviews_user_product (user_id, product_id),
    INDEX idx_reviews_product (product_id),
    INDEX idx_reviews_user    (user_id)
) ENGINE=InnoDB;
