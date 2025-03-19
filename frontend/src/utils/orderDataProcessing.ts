import { Order, Product } from '../services/api';

export const calculateStockSummary = (
  orders: Order[] | undefined,
  products: Product[] | undefined
) => {
  if (!orders || !products) return null;

  const productTotals = orders.reduce((acc, order) => {
    if (!acc[order.product_id]) {
      acc[order.product_id] = { currentStock: 0, incomingStock: 0 };
    }

    if (order.status === 'completed') {
      acc[order.product_id].currentStock += order.quantity;
    } else if (order.status === 'processing' || order.status === 'pending') {
      acc[order.product_id].incomingStock += order.quantity;
    }

    return acc;
  }, {} as Record<number, { currentStock: number; incomingStock: number }>);

  return products.map((product) => ({
    name: product.name,
    currentStock: productTotals[product.id]?.currentStock || 0,
    incomingStock: productTotals[product.id]?.incomingStock || 0,
  }));
};
