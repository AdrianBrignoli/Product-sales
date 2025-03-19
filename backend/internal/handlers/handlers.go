package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	"github.com/AdrianBrignoli/madden-solution/internal/models"
	"github.com/go-redis/redis/v8"
)

type Handler struct {
	db  *sql.DB
	rdb *redis.Client // Again, not used, but I'm keeping it here for "future use"
}

func NewHandler(db *sql.DB, redis *redis.Client) *Handler {
	return &Handler{db: db, rdb: redis}
}

// Sales handler. Simple GET request.
func (h *Handler) HandleSales(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.getSales(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// Orders handler. CR.
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

// I choose to handle the DELETE request separately.
// Might be unnecessary. But since the {id} is not part of req-body, this is where I landed.
func (h *Handler) HandleOrder(w http.ResponseWriter, r *http.Request, id string) {
	switch r.Method {
	case http.MethodDelete:
		h.DeleteOrder(w, r, id)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// Products handler. Simple GET request.
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

	var sales []models.Sale
	for rows.Next() {
		var sale models.Sale
		if err := rows.Scan(&sale.ID, &sale.ProductID, &sale.Quantity, &sale.Amount, &sale.Date); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		sales = append(sales, sale)
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

	var orders []models.Order
	for rows.Next() {
		var order models.Order
		if err := rows.Scan(&order.ID, &order.ProductID, &order.Quantity, &order.Status, &order.CreatedAt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		orders = append(orders, order)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(orders)
}

func (h *Handler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	var order models.Order
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
	rows, err := h.db.Query("SELECT id, name, price FROM products")
	if err != nil {
		log.Printf("Query error: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var products []models.Product
	for rows.Next() {
		var product models.Product
		if err := rows.Scan(&product.ID, &product.Name, &product.Price); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		products = append(products, product)
	}

	response, err := json.Marshal(products)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(response)
}
