import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import { Box, Typography, Button } from "@mui/material";

function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <Box
      role="alert"
      sx={{
        p: 4,
        m: 4,
        bgcolor: "#e6d1d1",
        borderRadius: 1,
        border: 1,
        borderColor: "error.main",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <Typography variant="h6" color="error" gutterBottom>
        Something went wrong
      </Typography>
      <Typography color="text.secondary" className="mb-4">
        {error.message}
      </Typography>
      <Button
        variant="contained"
        color="primary"
        size="large"
        sx={{ mt: 2 }}
        onClick={resetErrorBoundary}
      >
        Try again
      </Button>
    </Box>
  );
}

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        window.location.reload();
      }}
      onError={(error: Error) => {
        console.error("Error caught by boundary:", error);
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}
