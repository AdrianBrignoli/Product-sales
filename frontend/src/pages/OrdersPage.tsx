import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
} from "@mui/material";
import {
  getOrders,
  createOrder,
  deleteOrder,
  getProducts,
} from "../services/api";

export default function OrdersPage() {
  const [open, setOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({
    product_id: "",
    quantity: "",
    status: "pending",
  });

  const queryClient = useQueryClient();

  const { data: orders } = useQuery({
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
      setOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Typography variant="h4">Orders</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>
          New Order
        </Button>
      </div>

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
                  <Button
                    color="error"
                    onClick={() => deleteMutation.mutate(order.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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
            onClick={() =>
              createMutation.mutate({
                product_id: parseInt(newOrder.product_id),
                quantity: parseInt(newOrder.quantity),
                status: newOrder.status,
              })
            }
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
