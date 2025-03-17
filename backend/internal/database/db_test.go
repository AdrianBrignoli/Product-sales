package database

import (
	"testing"
)

func TestNewConnection(t *testing.T) {
	db, err := NewConnection()
	if err != nil {
		t.Fatalf("Failed to create connection: %v", err)
	}
	defer db.Close()

	// Test the connection by pinging the database
	err = db.Ping()
	if err != nil {
		t.Fatalf("Failed to ping database: %v", err)
	}
}
