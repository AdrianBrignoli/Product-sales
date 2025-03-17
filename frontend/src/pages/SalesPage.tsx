import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Paper,
  Typography,
} from "@mui/material";
import { getSales, getProducts } from "../services/api";

export default function SalesPage() {
  const [selectedProduct, setSelectedProduct] = useState<number | "all">("all");

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  const { data: sales } = useQuery({
    queryKey: ["sales", selectedProduct],
    queryFn: () =>
      getSales(selectedProduct === "all" ? undefined : selectedProduct),
  });

  // Process sales data for the chart
  const chartData = sales?.reduce((acc: any[], sale) => {
    const date = new Date(sale.date).toLocaleDateString();
    const existing = acc.find((item) => item.date === date);
    if (existing) {
      existing.amount += sale.amount;
    } else {
      acc.push({ date, amount: sale.amount });
    }
    return acc;
  }, []);

  return (
    <div className="p-6">
      <Typography variant="h4" className="mb-6">
        Sales Overview
      </Typography>
      <Paper className="p-4 mb-6">
        <FormControl fullWidth>
          <InputLabel>Filter by Product</InputLabel>
          <Select
            value={selectedProduct}
            label="Filter by Product"
            onChange={(e) =>
              setSelectedProduct(e.target.value as number | "all")
            }
          >
            <MenuItem value="all">All Products</MenuItem>
            {products?.map((product) => (
              <MenuItem key={product.id} value={product.id}>
                {product.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      <Paper className="p-4">
        <LineChart width={800} height={400} data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#8884d8"
            name="Sales Amount"
          />
        </LineChart>
      </Paper>
    </div>
  );
}
