import { Sale, Product } from "../services/api";

interface TimeSeriesData {
  date: string;
  dateObj: Date;
  amount: number;
  quantity: number;
  avgOrderValue: number;
}

interface ProductRevenue {
  name: string;
  revenue: number;
}

export const processTimeSeriesData = (
  sales: Sale[] | undefined,
  timeFrame: "daily" | "monthly" | "yearly"
) => {
  return sales
    ?.reduce((acc: TimeSeriesData[], sale) => {
      const date = new Date(sale.date);
      const key =
        timeFrame === "daily"
          ? date.toLocaleDateString()
          : timeFrame === "monthly"
          ? `${date.getMonth() + 1}/${date.getFullYear()}`
          : date.getFullYear().toString();

      const existing = acc.find((item) => item.date === key);
      if (existing) {
        existing.amount += sale.amount;
        existing.quantity += sale.quantity;
      } else {
        acc.push({
          date: key,
          dateObj: date,
          amount: sale.amount,
          quantity: sale.quantity,
          avgOrderValue: sale.amount / sale.quantity,
        });
      }
      return acc;
    }, [])
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
    .map(({ dateObj, ...rest }) => rest);
};

export const calculateTopProducts = (
  sales: Sale[] | undefined,
  products: Product[] | undefined
) => {
  if (!sales || !products) return [];
  
  return sales
    .reduce((acc: ProductRevenue[], sale) => {
      const product = products?.find((p) => p.id === sale.product_id);
      const existing = acc.find((item) => item.name === product?.name);
      if (existing) {
        existing.revenue += sale.amount;
      } else if (product) {
        acc.push({ name: product.name, revenue: sale.amount });
      }
      return acc;
    }, [])
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
};


export const productColors = [
  "#8884d8",  // Purple
  "#82ca9d",  // Green
  "#ffc658",  // Yellow
  "#ff8042",  // Orange
  "#0088FE",  // Blue
  "#00C49F",  // Teal
  "#FFBB28",  // Gold
  "#FF6B6B",  // Coral
]; 