import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, createTheme } from "@mui/material";
import Layout from "./components/Layout";
import SalesPage from "./pages/SalesPage";
import OrdersPage from "./pages/OrdersPage";

const queryClient = new QueryClient();
const theme = createTheme({
  palette: {
    primary: {
      main: "#2E7D32", // Green instead of blue
    },
    secondary: {
      main: "#FF6B6B", // Coral instead of pink
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontSize: "2.5rem", // Much larger
      fontWeight: 700, // Bolder
      color: "#2E7D32", // Green text
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <Router>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<SalesPage />} />
              <Route path="/orders" element={<OrdersPage />} />
            </Route>
          </Routes>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
