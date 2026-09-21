package repository

import "time"

// Memory represents a user fact, preference, or goal recalled across sessions.
type Memory struct {
	ID         string    `json:"id"`
	Category   string    `json:"category"` // identity, project, goal, preference, concept
	Text       string    `json:"text"`
	ProjectID  string    `json:"projectId,omitempty"`
	DueDate    string    `json:"dueDate,omitempty"`
	Tags       []string  `json:"tags,omitempty"`
	Confidence float64   `json:"confidence"`
	CreatedAt  string    `json:"createdAt"`
	UpdatedAt  string    `json:"updatedAt"`
}

// VectorNode represents a 128-dimensional embedded concept or memory node.
type VectorNode struct {
	ID           string    `json:"id"`
	Label        string    `json:"label"`
	Type         string    `json:"type"` // person, project, goal, fact, study_notes, whiteboard_canvas, knowledge_deficit
	Category     string    `json:"category"`
	Description  string    `json:"description"`
	Source       string    `json:"source"`
	Embedding    []float64 `json:"embedding"`
	ClusterID    int       `json:"clusterId"`
	ClusterName  string    `json:"clusterName"`
	ClusterColor string    `json:"clusterColor"`
	Importance   int       `json:"importance"`
	MentionCount int       `json:"mentionCount"`
	Tags         []string  `json:"tags,omitempty"`
	ProjectID    string    `json:"projectId,omitempty"`
	DueDate      string    `json:"dueDate,omitempty"`
	CreatedAt    string    `json:"createdAt"`
}

// VectorEdge represents a high-dimensional semantic relationship between two nodes.
type VectorEdge struct {
	ID            string  `json:"id"`
	SourceID      string  `json:"sourceId"`
	TargetID      string  `json:"targetId"`
	Similarity    float64 `json:"similarity"`
	RelationLabel string  `json:"relationLabel"`
	IsExplicit    bool    `json:"isExplicit"`
}

// SemanticCluster represents one of Myraa's 5 cognitive semantic vector clusters.
type SemanticCluster struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Color string `json:"color"`
	Count int    `json:"count"`
}

// VectorKnowledgeGraph stores the entire vectorized project topology.
type VectorKnowledgeGraph struct {
	Nodes               []VectorNode      `json:"nodes"`
	Edges               []VectorEdge      `json:"edges"`
	Clusters            []SemanticCluster `json:"clusters"`
	LastUpdated         string            `json:"lastUpdated"`
	EmbeddingDimensions int               `json:"embeddingDimensions"`
	Density             float64           `json:"density"`
}

// ChatMessage represents a conversation turn.
type ChatMessage struct {
	ID        string `json:"id"`
	Role      string `json:"role"` // user or model
	Text      string `json:"text"`
	Timestamp string `json:"timestamp"`
}

// DailyTask represents an educational or project goal.
type DailyTask struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description,omitempty"`
	Completed   bool   `json:"completed"`
	Priority    string `json:"priority"` // low, medium, high
	DueDate     string `json:"dueDate,omitempty"`
	Category    string `json:"category,omitempty"`
	CreatedAt   string `json:"createdAt"`
}

// ProjectArtifacts contains whole-project content for vector ingestion.
type ProjectArtifacts struct {
	StudyNotes       string      `json:"studyNotes"`
	ChalkboardSlates []SlateItem `json:"chalkboardSlates"`
	Deficits         []DeficitItem `json:"deficits"`
}

type SlateItem struct {
	Title    string `json:"title"`
	Notes    string `json:"notes"`
	Drawings []any  `json:"drawings"`
}

type DeficitItem struct {
	ID         string `json:"id"`
	Topic      string `json:"topic"`
	UserPrompt string `json:"userPrompt"`
}

// NowTimestamp helper returns ISO 8601 current timestamp.
func NowTimestamp() string {
	return time.Now().UTC().Format(time.RFC3339)
}
