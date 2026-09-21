package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"myraa-backend/api"
	"myraa-backend/repository"
	"myraa-backend/services"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	dataDir := os.Getenv("DATA_DIR")
	if dataDir == "" {
		dataDir = "."
	}

	distDir := os.Getenv("DIST_DIR")
	if distDir == "" {
		distDir = "../dist"
	}

	log.Printf("[Myraa Golang Backend] Initializing 3-Layer Architecture...")

	// Layer 3: Repository / Store
	store, err := repository.NewStore(dataDir)
	if err != nil {
		log.Fatalf("Failed to initialize repository store: %v", err)
	}

	// Layer 2: Services
	vectorEngine := services.NewVectorEngine(4)
	memoryService := services.NewMemoryService(store, vectorEngine)

	// Layer 1: API Handlers & Router
	apiHandler := api.NewAPIHandler(store, memoryService, vectorEngine)
	router := api.SetupRouter(apiHandler, distDir)

	addr := fmt.Sprintf("0.0.0.0:%s", port)
	log.Printf("[Myraa Golang Backend] Server listening on http://%s", addr)
	log.Printf("[Myraa Golang Backend] Live Vector Engine: 128-D embedding space with Goroutine parallel scoring")
	log.Printf("[Myraa Golang Backend] Semantic deduplication threshold: 0.82")

	if err := http.ListenAndServe(addr, router); err != nil {
		log.Fatalf("HTTP server error: %v", err)
	}
}
