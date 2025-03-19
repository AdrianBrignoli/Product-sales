# Development stage
FROM golang:1.21

WORKDIR /app

# Install air for hot reloading
RUN go install github.com/cosmtrek/air@latest

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the code
COPY . .

# Run with hot reload
CMD ["air"] 