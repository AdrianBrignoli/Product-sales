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
    ('Socks Pack', 149.99);

-- Insert sample sales (last 3 years of data)
INSERT INTO sales (product_id, quantity, amount, date) 
SELECT 
    p.id,
    FLOOR(RANDOM() * 10 + 1)::INT as quantity,
    p.price * FLOOR(RANDOM() * 10 + 1) as amount,
    TIMESTAMP '2021-01-01 00:00:00' +
        RANDOM() * (TIMESTAMP '2024-03-14 00:00:00' -
                   TIMESTAMP '2021-01-01 00:00:00')
FROM products p
CROSS JOIN generate_series(1, 1000);

-- Insert sample orders
INSERT INTO orders (product_id, quantity, status) VALUES
    (1, 50, 'pending'),
    (2, 30, 'completed'),
    (3, 25, 'processing'),
    (4, 10, 'pending'),
    (5, 100, 'completed');