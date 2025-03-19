package handlers

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/websocket"
	"github.com/lib/pq"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func (h *Handler) HandleSalesWebSocket(w http.ResponseWriter, r *http.Request) {
	log.Printf("WebSocket connection attempt from %s", r.RemoteAddr)

	// Upgrade HTTP connection to WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Failed to upgrade connection: %v", err)
		return
	}
	defer conn.Close()

	log.Printf("WebSocket connection upgraded successfully")

	// Create PostgreSQL listener
	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
	)
	listener := pq.NewListener(connStr,
		10*time.Second, time.Minute, nil)
	defer listener.Close()

	log.Printf("Listener connection string: %s", connStr)

	// Give the listener time to establish connection
	time.Sleep(time.Second)
	log.Printf("Waiting for listener to connect...")

	// Initialize notification channel first
	listener.Notify = make(chan *pq.Notification, 1)

	// Try to ping the connection
	if err := listener.Ping(); err != nil {
		log.Printf("Could not ping PostgreSQL listener: %v", err)
		return
	}

	err = listener.Listen("sales_channel")
	if err != nil {
		log.Printf("Listen failed: %v", err)
		return
	}

	log.Printf("WebSocket connected and listening on sales_channel")

	// Forward notifications
	for {
		select {
		// Recivies notifications from PostgreSQL
		case n := <-listener.Notify:
			log.Printf("Received PostgreSQL notification on channel: %s, payload: %s",
				n.Channel, n.Extra)
			if err := conn.WriteMessage(websocket.TextMessage, []byte(n.Extra)); err != nil {
				log.Printf("Error writing to websocket: %v", err)
				return
			}
			log.Printf("Successfully sent notification to WebSocket client")
		case <-r.Context().Done():
			log.Printf("Context done, closing WebSocket")
			return
		}
	}
}
