package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"
)

type Handler struct {
	db *sql.DB
}

func NewHandler(db *sql.DB) *Handler {
	return &Handler{db: db}
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
	case http.MethodDelete:
		h.DeleteOrder(w, r)
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
	productID := r.URL.Query().Get("product_id")
	query := `
        SELECT s.id, s.product_id, s.quantity, s.amount, s.date 
        FROM sales s
        WHERE ($1 = '' OR s.product_id = $1::integer)
        ORDER BY s.date DESC`

	rows, err := h.db.Query(query, productID)
	if err != nil {
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

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sales)
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

func (h *Handler) DeleteOrder(w http.ResponseWriter, r *http.Request) {
	orderID := r.URL.Query().Get("id")
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
	rows, err := h.db.Query("SELECT id, name, price FROM products")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
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

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}
