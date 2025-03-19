import { useState, useMemo, memo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Box,
  Stack,
  CircularProgress,
  Button,
  TablePagination,
} from "@mui/material";
import { Sale, Product } from "../services/api";
import {
  processTimeSeriesData,
  calculateTopProducts,
  productColors,
} from "../utils/salesDataProcessing";
import { useQueryClient } from "@tanstack/react-query";

interface SalesViewProps {
  sales: Sale[] | undefined;
  products: Product[] | undefined;
  isLoading: boolean;
  isError: boolean;
  selectedProduct: number | "all";
  onProductSelect: (productId: number | "all") => void;
  timeFrame: "daily" | "monthly" | "yearly";
  onTimeFrameChange: (timeFrame: "daily" | "monthly" | "yearly") => void;
}

export const SalesView = memo(function SalesView({
  sales,
  products,
  isLoading,
  isError,
  selectedProduct,
  onProductSelect,
  timeFrame,
  onTimeFrameChange,
}: SalesViewProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const queryClient = useQueryClient();

  const processedData = useMemo(
    () => processTimeSeriesData(sales, timeFrame),
    [sales, timeFrame]
  );

  const topProducts = useMemo(
    () => calculateTopProducts(sales, products),
    [sales, products]
  );

  return (
    <Stack spacing={3} className="p-6">
      <Box>
        <Paper className="p-4 flex gap-4">
          <FormControl>
            <InputLabel>Filter by Product</InputLabel>
            <Select
              value={selectedProduct}
              label="Filter by Product"
              onChange={(e) =>
                onProductSelect(e.target.value as number | "all")
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
          <ToggleButtonGroup
            value={timeFrame}
            exclusive
            onChange={(_, value) => onTimeFrameChange(value)}
          >
            <ToggleButton value="daily">Daily</ToggleButton>
            <ToggleButton value="monthly">Monthly</ToggleButton>
            <ToggleButton value="yearly">Yearly</ToggleButton>
          </ToggleButtonGroup>
        </Paper>
      </Box>

      {isLoading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
          }}
        >
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Paper className="p-4">
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="subtitle1" color="error" gutterBottom>
              Unable to load sales data
            </Typography>
            <Button
              variant="outlined"
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ["sales"] })
              }
            >
              Try Again
            </Button>
          </Box>
        </Paper>
      ) : (
        <>
          <Box sx={{ display: "flex", gap: 3 }}>
            <Box sx={{ flex: 2 }}>
              <Paper className="p-4">
                <Typography variant="h6">Revenue Trend</Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={processedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      name="Revenue"
                      stroke="#8884d8"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Paper className="p-4">
                <Typography variant="h6">Top Products by Revenue</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={topProducts}
                      dataKey="revenue"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      fill="#8884d8"
                      label
                    >
                      {topProducts?.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={productColors[index % productColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Box>
          </Box>

          <Box>
            <Paper className="p-4">
              <Typography variant="h6">Sales Metrics</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={processedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="quantity"
                    name="Units Sold"
                    fill="#82ca9d"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="avgOrderValue"
                    name="Avg Order Value"
                    fill="#ffc658"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Box>

          <Box>
            <Paper className="p-4">
              <Typography variant="h6">Detailed Sales Data</Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">Units Sold</TableCell>
                    <TableCell align="right">Avg Order Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {processedData
                    ?.slice(
                      page * rowsPerPage,
                      page * rowsPerPage + rowsPerPage
                    )
                    .map((row) => (
                      <TableRow key={row.date}>
                        <TableCell>{row.date}</TableCell>
                        <TableCell align="right">
                          ${row.amount.toFixed(2)}
                        </TableCell>
                        <TableCell align="right">{row.quantity}</TableCell>
                        <TableCell align="right">
                          ${row.avgOrderValue.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={processedData?.length || 0}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
              />
            </Paper>
          </Box>
        </>
      )}
    </Stack>
  );
});
