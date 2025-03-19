-- database/seeds.sql

-- Insert sample resellers
INSERT INTO resellers (name, contact_info) VALUES
    ('Nudie Jeans', 'contact@nudiejeans.com'),
    ('Our Legacy', 'contact@ourlegacy.se');

-- Insert sample products
INSERT INTO products (name, price) VALUES
    ('T-Shirt Classic', 299.99),
    ('Denim Jeans', 899.99),
    ('Hoodie', 599.99),
    ('Leather Jacket', 1999.99),
    ('Socks Pack', 149.99)
ON CONFLICT DO NOTHING;

-- Clear existing sales
TRUNCATE sales CASCADE;

-- Generate 3 years of sales data with seasonal variations
WITH RECURSIVE dates AS (
    SELECT CURRENT_DATE - INTERVAL '3 years' AS date
    UNION ALL
    SELECT date + INTERVAL '1 day'
    FROM dates
    WHERE date < CURRENT_DATE
),
seasonal_factors AS (
    SELECT 
        date,
        CASE 
            WHEN EXTRACT(MONTH FROM date) IN (11, 12, 1, 6, 7, 8) THEN 1.5
            ELSE 1.0
        END AS factor
    FROM dates
)
INSERT INTO sales (product_id, quantity, amount, date)
SELECT 
    p.id,
    CEIL(random() * 10 * sf.factor)::INT as quantity,
    CEIL(random() * 10 * sf.factor) * p.price as amount,
    sf.date + (random() * INTERVAL '1 day')
FROM products p
CROSS JOIN seasonal_factors sf;

-- Insert sample orders
INSERT INTO orders (product_id, quantity, status) VALUES
    (1, 50, 'pending'),
    (2, 30, 'completed'),
    (3, 25, 'processing'),
    (4, 10, 'pending'),
    (5, 100, 'completed');