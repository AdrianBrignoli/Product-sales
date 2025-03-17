import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api",
});

export interface Product {
  id: number;
  name: string;
  price: number;
}

export interface Sale {
  id: number;
  product_id: number;
  quantity: number;
  amount: number;
  date: string;
}

export interface Order {
  id: number;
  product_id: number;
  quantity: number;
  status: string;
  created_at: string;
}

export const getSales = async (productId?: number) => {
  const { data } = await api.get<Sale[]>(`/sales${productId ? `?product_id=${productId}` : ''}`);
  return data;
};

export const getProducts = async () => {
  const { data } = await api.get<Product[]>("/products");
  return data;
};

export const getOrders = async () => {
  const { data } = await api.get<Order[]>("/orders");
  return data;
};

export const createOrder = async (order: Omit<Order, "id" | "created_at">) => {
  const { data } = await api.post("/orders", order);
  return data;
};

export const deleteOrder = async (id: number) => {
  await api.delete(`/orders/${id}`);
}; 