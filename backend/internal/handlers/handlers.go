package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/go-redis/redis/v8"
)

type Handler struct {
	db  *sql.DB
	rdb *redis.Client
}

func NewHandler(db *sql.DB, redis *redis.Client) *Handler {
	return &Handler{db: db, rdb: redis}
}

func (h *Handler) HandleSales(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.getSales(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (h *Handler) HandleOrders(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.getOrders(w, r)
	case http.MethodPost:
		h.CreateOrder(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (h *Handler) HandleOrder(w http.ResponseWriter, r *http.Request, id string) {
	switch r.Method {
	case http.MethodDelete:
		h.DeleteOrder(w, r, id)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (h *Handler) HandleProducts(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.getProducts(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (h *Handler) getSales(w http.ResponseWriter, r *http.Request) {
	log.Printf("Getting sales data, productID: %v", r.URL.Query().Get("product_id"))

	if err := h.db.Ping(); err != nil {
		log.Printf("Database connection error: %v", err)
		http.Error(w, "Database connection error", http.StatusInternalServerError)
		return
	}

	var rows *sql.Rows
	var err error

	productID := r.URL.Query().Get("product_id")
	if productID == "all" {
		rows, err = h.db.Query("SELECT id, product_id, quantity, amount, date FROM sales ORDER BY date DESC")
	} else {
		rows, err = h.db.Query("SELECT id, product_id, quantity, amount, date FROM sales WHERE product_id = $1 ORDER BY date DESC", productID)
	}

	if err != nil {
		log.Printf("Query error: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var sales []map[string]interface{}
	for rows.Next() {
		var id, productID, quantity int
		var amount float64
		var date time.Time
		if err := rows.Scan(&id, &productID, &quantity, &amount, &date); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		sales = append(sales, map[string]interface{}{
			"id":         id,
			"product_id": productID,
			"quantity":   quantity,
			"amount":     amount,
			"date":       date,
		})
	}

	response, err := json.Marshal(sales)
	if err != nil {
		log.Printf("Error marshaling sales: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(response)
}

func (h *Handler) getOrders(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(`
        SELECT id, product_id, quantity, status, created_at 
        FROM orders 
        ORDER BY created_at DESC`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var orders []map[string]interface{}
	for rows.Next() {
		var id, productID, quantity int
		var status string
		var createdAt time.Time
		if err := rows.Scan(&id, &productID, &quantity, &status, &createdAt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		orders = append(orders, map[string]interface{}{
			"id":         id,
			"product_id": productID,
			"quantity":   quantity,
			"status":     status,
			"created_at": createdAt,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(orders)
}

func (h *Handler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	var order struct {
		ProductID int    `json:"product_id"`
		Quantity  int    `json:"quantity"`
		Status    string `json:"status"`
	}

	if err := json.NewDecoder(r.Body).Decode(&order); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	result, err := h.db.Exec(`
        INSERT INTO orders (product_id, quantity, status, created_at) 
        VALUES ($1, $2, $3, NOW())`,
		order.ProductID, order.Quantity, order.Status)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id, _ := result.LastInsertId()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":      id,
		"message": "Order created successfully",
	})
}

func (h *Handler) DeleteOrder(w http.ResponseWriter, r *http.Request, orderID string) {
	log.Printf("Deleting order with ID: %v", orderID)
	if orderID == "" {
		http.Error(w, "Order ID is required", http.StatusBadRequest)
		return
	}

	_, err := h.db.Exec("DELETE FROM orders WHERE id = $1", orderID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Order deleted successfully",
	})
}

func (h *Handler) getProducts(w http.ResponseWriter, r *http.Request) {
	log.Printf("Attempting to ping database...")
	if err := h.db.Ping(); err != nil {
		log.Printf("Database connection error: %v", err)
		http.Error(w, "Database connection error", http.StatusInternalServerError)
		return
	}
	log.Printf("Database ping successful")

	log.Printf("Querying products...")
	rows, err := h.db.Query("SELECT id, name, price FROM products")
	if err != nil {
		log.Printf("Query error: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	log.Printf("Query successful")
	defer rows.Close()

	var products []map[string]interface{}
	for rows.Next() {
		var id int
		var name string
		var price float64
		if err := rows.Scan(&id, &name, &price); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		products = append(products, map[string]interface{}{
			"id":    id,
			"name":  name,
			"price": price,
		})
	}

	response, err := json.Marshal(products)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(response)
}
