/**
 * Layer 2 (Business Logic & Voice Intent Guard):
 * Maps voice actions, spoken intents, and workspace keys to their required MahrPluginId,
 * and constructs warm, polite voice offers to 1-click install the needed extension.
 */

import { MahrPluginId } from "../layer1_data/pluginTypes";
import { getPluginDefinitionById, MAHR_PLUGIN_CATALOG } from "../layer1_data/pluginCatalog";

export function resolvePluginIdForActionKey(actionKey: string): MahrPluginId | null {
  const normalized = actionKey.trim().toLowerCase();
  const directMap: Record<string, MahrPluginId> = {
    whiteboard: "whiteboard-chalkboard",
    chalkboard: "whiteboard-chalkboard",
    code: "whiteboard-chalkboard",
    slides: "slides-studio",
    slides_studio: "slides-studio",
    simulation: "simulation-studio",
    sim_engine: "simulation-studio",
    study_pad: "study-pad",
    studypad: "study-pad",
    notes: "study-pad",
    flashcards: "study-pad",
    classroom: "google-classroom",
    google_classroom: "google-classroom",
    daily_tasks: "daily-tasks",
    tasks: "daily-tasks",
    schedule: "daily-tasks",
    routines: "quick-routines",
    quick_routines: "quick-routines",
    memory: "memory-vault",
    memories: "memory-vault",
    recalls: "memory-vault",
    knowledge_graph: "knowledge-graph",
    journal: "chat-journal",
    chat_journal: "chat-journal",
    office: "mahr-office",
    mahr_office: "mahr-office",
    munder_difflin: "mahr-office",
    subagents: "subagents-studio",
    sub_agents: "subagents-studio",
    mood_studio: "cognitive-labs",
    rl_studio: "cognitive-labs",
    screen_share: "screen-vision",
    magnifier: "screen-vision",
    ask_mahr: "cute-mascot-chat",
    mascot: "cute-mascot-chat",
  };

  if (directMap[normalized]) {
    return directMap[normalized];
  }

  for (const plugin of MAHR_PLUGIN_CATALOG) {
    if (plugin.id === normalized) return plugin.id;
    if (plugin.voiceTriggers.some((trigger) => normalized.includes(trigger))) {
      return plugin.id;
    }
  }

  return null;
}

export function detectUninstalledPluginInTranscript(transcript: string): MahrPluginId | null {
  const lower = transcript.trim().toLowerCase();
  if (!lower) return null;

  // Check if the user is explicitly asking to open/use/show a feature
  const actionVerbs = ["open", "show", "launch", "start", "use", "go to", "switch to", "draw on", "check my"];
  const hasActionIntent = actionVerbs.some((v) => lower.includes(v));
  if (!hasActionIntent) return null;

  for (const plugin of MAHR_PLUGIN_CATALOG) {
    for (const trigger of plugin.voiceTriggers) {
      if (lower.includes(trigger)) {
        return plugin.id;
      }
    }
  }

  return null;
}

export function buildPolitePluginOfferSpeech(pluginId: MahrPluginId): string {
  const def = getPluginDefinitionById(pluginId);
  const name = def ? def.name : "that extension";
  return `The ${name} extension isn't installed yet in your Pure Voice Agent mode. Would you like to install and open it with one click?`;
}
