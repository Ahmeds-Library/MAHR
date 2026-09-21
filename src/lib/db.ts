export interface Skill {
  id: string;
  name: string;
  description: string;
  instructions: string;
  enabled: boolean;
  isTemplate?: boolean;
  tags?: string[];
}

const DB_NAME = "MyraaSkillsDB";
const STORE_NAME = "skills";
const KEYVAL_STORE_NAME = "keyval";
const DB_VERSION = 2;

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(KEYVAL_STORE_NAME)) {
        db.createObjectStore(KEYVAL_STORE_NAME, { keyPath: "key" });
      }
    };
  });
}

export async function dbGet(key: string): Promise<any> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(KEYVAL_STORE_NAME, "readonly");
      const store = transaction.objectStore(KEYVAL_STORE_NAME);
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result ? request.result.value : null);
      };
    });
  } catch (e) {
    console.error("IndexedDB dbGet error, falling back to memory:", e);
    return null;
  }
}

export async function dbSet(key: string, value: any): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(KEYVAL_STORE_NAME, "readwrite");
      const store = transaction.objectStore(KEYVAL_STORE_NAME);
      const request = store.put({ key, value });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (e) {
    console.error("IndexedDB dbSet error:", e);
  }
}

export async function dbRemove(key: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(KEYVAL_STORE_NAME, "readwrite");
      const store = transaction.objectStore(KEYVAL_STORE_NAME);
      const request = store.delete(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (e) {
    console.error("IndexedDB dbRemove error:", e);
  }
}

export async function saveSkillsToDB(skills: Skill[]): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    // Clear existing
    const clearRequest = store.clear();

    clearRequest.onsuccess = () => {
      let completed = 0;
      if (skills.length === 0) {
        resolve();
        return;
      }

      skills.forEach((skill) => {
        const addReq = store.put(skill);
        addReq.onerror = () => reject(addReq.error);
        addReq.onsuccess = () => {
          completed++;
          if (completed === skills.length) {
            resolve();
          }
        };
      });
    };

    clearRequest.onerror = () => reject(clearRequest.error);
  });
}

export async function getSkillsFromDB(): Promise<Skill[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      resolve(request.result || []);
    };
  });
}

// Extract Capability Tags intelligently based on the content of the instructions/description
export function extractCapabilityTags(name: string, description: string, instructions: string): string[] {
  const tagsSet = new Set<string>();
  const combined = `${name} ${description} ${instructions}`.toLowerCase();

  // Python / Coding
  if (combined.includes("python") || combined.includes("pep-8") || combined.includes("pep8")) {
    tagsSet.add("Python");
  }
  if (combined.includes("code") || combined.includes("developer") || combined.includes("programming") || combined.includes("script")) {
    tagsSet.add("Developer");
  }
  if (combined.includes("debug") || combined.includes("syntax") || combined.includes("error")) {
    tagsSet.add("Debugging");
  }

  // Math / Physics / Science
  if (combined.includes("math") || combined.includes("calculus") || combined.includes("equation") || combined.includes("integral") || combined.includes("algebra")) {
    tagsSet.add("Math");
  }
  if (combined.includes("physics") || combined.includes("gravity") || combined.includes("quantum") || combined.includes("thermodynamics")) {
    tagsSet.add("Physics");
  }
  if (combined.includes("science") || combined.includes("biology") || combined.includes("chemistry")) {
    tagsSet.add("Science");
  }

  // Wellness / Psychology / Soft Skills
  if (combined.includes("wellness") || combined.includes("breath") || combined.includes("mindful") || combined.includes("meditation") || combined.includes("stress")) {
    tagsSet.add("Mindfulness");
  }
  if (combined.includes("soothing") || combined.includes("calm") || combined.includes("gentle") || combined.includes("compassion")) {
    tagsSet.add("Therapy");
  }

  // Teaching / Logic / Socratic
  if (combined.includes("socratic") || combined.includes("teaching") || combined.includes("mentor") || combined.includes("feynman") || combined.includes("learn")) {
    tagsSet.add("Pedagogy");
  }
  if (combined.includes("question") || combined.includes("reasoning") || combined.includes("logic") || combined.includes("deduce")) {
    tagsSet.add("Socratic Dialectic");
  }

  // Language / Translation
  if (combined.includes("translate") || combined.includes("language") || combined.includes("multilingual") || combined.includes("hinglish") || combined.includes("bilingual")) {
    tagsSet.add("Linguistics");
  }

  // Fallback keyword extract if tags are sparse
  if (tagsSet.size < 2) {
    const customTriggers = [
      { key: "finance", tag: "Finance" },
      { key: "history", tag: "History" },
      { key: "design", tag: "Design" },
      { key: "audio", tag: "Audio" },
      { key: "ai", tag: "AI/ML" },
      { key: "database", tag: "Database" },
      { key: "creative", tag: "Creative" },
      { key: "game", tag: "Game Dev" },
      { key: "medical", tag: "Medical" }
    ];
    customTriggers.forEach((trigger) => {
      if (combined.includes(trigger.key)) {
        tagsSet.add(trigger.tag);
      }
    });
  }

  // Default tag if none matched
  if (tagsSet.size === 0) {
    tagsSet.add("Cognitive Custom");
  }

  return Array.from(tagsSet).slice(0, 4); // limit to max 4 distinctive capability tags
}
