package services

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// GeminiLiveRelay manages the bidirectional audio/text websocket connection between client and Gemini Live API.
type GeminiLiveRelay struct {
	apiKey      string
	clientConn  *websocket.Conn
	geminiConn  *websocket.Conn
	mu          sync.Mutex
	isClosed    bool
	systemPrompt string
}

// NewGeminiLiveRelay establishes a relay instance.
func NewGeminiLiveRelay(clientConn *websocket.Conn, systemPrompt string) *GeminiLiveRelay {
	apiKey := os.Getenv("GEMINI_API_KEY")
	return &GeminiLiveRelay{
		apiKey:       apiKey,
		clientConn:   clientConn,
		systemPrompt: systemPrompt,
	}
}

// Start bridges client audio and Gemini live websocket messages.
func (r *GeminiLiveRelay) Start() error {
	if r.apiKey == "" {
		return fmt.Errorf("GEMINI_API_KEY is not set in environment")
	}

	// Gemini Live API endpoint
	geminiHost := "generativelanguage.googleapis.com"
	geminiPath := "/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent"
	u := url.URL{
		Scheme:   "wss",
		Host:     geminiHost,
		Path:     geminiPath,
		RawQuery: fmt.Sprintf("key=%s", r.apiKey),
	}

	header := http.Header{}
	geminiWs, _, err := websocket.DefaultDialer.Dial(u.String(), header)
	if err != nil {
		log.Printf("[GeminiRelay] Dial error: %v", err)
		return err
	}
	r.geminiConn = geminiWs

	// Send initial setup frame with system instructions and audio modalities
	setupPayload := map[string]any{
		"setup": map[string]any{
			"model": "models/gemini-2.0-flash-exp",
			"generationConfig": map[string]any{
				"responseModalities": []string{"AUDIO"},
				"speechConfig": map[string]any{
					"voiceConfig": map[string]any{
						"prebuiltVoiceConfig": map[string]any{
							"voiceName": "Puck",
						},
					},
				},
			},
			"systemInstruction": map[string]any{
				"parts": []map[string]any{
					{"text": r.systemPrompt},
				},
			},
		},
	}

	setupBytes, _ := json.Marshal(setupPayload)
	if err := r.geminiConn.WriteMessage(websocket.TextMessage, setupBytes); err != nil {
		log.Printf("[GeminiRelay] Setup write error: %v", err)
		return err
	}

	// Goroutine 1: Forward from client to Gemini
	go func() {
		defer r.Close()
		for {
			msgType, data, err := r.clientConn.ReadMessage()
			if err != nil {
				break
			}
			r.mu.Lock()
			if !r.isClosed && r.geminiConn != nil {
				_ = r.geminiConn.WriteMessage(msgType, data)
			}
			r.mu.Unlock()
		}
	}()

	// Goroutine 2: Forward from Gemini to client
	go func() {
		defer r.Close()
		for {
			msgType, data, err := r.geminiConn.ReadMessage()
			if err != nil {
				break
			}
			r.mu.Lock()
			if !r.isClosed && r.clientConn != nil {
				_ = r.clientConn.WriteMessage(msgType, data)
			}
			r.mu.Unlock()
		}
	}()

	return nil
}

// Close gracefully closes both websockets.
func (r *GeminiLiveRelay) Close() {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.isClosed {
		return
	}
	r.isClosed = true
	if r.geminiConn != nil {
		_ = r.geminiConn.WriteControl(websocket.CloseMessage, []byte{}, time.Now().Add(time.Second))
		_ = r.geminiConn.Close()
	}
	if r.clientConn != nil {
		_ = r.clientConn.Close()
	}
}
