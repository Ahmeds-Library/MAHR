package repository

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
)

// Store provides thread-safe file-backed persistence for memories, history, and vector graphs.
type Store struct {
	mu             sync.RWMutex
	memoryFile     string
	historyFile    string
	vectorFile     string
	tasksFile      string
}

// NewStore initializes file paths and ensures store files exist.
func NewStore(dataDir string) (*Store, error) {
	if dataDir == "" {
		dataDir = "."
	}
	s := &Store{
		memoryFile:  filepath.Join(dataDir, "memories.json"),
		historyFile: filepath.Join(dataDir, "server_chat_history.json"),
		vectorFile:  filepath.Join(dataDir, "vector_knowledge_graph.json"),
		tasksFile:   filepath.Join(dataDir, "daily_tasks.json"),
	}

	// Ensure files exist with empty JSON arrays/objects
	s.ensureFile(s.memoryFile, "[]")
	s.ensureFile(s.historyFile, "[]")
	s.ensureFile(s.tasksFile, "[]")

	return s, nil
}

func (s *Store) ensureFile(path string, defaultContent string) {
	if _, err := os.Stat(path); os.IsNotExist(err) {
		_ = os.WriteFile(path, []byte(defaultContent), 0644)
	}
}

// LoadMemories reads memories with read lock.
func (s *Store) LoadMemories() ([]Memory, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	data, err := os.ReadFile(s.memoryFile)
	if err != nil {
		if os.IsNotExist(err) {
			return []Memory{}, nil
		}
		return nil, err
	}
	if len(data) == 0 {
		return []Memory{}, nil
	}

	var memories []Memory
	if err := json.Unmarshal(data, &memories); err != nil {
		return []Memory{}, nil
	}
	return memories, nil
}

// SaveMemories writes memories atomically with write lock.
func (s *Store) SaveMemories(memories []Memory) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	data, err := json.MarshalIndent(memories, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.memoryFile, data, 0644)
}

// LoadChatHistory reads conversation messages.
func (s *Store) LoadChatHistory() ([]ChatMessage, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	data, err := os.ReadFile(s.historyFile)
	if err != nil {
		if os.IsNotExist(err) {
			return []ChatMessage{}, nil
		}
		return nil, err
	}
	var msgs []ChatMessage
	if err := json.Unmarshal(data, &msgs); err != nil {
		return []ChatMessage{}, nil
	}
	return msgs, nil
}

// SaveChatHistory writes conversation turns.
func (s *Store) SaveChatHistory(msgs []ChatMessage) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	data, err := json.MarshalIndent(msgs, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.historyFile, data, 0644)
}

// LoadVectorGraph reads cached vector knowledge graph.
func (s *Store) LoadVectorGraph() (*VectorKnowledgeGraph, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	data, err := os.ReadFile(s.vectorFile)
	if err != nil {
		return &VectorKnowledgeGraph{Nodes: []VectorNode{}, Edges: []VectorEdge{}, EmbeddingDimensions: 128}, nil
	}
	var graph VectorKnowledgeGraph
	if err := json.Unmarshal(data, &graph); err != nil {
		return &VectorKnowledgeGraph{Nodes: []VectorNode{}, Edges: []VectorEdge{}, EmbeddingDimensions: 128}, nil
	}
	return &graph, nil
}

// SaveVectorGraph writes cached vector graph.
func (s *Store) SaveVectorGraph(graph *VectorKnowledgeGraph) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	data, err := json.MarshalIndent(graph, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.vectorFile, data, 0644)
}

// LoadTasks reads daily tasks.
func (s *Store) LoadTasks() ([]DailyTask, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	data, err := os.ReadFile(s.tasksFile)
	if err != nil {
		return []DailyTask{}, nil
	}
	var tasks []DailyTask
	if err := json.Unmarshal(data, &tasks); err != nil {
		return []DailyTask{}, nil
	}
	return tasks, nil
}

// SaveTasks writes daily tasks.
func (s *Store) SaveTasks(tasks []DailyTask) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	data, err := json.MarshalIndent(tasks, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.tasksFile, data, 0644)
}
