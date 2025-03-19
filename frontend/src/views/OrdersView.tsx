import { memo, useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Typography,
  CircularProgress,
} from "@mui/material";
import { Product, Order } from "../services/api";
import { calculateStockSummary } from "../utils/orderDataProcessing";

interface OrdersViewProps {
  orders: Order[] | undefined;
  products: Product[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onCreateOrder: (order: {
    product_id: number;
    quantity: number;
    status: string;
  }) => void;
  onDeleteOrder: (id: number) => void;
}

export const OrdersView = memo(function OrdersView({
  orders,
  products,
  isLoading,
  isError,
  onCreateOrder,
  onDeleteOrder,
}: OrdersViewProps) {
  const [open, setOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({
    product_id: "",
    quantity: "",
    status: "pending",
  });

  const stockSummary = useMemo(
    () => calculateStockSummary(orders, products),
    [orders, products]
  );

  return (
    <div className="p-6">
      <Typography variant="h4" gutterBottom>
        Stock Summary
      </Typography>
      <TableContainer component={Paper} className="mb-6">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell align="right">Current Stock</TableCell>
              <TableCell align="right">Incoming</TableCell>
              <TableCell align="right">Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stockSummary?.map((product, i) => (
              <TableRow key={i}>
                <TableCell>{product.name}</TableCell>
                <TableCell align="right">{product.currentStock}</TableCell>
                <TableCell align="right">{product.incomingStock}</TableCell>
                <TableCell align="right">
                  {product.currentStock + product.incomingStock}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <div className="flex justify-between items-center mb-6">
        <Typography variant="h4">Orders</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>
          New Order
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <CircularProgress />
        </div>
      ) : isError ? (
        <Paper className="p-4">
          <Typography color="error">Failed to load orders</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>
                    {products?.find((p) => p.id === order.product_id)?.name}
                  </TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>{order.status}</TableCell>
                  <TableCell>
                    {new Date(order.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {order.status === "pending" ? (
                      <Button
                        color="error"
                        onClick={() => onDeleteOrder(order.id)}
                      >
                        Cancel Order
                      </Button>
                    ) : (
                      <Button
                        color="info"
                        onClick={() => {
                          /* TODO: Show order details dialog */
                        }}
                      >
                        View Details
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>New Order</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Product"
            value={newOrder.product_id}
            onChange={(e) =>
              setNewOrder({ ...newOrder, product_id: e.target.value })
            }
            className="mb-4"
          >
            {products?.map((product) => (
              <MenuItem key={product.id} value={product.id}>
                {product.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Quantity"
            type="number"
            value={newOrder.quantity}
            onChange={(e) =>
              setNewOrder({ ...newOrder, quantity: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              onCreateOrder({
                product_id: parseInt(newOrder.product_id),
                quantity: parseInt(newOrder.quantity),
                status: newOrder.status,
              });
              setOpen(false);
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
});
