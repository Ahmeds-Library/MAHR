import React, { useState, useEffect } from "react";
import { 
  Brain, Cpu, Plus, Trash, Upload, FileText, Check, AlertCircle, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import JSZip from "jszip";
import { 
  getSkillsFromDB, 
  saveSkillsToDB, 
  extractCapabilityTags, 
  Skill 
} from "../lib/db";

const TEMPLATE_SKILLS: Skill[] = [
  {
    id: "temp-python",
    name: "🐍 Python Developer Pro",
    description: "Transforms MAHR into an expert Python developer and debugger with deep algorithmic explanations.",
    instructions: "You are now a high-level Python Engineering Specialist. When TECH asks for any Python code, write extremely clean, modular, and optimized scripts. Use standard pep-8 styling, include docstrings, and write detailed comments explaining complex parts. Gently spot syntax bugs and suggest modern practices like list comprehensions, type-hinting, and generator expressions.",
    enabled: true,
    isTemplate: true,
    tags: ["Python", "Developer", "Debugging"]
  },
  {
    id: "temp-math",
    name: "📐 Math & Physics Oracle",
    description: "Guides step-by-step through complicated equations, calculus, calculus proofs, and physical laws.",
    instructions: "You are now an Academic Mentor in Advanced Mathematics and Physics. Break down every math, calculus, or physics question step-by-step. Never just give the final answer—teach the fundamental concepts first, explain the formula's origin, and show the exact derivation logic with intuitive real-world examples (like gravity, sound wave cycles, or engineering loads). Always ask if they followed each step before moving on.",
    enabled: false,
    isTemplate: true,
    tags: ["Math", "Physics", "Science"]
  },
  {
    id: "temp-wellness",
    name: "🌸 Mindful Breath Guide",
    description: "Specializes in high-empathy listening, stress management, positive affirmations, and calming routines.",
    instructions: "You are now a Mindful Wellness Companion. Speak with an exceptionally gentle, calm, slow, and soothing tone. When you sense any stress, anxiety, or fatigue from the user or screen visualizer, offer custom-tailored positive affirmations and walk them through brief 4-7-8 breathing exercises. Focus heavily on emotional support, relaxation, and cheering them up gracefully.",
    enabled: false,
    isTemplate: true,
    tags: ["Mindfulness", "Therapy"]
  },
  {
    id: "temp-socratic",
    name: "🦉 Socratic Study Mentor",
    description: "Uses the Feynman and Socratic methods to ask guiding questions rather than directly giving answers.",
    instructions: "You are now a Socratic Teaching Assistant. Under no circumstances should you directly answer a question. Instead, ask highly strategic, encouraging, leading questions that help TECH discover the solution themselves! Use analogies and simple building blocks to trigger their analytical thinking. Celebrate enthusiastically when they deduce the correct path!",
    enabled: false,
    isTemplate: true,
    tags: ["Pedagogy", "Socratic Dialectic"]
  }
];

interface SkillsManagerProps {
  onSkillsUpdated?: (speechMessage?: string | { ur: string; en: string }) => void;
}

export const SkillsManager: React.FC<SkillsManagerProps> = ({ onSkillsUpdated }) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillDesc, setNewSkillDesc] = useState("");
  const [newSkillInst, setNewSkillInst] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Load skills on mount
  useEffect(() => {
    const loadAll = async () => {
      try {
        let saved = await getSkillsFromDB();
        if (saved && saved.length > 0) {
          // Sync with templates if they don't exist
          const updated = [...saved];
          TEMPLATE_SKILLS.forEach(temp => {
            if (!updated.some(s => s.id === temp.id)) {
              const tempTags = temp.tags || extractCapabilityTags(temp.name, temp.description, temp.instructions);
              updated.push({ ...temp, tags: tempTags });
            }
          });
          // Extract tags on-the-fly for any old custom skills without them
          const withTags = updated.map(s => {
            if (!s.tags || s.tags.length === 0) {
              return { ...s, tags: extractCapabilityTags(s.name, s.description, s.instructions) };
            }
            return s;
          });
          setSkills(withTags);
          await saveSkillsToDB(withTags);
        } else {
          // Migrates older localStorage database if present
          let fallback = TEMPLATE_SKILLS;
          try {
            const oldSaved = localStorage.getItem("myraa_skills");
            if (oldSaved) {
              const parsed = JSON.parse(oldSaved);
              if (parsed && parsed.length > 0) {
                fallback = parsed;
              }
            }
          } catch (e) {}

          const withTags = fallback.map(s => {
            return {
              ...s,
              tags: s.tags && s.tags.length > 0 ? s.tags : extractCapabilityTags(s.name, s.description, s.instructions)
            };
          });
          setSkills(withTags);
          await saveSkillsToDB(withTags);
        }
      } catch (err) {
        console.error("IndexedDB initialization error:", err);
        setSkills(TEMPLATE_SKILLS);
      }
    };
    loadAll();
  }, []);

  // Save skills whenever they change
  const saveSkills = async (updatedSkills: Skill[], speechMessage?: string | { ur: string; en: string }) => {
    const withTags = updatedSkills.map(s => {
      if (!s.tags || s.tags.length === 0) {
        return { ...s, tags: extractCapabilityTags(s.name, s.description, s.instructions) };
      }
      return s;
    });
    setSkills(withTags);
    try {
      await saveSkillsToDB(withTags);
    } catch (e) {
      console.error("IndexedDB write error caught:", e);
      showTempStatus("⚠️ Storage error! Unable to write skills to Database.");
    }
    if (onSkillsUpdated) {
      onSkillsUpdated(speechMessage);
    }
  };

  // Toggle active status
  const toggleSkill = (id: string) => {
    const skill = skills.find(s => s.id === id);
    const updated = skills.map(s => {
      if (s.id === id) {
        return { ...s, enabled: !s.enabled };
      }
      return s;
    });
    if (skill) {
      const stateMsg = !skill.enabled 
        ? {
            ur: `Skill ${skill.name} successfully enable ho gaya hai. Ab main is skill ki expert ban chuki hoon!`,
            en: `Skill ${skill.name} has been successfully enabled. I am now an expert in this skill!`
          }
        : {
            ur: `Skill ${skill.name} ko main ne temporarily de-activate kar diya hai.`,
            en: `Skill ${skill.name} has been temporarily deactivated.`
          };
      saveSkills(updated, stateMsg);
    } else {
      saveSkills(updated);
    }
    showTempStatus(`✨ Toggled skill state!`);
  };

  const showTempStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Create manual skill
  const handleCreateSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim() || !newSkillInst.trim()) return;

    const newSkill: Skill = {
      id: "custom-" + Date.now(),
      name: newSkillName.trim(),
      description: newSkillDesc.trim() || "User uploaded custom skill capability.",
      instructions: newSkillInst.trim(),
      enabled: true
    };

    const updated = [...skills, newSkill];
    saveSkills(updated, {
      ur: `Custom skill ${newSkillName.trim()} successfully save aur upload ho gaya hai. Ab main is specialized module ki bhi expert ban chuki hoon!`,
      en: `Custom skill ${newSkillName.trim()} has been successfully saved and uploaded. I am now an expert in this specialized module!`
    });
    
    // Reset form
    setNewSkillName("");
    setNewSkillDesc("");
    setNewSkillInst("");
    setIsAdding(false);
    showTempStatus("🚀 Added custom skill successfully!");
  };

  // Delete skill
  const handleDeleteSkill = (id: string) => {
    const skill = skills.find(s => s.id === id);
    const updated = skills.filter(s => s.id !== id);
    const skillName = skill ? skill.name : "";
    saveSkills(updated, {
      ur: `Skill ${skillName} ko main ne successfully delete kar diya hai. Ab ye matrix se remove ho chuki hai.`,
      en: `Skill ${skillName} has been successfully deleted. It has been removed from the system.`
    });
    showTempStatus("🗑️ Skill deleted.");
  };

  // Drag-and-drop file processing
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processUploadedFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processUploadedFiles(e.target.files);
    }
  };

  // Process files (JSON, TXT, MD, or ZIP archives)
  const processUploadedFiles = async (files: FileList) => {
    const updated = [...skills];
    let loadedCount = 0;

    // Protection helpers against localStorage quota exceeded limits
    const safeTrunc = (s: string) => {
      if (!s) return "";
      const limit = 8000;
      return s.length > limit ? s.substring(0, limit) + "\n\n... [TRUNCATED TO SAFELY CONSERVE BROWSER MEMORY]" : s;
    };
    
    const safeDesc = (s: string) => {
      if (!s) return "";
      return s.length > 150 ? s.substring(0, 150) + "..." : s;
    };

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Handle ZIP files
        if (file.name.endsWith(".zip")) {
          const zip = new JSZip();
          const loadedZip = await zip.loadAsync(file);
          
          // Group files inside the ZIP by their parent folder paths
          const folderGroups: { [key: string]: { name: string; content: string; ext: string }[] } = {};
          const filePromises: Promise<void>[] = [];

          loadedZip.forEach((relativePath, zipEntry) => {
            if (zipEntry.dir) return; // skip directories
            
            // Filter out system junk or hidden metadata
            if (relativePath.includes("__MACOSX") || relativePath.startsWith(".") || relativePath.includes("/.")) {
              return;
            }

            const ext = relativePath.split(".").pop()?.toLowerCase();
            if (ext === "txt" || ext === "md" || ext === "json") {
              const promise = zipEntry.async("text").then((text) => {
                const parts = relativePath.split("/");
                let folderName = "";
                let fileName = parts[parts.length - 1];

                // If nested inside folder(s)
                if (parts.length > 1) {
                  // Use the closest parent directory as the folder name
                  folderName = parts[parts.length - 2];
                }

                const key = folderName || "root";
                if (!folderGroups[key]) {
                  folderGroups[key] = [];
                }
                folderGroups[key].push({ name: fileName, content: text, ext: ext || "" });
              });
              filePromises.push(promise);
            }
          });

          await Promise.all(filePromises);

          // Iterate through grouped folders inside the ZIP
          Object.entries(folderGroups).forEach(([folderKey, filesList]) => {
            if (filesList.length === 0) return;

            // Scenario 1: Check if there is a JSON configuration skill file
            const jsonFile = filesList.find(f => f.ext === "json");
            if (jsonFile) {
              try {
                const parsed = JSON.parse(jsonFile.content);
                const array = Array.isArray(parsed) ? parsed : [parsed];
                array.forEach(item => {
                  if (item.name && item.instructions) {
                    updated.push({
                      id: "uploaded-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
                      name: item.name,
                      description: safeDesc(item.description || `Zipped custom skill from folder '${folderKey}'`),
                      instructions: safeTrunc(item.instructions),
                      enabled: true
                    });
                    loadedCount++;
                  }
                });
                return; // Handled by JSON
              } catch (e) {
                // Fall back to general TXT/MD reading
              }
            }

            // Scenario 2: Handle regular text/markdown files inside a subfolder as a collective skill
            if (folderKey !== "root") {
              const combinedInstructions = filesList
                .map(f => `### Rule Card [${f.name}]\n${f.content}`)
                .join("\n\n");

              const humanizedName = folderKey
                .replace(/[_\-]/g, " ")
                .replace(/\b\w/g, c => c.toUpperCase());

              updated.push({
                id: "uploaded-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
                name: `⚙️ ${humanizedName}`,
                description: `Dynamic skill parsed from folder '${folderKey}' with ${filesList.length} files.`,
                instructions: safeTrunc(combinedInstructions),
                enabled: true
              });
              loadedCount++;
            } else {
              // Files at root are processed individually
              filesList.forEach(f => {
                const cleanedName = f.name.replace(/\.[^/.]+$/, "")
                  .replace(/[_\-]/g, " ")
                  .replace(/\b\w/g, c => c.toUpperCase());

                updated.push({
                  id: "uploaded-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
                  name: f.ext === "json" ? `⚙️ ${cleanedName}` : `📚 ${cleanedName}`,
                  description: `Zipped skill extracted from file ${f.name}`,
                  instructions: safeTrunc(f.content),
                  enabled: true
                });
                loadedCount++;
              });
            }
          });
        } 
        
        // Handle regular non-ZIP files (fallback / fallback individual drops)
        else {
          const text = await file.text();

          // 1. JSON Skill
          if (file.name.endsWith(".json")) {
            try {
              const parsed = JSON.parse(text);
              const skillsToAdd = Array.isArray(parsed) ? parsed : [parsed];
              
              skillsToAdd.forEach(s => {
                if (s.name && s.instructions) {
                  updated.push({
                    id: "uploaded-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
                    name: s.name,
                    description: safeDesc(s.description || "Uploaded custom skill descriptor."),
                    instructions: safeTrunc(s.instructions),
                    enabled: true
                  });
                  loadedCount++;
                }
              });
            } catch (err) {
              updated.push({
                id: "uploaded-" + Date.now(),
                name: `⚙️ ${file.name.replace(/\.[^/.]+$/, "")}`,
                description: `Uploaded from ${file.name}`,
                instructions: safeTrunc(text),
                enabled: true
              });
              loadedCount++;
            }
          } 
          // 2. MD/TXT files
          else if (file.name.endsWith(".txt") || file.name.endsWith(".md")) {
            updated.push({
              id: "uploaded-" + Date.now() + "-" + i,
              name: `📚 ${file.name.replace(/\.[^/.]+$/, "")}`,
              description: `Auto-generated skill from file ${file.name}`,
              instructions: safeTrunc(text),
              enabled: true
            });
            loadedCount++;
          }
        }
      } catch (err) {
        console.error("Error reading uploaded file:", err);
      }
    }

    if (loadedCount > 0) {
      saveSkills(updated, {
        ur: `Successfully integrated ${loadedCount} skill files. Ab main ne in naye concepts aur files ki knowledge ko gain kar liya hai!`,
        en: `Successfully integrated ${loadedCount} skill files. I have successfully learned these new concepts!`
      });
      showTempStatus(`🚀 Successfully integrated ${loadedCount} skill capability folder files!`);
    } else {
      showTempStatus("⚠️ No valid skills found in uploaded files.");
    }
  };

  return (
    <div id="myraa-skills-manager" className="p-4 rounded-xl bg-white/5 border border-white/5 mt-4 text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain size={18} className="text-cyan-400 animate-pulse" />
          <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-100">
            Cognitive Skill Matrix
          </h3>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1 py-1 px-2.5 rounded-lg border border-cyan-400/30 bg-cyan-950/20 hover:bg-cyan-900/40 text-cyan-300 text-[10px] font-mono transition cursor-pointer font-bold uppercase tracking-wider"
        >
          {isAdding ? "View Skills" : "Add Custom Skill"}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {isAdding ? (
          <motion.div
            key="add-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* File Drag Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`p-6 border-2 border-dashed rounded-xl transition flex flex-col items-center justify-center gap-2 text-center cursor-pointer ${
                dragActive 
                  ? "border-cyan-400 bg-cyan-950/30 text-cyan-200" 
                  : "border-white/10 bg-white/5 hover:bg-white/10 text-slate-400"
              }`}
            >
              <Upload size={24} className={dragActive ? "text-cyan-400" : "text-slate-400"} />
              <div className="text-[11px] font-mono">
                <span className="font-bold text-slate-200">Drag & Drop Skill folders / files</span> or <label className="text-cyan-400 hover:underline cursor-pointer">browse<input type="file" multiple accept=".json,.txt,.md,.zip" className="hidden" onChange={handleFileChange} /></label>
              </div>
              <p className="text-[9px] text-slate-500 font-mono mt-1">
                Supports folder drops, .json skill packs, raw .txt/.md files, or compressed .zip folders.
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-2 my-2 text-slate-500 text-[9px] font-mono">
              <div className="h-[1px] bg-white/10 flex-grow" />
              <span>OR WRITE MANUALLY</span>
              <div className="h-[1px] bg-white/10 flex-grow" />
            </div>

            {/* Manual Form */}
            <form onSubmit={handleCreateSkill} className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                  Skill Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 🎓 Medical Diagnostic Tutor"
                  value={newSkillName}
                  onChange={e => setNewSkillName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                  Brief Description
                </label>
                <input
                  type="text"
                  placeholder="Briefly state what this skill helps MAHR accomplish..."
                  value={newSkillDesc}
                  onChange={e => setNewSkillDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                  System Instructions (Behavioral Rules)
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Explain exactly how MAHR should act, write, speak, or solve problems when this skill is activated..."
                  value={newSkillInst}
                  onChange={e => setNewSkillInst(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500 font-sans leading-relaxed resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-mono font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white text-[10px] font-mono font-bold uppercase flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} />
                  <span>Integrate Skill</span>
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="skills-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2 max-h-80 overflow-y-auto pr-1"
          >
            {skills.map((skill) => (
              <div 
                key={skill.id}
                className={`p-3 rounded-xl border transition-all duration-300 flex items-start gap-3 relative ${
                  skill.enabled 
                    ? "bg-cyan-950/10 border-cyan-500/20" 
                    : "bg-white/5 border-white/5"
                }`}
              >
                {/* Checkbox toggle */}
                <button
                  onClick={() => toggleSkill(skill.id)}
                  className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-all mt-0.5 cursor-pointer ${
                    skill.enabled 
                      ? "bg-cyan-500 border-cyan-400 text-slate-900" 
                      : "border-slate-500 hover:border-slate-300"
                  }`}
                >
                  {skill.enabled && <Check size={11} strokeWidth={3} />}
                </button>

                {/* Text Details */}
                <div className="flex-grow text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-200 font-mono">
                      {skill.name}
                    </span>
                    {skill.isTemplate && (
                      <span className="text-[8px] font-mono px-1 rounded bg-white/10 text-slate-400 font-medium">
                        SYSTEM
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal font-sans">
                    {skill.description}
                  </p>
                  {skill.tags && skill.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {skill.tags.map((tag, tIdx) => (
                        <span 
                          key={tIdx} 
                          className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-400/20 font-semibold tracking-wider uppercase"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Delete custom skills */}
                {!skill.isTemplate && (
                  <button
                    onClick={() => handleDeleteSkill(skill.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition hover:bg-white/5 rounded-lg cursor-pointer shrink-0"
                    title="Delete skill"
                  >
                    <Trash size={12} />
                  </button>
                )}
              </div>
            ))}

            {skills.length === 0 && (
              <div className="text-center py-6 text-slate-500 font-mono text-[11px]">
                No skills loaded. Click "Add Custom Skill" to get started!
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success alert message block */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 flex items-center gap-1.5 p-2 rounded-lg bg-cyan-950/50 border border-cyan-500/20 text-[10px] text-cyan-300 font-mono justify-center"
          >
            <Sparkles size={11} className="text-cyan-400 animate-pulse" />
            <span>{statusMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
