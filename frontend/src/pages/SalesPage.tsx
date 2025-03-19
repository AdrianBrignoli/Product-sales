import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSales, getProducts } from "../services/api";
import { useSalesWebSocket } from "../hooks/useSalesWebSocket";
import { SalesView } from "../views/SalesView";
import { Snackbar, Alert } from "@mui/material";

export default function SalesPage() {
  const [selectedProduct, setSelectedProduct] = useState<number | "all">("all");
  const [timeFrame, setTimeFrame] = useState<"daily" | "monthly" | "yearly">(
    "monthly"
  );

  const handleProductSelect = useCallback((productId: number | "all") => {
    setSelectedProduct(productId);
  }, []);

  const handleTimeFrameChange = useCallback(
    (newTimeFrame: "daily" | "monthly" | "yearly") => {
      setTimeFrame(newTimeFrame);
    },
    []
  );

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  const {
    data: sales,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ["sales", selectedProduct, timeFrame],
    queryFn: () => getSales(selectedProduct),
    refetchInterval: 30000,
  });

  const { showUpdate, handleCloseNotification } = useSalesWebSocket();

  return (
    <>
      <SalesView
        sales={sales}
        products={products}
        isLoading={isLoading}
        isError={isError}
        selectedProduct={selectedProduct}
        onProductSelect={handleProductSelect}
        timeFrame={timeFrame}
        onTimeFrameChange={handleTimeFrameChange}
      />
      <Snackbar
        open={showUpdate}
        autoHideDuration={3000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity="info" onClose={handleCloseNotification}>
          Sales data updated
        </Alert>
      </Snackbar>
    </>
  );
}
