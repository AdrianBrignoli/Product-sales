package handlers

import (
	"log"
	"math/rand"
	"time"
)

func (h *Handler) StartSalesSimulation() {
	go func() {
		for {
			productID := rand.Intn(3) + 1
			quantity := rand.Intn(5) + 1
			amount := float64(quantity) * 99.99

			_, err := h.db.Exec(`
                INSERT INTO sales (product_id, quantity, amount, date)
                VALUES ($1, $2, $3, NOW())
                RETURNING pg_notify('sales_channel', 
                    json_build_object(
                        'operation', 'INSERT',
                        'record', json_build_object(
                            'id', currval('sales_id_seq'),
                            'product_id', $1,
                            'quantity', $2,
                            'amount', $3,
                            'date', NOW()
                        )
                    )::text
                )
            `, productID, quantity, amount)

			if err != nil {
				log.Printf("Simulation error: %v", err)
			} else {
				log.Printf("Simulated sale: Product %d, Quantity %d, Amount %.2f",
					productID, quantity, amount)
			}

			// Let's wait 30 seconds before next sale
			time.Sleep(30 * time.Second)
		}
	}()
}
