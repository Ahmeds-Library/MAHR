package api

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
	"myraa-backend/services"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for local & iframe development
	},
}

// HandleLiveRelay upgrades HTTP to WebSocket and connects client to Gemini Live API.
func (h *APIHandler) HandleLiveRelay(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[LiveRelay] Upgrade error: %v", err)
		return
	}

	systemInstruction := "You are Myraa, an empathetic, hyper-intelligent, bilingual learning companion and voice mentor."
	relay := services.NewGeminiLiveRelay(conn, systemInstruction)
	if err := relay.Start(); err != nil {
		log.Printf("[LiveRelay] Start error: %v", err)
		_ = conn.Close()
	}
}
