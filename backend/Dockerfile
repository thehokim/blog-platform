# Use Go 1.22.2 as the base image
FROM golang:1.22.2 AS builder

# Set the working directory inside the container
WORKDIR /app

# Cache dependencies separately (Improves rebuild speed)
COPY go.mod go.sum ./
RUN go mod download && go mod verify

# Copy the source code after dependencies are cached
COPY . .

# Build the application with optimizations
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o blog-platform

# Use a smaller final image (scratch or alpine)
FROM alpine:latest

# Install necessary certificates
RUN apk --no-cache add ca-certificates

# Set working directory
WORKDIR /root/

# Copy the compiled binary from the builder stage
COPY --from=builder /app/blog-platform .

# Expose the application port
EXPOSE 8080

# Command to run the application
CMD ["./blog-platform"]
