-- Drop tables if they exist (useful during development)
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS resellers;

-- Create tables
CREATE TABLE resellers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_sales_date ON sales(date);
CREATE INDEX idx_sales_product ON sales(product_id);
CREATE INDEX idx_orders_created ON orders(created_at);

-- Drop and recreate the trigger function with more logging
CREATE OR REPLACE FUNCTION notify_sales_change() RETURNS TRIGGER AS $$
BEGIN
    -- Convert the new row to JSON and send it as notification
    PERFORM pg_notify(
        'sales_channel',
        json_build_object(
            'id', NEW.id,
            'product_id', NEW.product_id,
            'quantity', NEW.quantity,
            'amount', NEW.amount,
            'date', NEW.date
        )::text
    );
    RAISE NOTICE 'Notification sent for sale ID: %', NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Make sure trigger is properly set up
DROP TRIGGER IF EXISTS sales_notify_trigger ON sales;
CREATE TRIGGER sales_notify_trigger
    AFTER INSERT OR UPDATE
    ON sales
    FOR EACH ROW
    EXECUTE FUNCTION notify_sales_change();