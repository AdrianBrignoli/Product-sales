package main

import (
	"log"
	"net/http"

	"github.com/AdrianBrignoli/madden-solution/internal/database"
	"github.com/AdrianBrignoli/madden-solution/internal/handlers"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func main() {
	// Initialize database connection
	db, err := database.NewConnection()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize router and handlers
	r := chi.NewRouter()
	h := handlers.NewHandler(db)

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// Setup routes
	r.Get("/api/sales", h.HandleSales)
	r.Route("/api/orders", func(r chi.Router) {
		r.Get("/", h.HandleOrders)
		r.Post("/", h.CreateOrder)
		r.Delete("/{id}", h.DeleteOrder)
	})
	r.Get("/api/products", h.HandleProducts)

	// Start server
	log.Println("Server starting on :8080")
	if err := http.ListenAndServe(":8080", r); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
