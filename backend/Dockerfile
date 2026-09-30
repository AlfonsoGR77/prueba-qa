# --- build ---
FROM golang:1.26-alpine AS build
WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/api ./cmd/api

# --- runtime ---
FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /app

COPY --from=build /out/api /app/api
# Los CSV se leen al arrancar (DATA_DIR=data por defecto).
COPY data /app/data

ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["/app/api"]
