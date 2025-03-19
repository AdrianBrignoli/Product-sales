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

export const getSales = async (productId?: number | string) => {
  try {
    const response = await api.get<Sale[]>(`/sales${productId ? `?product_id=${productId}` : ''}`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch sales data');
  }
};

export const getProducts = async () => {
  try {
    const { data } = await api.get<Product[]>("/products");
    return data;
  } catch (error) {
    throw new Error('Failed to fetch products');
  }
};

export const getOrders = async () => {
  try {
    const { data } = await api.get<Order[]>("/orders");
    return data;
  } catch (error) {
    throw new Error('Failed to fetch orders');
  }
};

export const createOrder = async (order: Omit<Order, "id" | "created_at">) => {
  try {
    const { data } = await api.post("/orders", order);
    return data;
  } catch (error) {
    throw new Error('Failed to create order');
  }
};

export const deleteOrder = async (id: number) => {
  try {
    await api.delete(`/orders/${id}`);
  } catch (error) {
    throw new Error('Failed to delete order');
  }
}; 