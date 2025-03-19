import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getOrders,
  createOrder,
  deleteOrder,
  getProducts,
} from "../services/api";
import { OrdersView } from "../views/OrdersView";

export default function OrdersPage() {
  const queryClient = useQueryClient();

  const {
    data: orders,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["orders"],
    queryFn: getOrders,
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  const createMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const handleCreateOrder = useCallback(
    (order: { product_id: number; quantity: number; status: string }) => {
      createMutation.mutate(order);
    },
    [createMutation]
  );

  const handleDeleteOrder = useCallback(
    (id: number) => {
      deleteMutation.mutate(id);
    },
    [deleteMutation]
  );

  return (
    <OrdersView
      orders={orders}
      products={products}
      isLoading={isLoading}
      isError={isError}
      onCreateOrder={handleCreateOrder}
      onDeleteOrder={handleDeleteOrder}
    />
  );
}
