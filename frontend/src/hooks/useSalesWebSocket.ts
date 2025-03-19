import { useEffect, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useSalesWebSocket() {
    const queryClient = useQueryClient();
    const [showUpdate, setShowUpdate] = useState(false);

    useEffect(() => {
        let ws: WebSocket;
        let reconnectTimeout: number;
        
        const connect = () => {
            ws = new WebSocket('ws://localhost:8080/ws/sales');
            
            ws.onopen = () => {
                console.log('WebSocket Connected');
            };

            ws.onerror = (error) => {
                console.error('WebSocket Error:', error);
                ws.close();
            };

            ws.onclose = () => {
                console.log('WebSocket Closed, attempting to reconnect...');
                reconnectTimeout = setTimeout(connect, 3000);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('WebSocket received:', data);
                    queryClient.invalidateQueries({ queryKey: ['sales'] });
                    setShowUpdate(true);
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };
        };

        connect();

        return () => {
            clearTimeout(reconnectTimeout);
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [queryClient]);

    const handleCloseNotification = useCallback(() => {
        setShowUpdate(false);
    }, []);

    return { showUpdate, handleCloseNotification };
} 