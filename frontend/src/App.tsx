import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, createTheme } from "@mui/material";
import Layout from "./components/Layout";
import SalesPage from "./pages/SalesPage";
import OrdersPage from "./pages/OrdersPage";
import { ErrorBoundary } from "./components/ErrorBoundary";

const queryClient = new QueryClient();
const theme = createTheme({
  palette: {
    primary: {
      main: "#2E7D32",
    },
    secondary: {
      main: "#FF6B6B",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontSize: "2.5rem",
      fontWeight: 700,
      color: "#2E7D32",
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <Router>
            <Routes>
              <Route element={<Layout />}>
                <Route
                  path="/"
                  element={
                    <ErrorBoundary>
                      <SalesPage />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ErrorBoundary>
                      <OrdersPage />
                    </ErrorBoundary>
                  }
                />
              </Route>
            </Routes>
          </Router>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
