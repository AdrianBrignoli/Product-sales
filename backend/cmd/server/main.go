package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/AdrianBrignoli/madden-solution/internal/handlers"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/go-redis/redis/v8"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	RedisAddr  string
	ServerAddr string
}

// We don't really need this when using Docker Compose, but I'm keeping it here for safety
func loadConfig() (*Config, error) {
	if err := godotenv.Load(); err != nil {
		return nil, fmt.Errorf("error loading .env file: %v", err)
	}

	return &Config{
		DBHost:     os.Getenv("DB_HOST"),
		DBPort:     os.Getenv("DB_PORT"),
		DBUser:     os.Getenv("DB_USER"),
		DBPassword: os.Getenv("DB_PASSWORD"),
		DBName:     os.Getenv("DB_NAME"),
		RedisAddr:  os.Getenv("REDIS_ADDR"),
		ServerAddr: ":8080",
	}, nil
}

func main() {
	// Load configuration
	config, err := loadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Setup database connection
	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		config.DBHost,
		config.DBPort,
		config.DBUser,
		config.DBPassword,
		config.DBName,
	)

	log.Printf("Connecting to database...")
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}
	log.Printf("Successfully connected to database")

	// Initialize redis connection
	var rdb *redis.Client
	rdb = redis.NewClient(&redis.Options{
		Addr: config.RedisAddr,
	})

	// Test Redis connection
	// I'm not really using Redis for anything, but I'm keeping it here for "future use"
	ctx := context.Background()
	if _, err := rdb.Ping(ctx).Result(); err != nil {
		log.Printf("Warning: Redis connection failed: %v", err)
		log.Println("Continuing without Redis caching...")
		rdb = nil
	} else {
		defer rdb.Close()
	}

	// Initialize router and handlers
	r := chi.NewRouter()
	h := handlers.NewHandler(db, rdb)

	// Start sales simulation
	// Simulates new sales every 30 seconds to display near real-time data handling
	h.StartSalesSimulation()

	// Middleware
	r.Use(middleware.Logger)    // logs HTTP request details
	r.Use(middleware.Recoverer) // recovers from panics => 500 internal server error => Application can keep on running
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Setup routes
	// Get sales and display, no further CRUD operations needed
	r.Get("/api/sales", h.HandleSales)

	// CRD for orders. Special treatment for DELETE. Apparently in line with best practise for REST
	r.Route("/api/orders", func(r chi.Router) {
		r.Get("/", h.HandleOrders)
		r.Post("/", h.CreateOrder)
		r.Route("/{id}", func(r chi.Router) {
			r.Delete("/", func(w http.ResponseWriter, r *http.Request) {
				id := chi.URLParam(r, "id")
				h.HandleOrder(w, r, id)
			})
		})
	})
	// Products "belonging" to this user
	r.Get("/api/products", h.HandleProducts)
	// WS for regular sales sim
	r.HandleFunc("/ws/sales", h.HandleSalesWebSocket)

	// Create server
	srv := &http.Server{
		Addr:    config.ServerAddr,
		Handler: r,
	}

	// Run server in goroutine
	// SIGINT/SIGTERM related, graceful exit
	go func() {
		log.Printf("Server starting on %s", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// Graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited properly")
}
