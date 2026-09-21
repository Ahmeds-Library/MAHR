package api

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"myraa-backend/repository"
	"myraa-backend/services"
)

// APIHandler coordinates HTTP requests across services and repositories.
type APIHandler struct {
	store *repository.Store
	memSvc *services.MemoryService
	ve     *services.VectorEngine
}

func NewAPIHandler(store *repository.Store, memSvc *services.MemoryService, ve *services.VectorEngine) *APIHandler {
	return &APIHandler{
		store:  store,
		memSvc: memSvc,
		ve:     ve,
	}
}

// JSON responds with JSON payload.
func JSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

// HealthCheck handles GET /api/health
func (h *APIHandler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	JSON(w, http.StatusOK, map[string]any{
		"status":  "ok",
		"backend": "golang-1.22",
		"engine":  "128-d-vector-engine",
		"time":    repository.NowTimestamp(),
	})
}

// HandleGetMemories handles GET /api/memory
func (h *APIHandler) HandleGetMemories(w http.ResponseWriter, r *http.Request) {
	memories, err := h.store.LoadMemories()
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to load memories"})
		return
	}
	JSON(w, http.StatusOK, map[string]any{"memories": memories})
}

// HandlePostMemory handles POST /api/memory with deduplication
func (h *APIHandler) HandlePostMemory(w http.ResponseWriter, r *http.Request) {
	var body repository.Memory
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		JSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
		return
	}

	savedMem, reinforced, err := h.memSvc.StoreMemoryWithDeduplication(body, 0.82)
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to store memory"})
		return
	}

	JSON(w, http.StatusOK, map[string]any{
		"success":    true,
		"memory":     savedMem,
		"reinforced": reinforced,
	})
}

// HandleDeleteMemory handles DELETE /api/memory/:id
func (h *APIHandler) HandleDeleteMemory(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/memory/")
	if id == "" {
		JSON(w, http.StatusBadRequest, map[string]string{"error": "Memory ID required"})
		return
	}

	memories, err := h.store.LoadMemories()
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to load memories"})
		return
	}

	filtered := make([]repository.Memory, 0)
	found := false
	for _, m := range memories {
		if m.ID == id {
			found = true
			continue
		}
		filtered = append(filtered, m)
	}

	if !found {
		JSON(w, http.StatusNotFound, map[string]string{"error": "Memory not found"})
		return
	}

	_ = h.store.SaveMemories(filtered)
	JSON(w, http.StatusOK, map[string]any{"success": true, "deletedId": id})
}

// HandleSemanticCheck handles POST /api/memory/semantic-check
func (h *APIHandler) HandleSemanticCheck(w http.ResponseWriter, r *http.Request) {
	var req struct {
		CandidateFact string  `json:"candidateFact"`
		Threshold     float64 `json:"threshold"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		JSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
		return
	}
	if req.Threshold <= 0 {
		req.Threshold = 0.82
	}

	match, err := h.memSvc.FindSemanticallySimilar(req.CandidateFact, req.Threshold)
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "Semantic search failed"})
		return
	}

	JSON(w, http.StatusOK, map[string]any{
		"success":    true,
		"match":      match,
		"hasSimilar": match != nil,
	})
}

// HandleVectorQuery handles POST /api/vector-memory/query
func (h *APIHandler) HandleVectorQuery(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Query         string  `json:"query"`
		TopK          int     `json:"topK"`
		MinSimilarity float64 `json:"minSimilarity"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		JSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
		return
	}
	if req.TopK <= 0 {
		req.TopK = 5
	}
	if req.MinSimilarity <= 0 {
		req.MinSimilarity = 0.28
	}

	graph, err := h.store.LoadVectorGraph()
	if err != nil || len(graph.Nodes) == 0 {
		// Lazily generate graph
		graph, _ = h.memSvc.BuildVectorGraph(nil)
	}

	matches := h.ve.QueryVectorGraph(req.Query, graph, req.TopK, req.MinSimilarity)
	JSON(w, http.StatusOK, map[string]any{
		"success":      true,
		"query":        req.Query,
		"topMatches":   matches,
		"totalIndexed": len(graph.Nodes),
	})
}

// HandleVectorIngestArtifacts handles POST /api/vector-memory/ingest-artifacts
func (h *APIHandler) HandleVectorIngestArtifacts(w http.ResponseWriter, r *http.Request) {
	var artifacts repository.ProjectArtifacts
	if err := json.NewDecoder(r.Body).Decode(&artifacts); err != nil {
		JSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
		return
	}

	graph, err := h.memSvc.BuildVectorGraph(&artifacts)
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to ingest artifacts"})
		return
	}

	JSON(w, http.StatusOK, map[string]any{
		"success":   true,
		"nodeCount": len(graph.Nodes),
		"edgeCount": len(graph.Edges),
		"density":   graph.Density,
	})
}

// HandleGetVectorNetwork handles GET /api/knowledge-graph/vector-network
func (h *APIHandler) HandleGetVectorNetwork(w http.ResponseWriter, r *http.Request) {
	graph, err := h.store.LoadVectorGraph()
	if err != nil || len(graph.Nodes) == 0 {
		graph, _ = h.memSvc.BuildVectorGraph(nil)
	}
	JSON(w, http.StatusOK, map[string]any{"success": true, "graph": graph})
}

// HandleGetDailyTasks handles GET /api/daily-tasks
func (h *APIHandler) HandleGetDailyTasks(w http.ResponseWriter, r *http.Request) {
	tasks, err := h.store.LoadTasks()
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to load tasks"})
		return
	}
	JSON(w, http.StatusOK, map[string]any{"tasks": tasks})
}

// HandlePostDailyTasks handles POST /api/daily-tasks
func (h *APIHandler) HandlePostDailyTasks(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Tasks []repository.DailyTask `json:"tasks"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		JSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
		return
	}
	_ = h.store.SaveTasks(body.Tasks)
	JSON(w, http.StatusOK, map[string]any{"success": true, "tasks": body.Tasks})
}

// HandleGetChatHistory handles GET /api/chat-history
func (h *APIHandler) HandleGetChatHistory(w http.ResponseWriter, r *http.Request) {
	history, err := h.store.LoadChatHistory()
	if err != nil {
		JSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to load chat history"})
		return
	}
	JSON(w, http.StatusOK, map[string]any{"history": history})
}

// HandlePostChatHistory handles POST /api/chat-history
func (h *APIHandler) HandlePostChatHistory(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Messages []repository.ChatMessage `json:"messages"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		JSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
		return
	}
	_ = h.store.SaveChatHistory(body.Messages)
	JSON(w, http.StatusOK, map[string]any{"success": true, "count": len(body.Messages)})
}
