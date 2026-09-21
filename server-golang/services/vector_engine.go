package services

import (
	"math"
	"strings"
	"sync"

	"myraa-backend/repository"
)

var DefaultSemanticClusters = []repository.SemanticCluster{
	{ID: 0, Name: "Identity & Personal Context", Color: "#ec4899"},
	{ID: 1, Name: "Active Projects & Deadlines", Color: "#8b5cf6"},
	{ID: 2, Name: "Academic & Technical Concepts", Color: "#3b82f6"},
	{ID: 3, Name: "Study Goals & Curricula", Color: "#10b981"},
	{ID: 4, Name: "Preferences & Habit Profiles", Color: "#f59e0b"},
}

// VectorEngine handles 128-D embedding calculations, cosine similarity, and graph synthesis.
type VectorEngine struct {
	workerPoolSize int
}

// NewVectorEngine initializes the vector engine.
func NewVectorEngine(poolSize int) *VectorEngine {
	if poolSize <= 0 {
		poolSize = 4
	}
	return &VectorEngine{workerPoolSize: poolSize}
}

// ComputeEmbedding generates a 128-dimensional normalized embedding vector.
func (ve *VectorEngine) ComputeEmbedding(text string, tags ...string) []float64 {
	vec := make([]float64, 128)
	if text == "" && len(tags) == 0 {
		return vec
	}

	normText := strings.ToLower(text)
	words := strings.Fields(normText)

	// Dimension allocations:
	// 0-31: Word hashing & n-gram lexical distribution
	for _, word := range words {
		var h uint32 = 2166136261
		for i := 0; i < len(word); i++ {
			h ^= uint32(word[i])
			h *= 16777619
		}
		idx := int(h % 32)
		vec[idx] += 1.0
	}

	// 32-63: Character bigram frequencies
	for i := 0; i < len(normText)-1; i++ {
		bg := (int(normText[i])*31 + int(normText[i+1])) % 32
		vec[32+bg] += 0.5
	}

	// 64-123: Semantic domain activations
	domains := map[string][]int{
		"identity":   {64, 65, 66, 67, 68},
		"project":    {76, 77, 78, 79, 80},
		"study":      {88, 89, 90, 91, 92},
		"exam":       {88, 89, 90, 91, 92},
		"goal":       {100, 101, 102, 103, 104},
		"preference": {112, 113, 114, 115, 116},
		"physics":    {88, 93, 94},
		"math":       {89, 95, 96},
		"code":       {77, 81, 82},
		"diagram":    {78, 83, 84},
	}

	for kw, dims := range domains {
		if strings.Contains(normText, kw) {
			for _, d := range dims {
				if d < 124 {
					vec[d] += 2.0
				}
			}
		}
	}

	// Ingest tags
	for _, tag := range tags {
		lowerTag := strings.ToLower(tag)
		var h uint32 = 5381
		for i := 0; i < len(lowerTag); i++ {
			h = ((h << 5) + h) + uint32(lowerTag[i])
		}
		idx := int(64 + (h % 60))
		vec[idx] += 3.0
	}

	// Normalize vector (L2 Unit Norm)
	var normSq float64
	for _, v := range vec {
		normSq += v * v
	}
	if normSq > 0 {
		norm := math.Sqrt(normSq)
		for i := range vec {
			vec[i] /= norm
		}
	}

	return vec
}

// CosineSimilarity computes dot product of two normalized 128-D vectors.
func (ve *VectorEngine) CosineSimilarity(a, b []float64) float64 {
	if len(a) != 128 || len(b) != 128 {
		return 0
	}
	var dot float64
	for i := 0; i < 128; i++ {
		dot += a[i] * b[i]
	}
	if dot < -1.0 {
		return -1.0
	}
	if dot > 1.0 {
		return 1.0
	}
	return dot
}

// QueryResult represents a vector search match.
type QueryResult struct {
	Node       repository.VectorNode `json:"node"`
	Similarity float64               `json:"similarity"`
}

// QueryVectorGraph concurrently searches graph nodes for highest cosine similarity.
func (ve *VectorEngine) QueryVectorGraph(
	query string,
	graph *repository.VectorKnowledgeGraph,
	topK int,
	minSim float64,
) []QueryResult {
	if graph == nil || len(graph.Nodes) == 0 {
		return nil
	}
	if topK <= 0 {
		topK = 5
	}

	queryVec := ve.ComputeEmbedding(query)

	// Goroutine worker pool for parallel batch cosine scoring
	numNodes := len(graph.Nodes)
	resultsChan := make(chan QueryResult, numNodes)
	var wg sync.WaitGroup

	numWorkers := ve.workerPoolSize
	if numWorkers > numNodes {
		numWorkers = numNodes
	}
	if numWorkers < 1 {
		numWorkers = 1
	}

	chunkSize := (numNodes + numWorkers - 1) / numWorkers

	for w := 0; w < numWorkers; w++ {
		start := w * chunkSize
		end := start + chunkSize
		if end > numNodes {
			end = numNodes
		}
		if start >= end {
			break
		}

		wg.Add(1)
		go func(slice []repository.VectorNode) {
			defer wg.Done()
			for _, node := range slice {
				sim := ve.CosineSimilarity(queryVec, node.Embedding)
				if sim >= minSim {
					resultsChan <- QueryResult{
						Node:       node,
						Similarity: math.Round(sim*1000) / 1000,
					}
				}
			}
		}(graph.Nodes[start:end])
	}

	wg.Wait()
	close(resultsChan)

	var collected []QueryResult
	for r := range resultsChan {
		collected = append(collected, r)
	}

	// Sort descending by similarity
	for i := 0; i < len(collected); i++ {
		for j := i + 1; j < len(collected); j++ {
			if collected[j].Similarity > collected[i].Similarity {
				collected[i], collected[j] = collected[j], collected[i]
			}
		}
	}

	if len(collected) > topK {
		collected = collected[:topK]
	}

	return collected
}
