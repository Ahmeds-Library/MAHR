package services

import (
	"fmt"
	"math"
	"strings"

	"myraa-backend/repository"
)

// MemoryService provides high-level memory operations, semantic deduplication, and vector graph building.
type MemoryService struct {
	store *repository.Store
	ve    *VectorEngine
}

// NewMemoryService initializes the service.
func NewMemoryService(store *repository.Store, ve *VectorEngine) *MemoryService {
	return &MemoryService{store: store, ve: ve}
}

// SemanticMatch represents an existing memory match.
type SemanticMatch struct {
	Memory     repository.Memory `json:"memory"`
	Similarity float64           `json:"similarity"`
	Index      int               `json:"index"`
}

// FindSemanticallySimilar checks if a candidate text matches an existing memory above threshold.
func (ms *MemoryService) FindSemanticallySimilar(candidate string, threshold float64) (*SemanticMatch, error) {
	memories, err := ms.store.LoadMemories()
	if err != nil {
		return nil, err
	}
	if len(memories) == 0 || strings.TrimSpace(candidate) == "" {
		return nil, nil
	}

	candEmb := ms.ve.ComputeEmbedding(candidate)
	bestSim := -1.0
	bestIdx := -1
	var bestMem repository.Memory

	for i, mem := range memories {
		fullText := fmt.Sprintf("%s %s %s %s", mem.Text, mem.Category, mem.ProjectID, strings.Join(mem.Tags, " "))
		memEmb := ms.ve.ComputeEmbedding(fullText, mem.Tags...)
		sim := ms.ve.CosineSimilarity(candEmb, memEmb)
		if sim > bestSim {
			bestSim = sim
			bestIdx = i
			bestMem = mem
		}
	}

	if bestSim >= threshold && bestIdx >= 0 {
		return &SemanticMatch{
			Memory:     bestMem,
			Similarity: math.Round(bestSim*1000) / 1000,
			Index:      bestIdx,
		}, nil
	}

	return nil, nil
}

// StoreMemoryWithDeduplication checks semantic similarity before saving.
// If similar, reinforces confidence and merges tags; otherwise appends novel memory.
func (ms *MemoryService) StoreMemoryWithDeduplication(newMem repository.Memory, threshold float64) (repository.Memory, bool, error) {
	memories, err := ms.store.LoadMemories()
	if err != nil {
		return newMem, false, err
	}

	match, err := ms.FindSemanticallySimilar(newMem.Text, threshold)
	if err != nil {
		return newMem, false, err
	}

	if match != nil {
		// Reinforce existing memory
		idx := match.Index
		existing := memories[idx]
		existing.Confidence = math.Min(1.0, math.Round((existing.Confidence+0.1)*100)/100)
		existing.UpdatedAt = repository.NowTimestamp()

		// Merge tags
		tagSet := make(map[string]bool)
		for _, t := range existing.Tags {
			tagSet[t] = true
		}
		for _, t := range newMem.Tags {
			if !tagSet[t] {
				existing.Tags = append(existing.Tags, t)
				tagSet[t] = true
			}
		}

		if newMem.ProjectID != "" {
			existing.ProjectID = newMem.ProjectID
		}
		if newMem.DueDate != "" {
			existing.DueDate = newMem.DueDate
		}

		memories[idx] = existing
		_ = ms.store.SaveMemories(memories)
		return existing, true, nil
	}

	// Append novel memory
	if newMem.ID == "" {
		newMem.ID = fmt.Sprintf("mem_%d", len(memories)+1)
	}
	newMem.CreatedAt = repository.NowTimestamp()
	newMem.UpdatedAt = repository.NowTimestamp()
	if newMem.Confidence <= 0 {
		newMem.Confidence = 0.85
	}

	memories = append([]repository.Memory{newMem}, memories...)
	_ = ms.store.SaveMemories(memories)
	return newMem, false, nil
}

// BuildVectorGraph constructs the unified 128-D vector topology for memories and whole-project artifacts.
func (ms *MemoryService) BuildVectorGraph(artifacts *repository.ProjectArtifacts) (*repository.VectorKnowledgeGraph, error) {
	memories, err := ms.store.LoadMemories()
	if err != nil {
		return nil, err
	}

	nodes := make([]repository.VectorNode, 0)
	nodeMap := make(map[string]repository.VectorNode)

	// Ingest memories
	for _, mem := range memories {
		emb := ms.ve.ComputeEmbedding(mem.Text, mem.Tags...)
		cluster := DefaultSemanticClusters[2]
		switch mem.Category {
		case "identity":
			cluster = DefaultSemanticClusters[0]
		case "project":
			cluster = DefaultSemanticClusters[1]
		case "goal":
			cluster = DefaultSemanticClusters[3]
		case "preference":
			cluster = DefaultSemanticClusters[4]
		}

		node := repository.VectorNode{
			ID:           mem.ID,
			Label:        mem.Text,
			Type:         mem.Category,
			Category:     mem.Category,
			Description:  mem.Text,
			Source:       "transcript_fact",
			Embedding:    emb,
			ClusterID:    cluster.ID,
			ClusterName:  cluster.Name,
			ClusterColor: cluster.Color,
			Importance:   4,
			MentionCount: 1,
			Tags:         mem.Tags,
			ProjectID:    mem.ProjectID,
			DueDate:      mem.DueDate,
			CreatedAt:    mem.CreatedAt,
		}
		nodes = append(nodes, node)
		nodeMap[node.ID] = node
	}

	// Ingest artifacts if provided
	if artifacts != nil {
		// Study notes
		if len(artifacts.StudyNotes) > 20 {
			sections := strings.Split(artifacts.StudyNotes, "\n###")
			for i, sec := range sections {
				if len(sec) < 15 {
					continue
				}
				emb := ms.ve.ComputeEmbedding(sec, "study_notes", "academic")
				node := repository.VectorNode{
					ID:           fmt.Sprintf("notes_%d", i),
					Label:        fmt.Sprintf("Study Note #%d", i+1),
					Type:         "study_notes",
					Category:     "academic",
					Description:  sec,
					Source:       "study_notes",
					Embedding:    emb,
					ClusterID:    DefaultSemanticClusters[2].ID,
					ClusterName:  DefaultSemanticClusters[2].Name,
					ClusterColor: DefaultSemanticClusters[2].Color,
					Importance:   4,
					MentionCount: 1,
					CreatedAt:    repository.NowTimestamp(),
				}
				nodes = append(nodes, node)
				nodeMap[node.ID] = node
			}
		}

		// Chalkboard Slates
		for i, slate := range artifacts.ChalkboardSlates {
			title := slate.Title
			if title == "" {
				title = fmt.Sprintf("Classroom Slate %d", i+1)
			}
			emb := ms.ve.ComputeEmbedding(title+" "+slate.Notes, "whiteboard", "diagram")
			node := repository.VectorNode{
				ID:           fmt.Sprintf("slate_%d", i),
				Label:        title,
				Type:         "whiteboard_canvas",
				Category:     "technical",
				Description:  slate.Notes,
				Source:       "whiteboard_canvas",
				Embedding:    emb,
				ClusterID:    DefaultSemanticClusters[1].ID,
				ClusterName:  DefaultSemanticClusters[1].Name,
				ClusterColor: DefaultSemanticClusters[1].Color,
				Importance:   3,
				MentionCount: 1,
				CreatedAt:    repository.NowTimestamp(),
			}
			nodes = append(nodes, node)
			nodeMap[node.ID] = node
		}

		// Knowledge Deficits
		for _, def := range artifacts.Deficits {
			emb := ms.ve.ComputeEmbedding(def.Topic+" deficit reinforcement", "deficit", "review")
			node := repository.VectorNode{
				ID:           fmt.Sprintf("def_%s", def.ID),
				Label:        "Review: " + def.Topic,
				Type:         "knowledge_deficit",
				Category:     "goal",
				Description:  def.UserPrompt,
				Source:       "knowledge_deficit",
				Embedding:    emb,
				ClusterID:    DefaultSemanticClusters[3].ID,
				ClusterName:  DefaultSemanticClusters[3].Name,
				ClusterColor: DefaultSemanticClusters[3].Color,
				Importance:   4,
				MentionCount: 1,
				CreatedAt:    repository.NowTimestamp(),
			}
			nodes = append(nodes, node)
			nodeMap[node.ID] = node
		}
	}

	// Synthesize Edges via Pairwise Cosine Similarity
	edges := make([]repository.VectorEdge, 0)
	n := len(nodes)
	for i := 0; i < n; i++ {
		for j := i + 1; j < n; j++ {
			sim := ms.ve.CosineSimilarity(nodes[i].Embedding, nodes[j].Embedding)
			if sim >= 0.35 {
				edges = append(edges, repository.VectorEdge{
					ID:            fmt.Sprintf("edge_%s_%s", nodes[i].ID, nodes[j].ID),
					SourceID:      nodes[i].ID,
					TargetID:      nodes[j].ID,
					Similarity:    math.Round(sim*1000) / 1000,
					RelationLabel: "semantically relates to",
					IsExplicit:    false,
				})
			}
		}
	}

	graph := &repository.VectorKnowledgeGraph{
		Nodes:               nodes,
		Edges:               edges,
		Clusters:            DefaultSemanticClusters,
		LastUpdated:         repository.NowTimestamp(),
		EmbeddingDimensions: 128,
		Density:             0.0,
	}

	if n > 1 {
		maxEdges := float64((n * (n - 1)) / 2)
		if maxEdges > 0 {
			graph.Density = math.Round((float64(len(edges))/maxEdges)*1000) / 1000
		}
	}

	_ = ms.store.SaveVectorGraph(graph)
	return graph, nil
}
