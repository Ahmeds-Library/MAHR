import { dbGet, dbSet, dbRemove } from "../lib/db";

export interface SystemSettingsState {
  autoInterrupt: boolean;
  isWakeWordEnabled: boolean;
  noiseGate: number;
  agentMode: "human" | "anime";
  voiceModel: "Warm" | "Analytical" | "Playful";
  autoShiftBackground: boolean;
  chatMaxMessages: number;
  chatRetentionTime: number;
  themeColor: string;
  soundEffectsEnabled: boolean;
  speechRate: number;
  speechPitch: number;
  proactiveRemindersEnabled: boolean;
  proactiveIdleTimeoutMins: number;
}

export const DEFAULT_SETTINGS: SystemSettingsState = {
  autoInterrupt: false,
  isWakeWordEnabled: true,
  noiseGate: 0.005,
  agentMode: "human",
  voiceModel: "Warm",
  autoShiftBackground: true,
  chatMaxMessages: 50,
  chatRetentionTime: 60,
  themeColor: "violet",
  soundEffectsEnabled: true,
  speechRate: 1.0,
  speechPitch: 1.0,
  proactiveRemindersEnabled: true,
  proactiveIdleTimeoutMins: 3,
};

export async function loadSettingsFromDB(): Promise<SystemSettingsState> {
  try {
    const autoInterrupt = (await dbGet("myraa_auto_interrupt")) ?? DEFAULT_SETTINGS.autoInterrupt;
    const isWakeWordEnabled = (await dbGet("myraa_wake_word_enabled")) ?? DEFAULT_SETTINGS.isWakeWordEnabled;
    const noiseGate = (await dbGet("myraa_noise_gate")) ?? DEFAULT_SETTINGS.noiseGate;
    const agentMode = (await dbGet("myraa_agent_mode")) ?? DEFAULT_SETTINGS.agentMode;
    const voiceModel = (await dbGet("myraa_voice_model")) ?? DEFAULT_SETTINGS.voiceModel;
    const autoShiftBackground = (await dbGet("myraa_auto_shift_bg")) ?? DEFAULT_SETTINGS.autoShiftBackground;
    const chatMaxMessages = (await dbGet("myraa_chat_max_messages")) ?? DEFAULT_SETTINGS.chatMaxMessages;
    const chatRetentionTime = (await dbGet("myraa_chat_retention_time")) ?? DEFAULT_SETTINGS.chatRetentionTime;
    const themeColor = (await dbGet("myraa_theme_color")) ?? DEFAULT_SETTINGS.themeColor;
    const soundEffectsEnabled = (await dbGet("myraa_sfx_enabled")) ?? DEFAULT_SETTINGS.soundEffectsEnabled;
    const speechRate = (await dbGet("myraa_speech_rate")) ?? DEFAULT_SETTINGS.speechRate;
    const speechPitch = (await dbGet("myraa_speech_pitch")) ?? DEFAULT_SETTINGS.speechPitch;
    const proactiveRemindersEnabled = (await dbGet("myraa_proactive_reminders")) ?? DEFAULT_SETTINGS.proactiveRemindersEnabled;
    const proactiveIdleTimeoutMins = (await dbGet("myraa_proactive_timeout_mins")) ?? DEFAULT_SETTINGS.proactiveIdleTimeoutMins;

    return {
      autoInterrupt: Boolean(autoInterrupt),
      isWakeWordEnabled: Boolean(isWakeWordEnabled),
      noiseGate: Number(noiseGate),
      agentMode: agentMode === "anime" ? "anime" : "human",
      voiceModel: voiceModel === "Analytical" || voiceModel === "Playful" ? voiceModel : "Warm",
      autoShiftBackground: Boolean(autoShiftBackground),
      chatMaxMessages: Number(chatMaxMessages),
      chatRetentionTime: Number(chatRetentionTime),
      themeColor: String(themeColor),
      soundEffectsEnabled: Boolean(soundEffectsEnabled),
      speechRate: Number(speechRate),
      speechPitch: Number(speechPitch),
      proactiveRemindersEnabled: Boolean(proactiveRemindersEnabled),
      proactiveIdleTimeoutMins: Number(proactiveIdleTimeoutMins),
    };
  } catch (err) {
    console.error("[settingsService] Error loading settings from DB:", err);
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettingToDB<K extends keyof SystemSettingsState>(
  key: K,
  value: SystemSettingsState[K]
): Promise<void> {
  const dbKeyMap: Record<keyof SystemSettingsState, string> = {
    autoInterrupt: "myraa_auto_interrupt",
    isWakeWordEnabled: "myraa_wake_word_enabled",
    noiseGate: "myraa_noise_gate",
    agentMode: "myraa_agent_mode",
    voiceModel: "myraa_voice_model",
    autoShiftBackground: "myraa_auto_shift_bg",
    chatMaxMessages: "myraa_chat_max_messages",
    chatRetentionTime: "myraa_chat_retention_time",
    themeColor: "myraa_theme_color",
    soundEffectsEnabled: "myraa_sfx_enabled",
    speechRate: "myraa_speech_rate",
    speechPitch: "myraa_speech_pitch",
    proactiveRemindersEnabled: "myraa_proactive_reminders",
    proactiveIdleTimeoutMins: "myraa_proactive_timeout_mins",
  };

  const dbKey = dbKeyMap[key];
  if (dbKey) {
    await dbSet(dbKey, value);
  }
}

export async function clearAllAppDataFromDB(): Promise<void> {
  const keysToRemove = [
    "myraa_auto_interrupt",
    "myraa_wake_word_enabled",
    "myraa_noise_gate",
    "myraa_agent_mode",
    "myraa_voice_model",
    "myraa_auto_shift_bg",
    "myraa_chat_max_messages",
    "myraa_chat_retention_time",
    "myraa_theme_color",
    "myraa_sfx_enabled",
    "myraa_speech_rate",
    "myraa_speech_pitch",
    "myraa_chat_journal",
    "myraa_study_notes",
    "myraa_daily_tasks",
    "myraa_whiteboard_text"
  ];

  for (const k of keysToRemove) {
    await dbRemove(k);
  }
}

export interface DiagnosticResult {
  success: boolean;
  logs: string[];
  testedSettings: Record<string, { saved: any; reloaded: any; match: boolean }>;
}

export async function runSettingsDiagnosticCycle(): Promise<DiagnosticResult> {
  const logs: string[] = [];
  logs.push("[Diagnostic] Starting full settings sync test cycle...");

  try {
    // 1. Snapshot original settings
    const original = await loadSettingsFromDB();
    logs.push(`[Diagnostic] Captured original settings.`);

    // 2. Define test vector with modified values
    const testValues: SystemSettingsState = {
      autoInterrupt: !original.autoInterrupt,
      isWakeWordEnabled: !original.isWakeWordEnabled,
      noiseGate: original.noiseGate === 0.005 ? 0.02 : 0.005,
      agentMode: original.agentMode === "human" ? "anime" : "human",
      voiceModel: original.voiceModel === "Warm" ? "Analytical" : "Warm",
      autoShiftBackground: !original.autoShiftBackground,
      chatMaxMessages: original.chatMaxMessages === 50 ? 100 : 50,
      chatRetentionTime: original.chatRetentionTime === 60 ? 1440 : 60,
      themeColor: original.themeColor === "violet" ? "emerald" : "violet",
      soundEffectsEnabled: !original.soundEffectsEnabled,
      speechRate: original.speechRate === 1.0 ? 1.5 : 1.0,
      speechPitch: original.speechPitch === 1.0 ? 1.2 : 1.0,
      proactiveRemindersEnabled: !original.proactiveRemindersEnabled,
      proactiveIdleTimeoutMins: original.proactiveIdleTimeoutMins === 3 ? 5 : 3,
    };

    // 3. Save test values to DB
    logs.push("[Diagnostic] Writing test values for all 12 system settings to IndexedDB...");
    for (const [key, value] of Object.entries(testValues)) {
      await saveSettingToDB(key as keyof SystemSettingsState, value);
    }

    // 4. Reload from DB
    logs.push("[Diagnostic] Reloading settings from IndexedDB via loadSettingsFromDB()...");
    const reloaded = await loadSettingsFromDB();

    // 5. Compare each setting
    let allMatched = true;
    const testedSettings: Record<string, { saved: any; reloaded: any; match: boolean }> = {};

    for (const key of Object.keys(testValues) as (keyof SystemSettingsState)[]) {
      const savedVal = testValues[key];
      const reloadedVal = reloaded[key];
      const match = JSON.stringify(savedVal) === JSON.stringify(reloadedVal);
      if (!match) allMatched = false;

      testedSettings[key] = {
        saved: savedVal,
        reloaded: reloadedVal,
        match,
      };
      logs.push(
        `[Diagnostic] Field '${key}': Saved=${savedVal}, Reloaded=${reloadedVal} -> ${match ? "PASSED ✅" : "FAILED ❌"}`
      );
    }

    // 6. Restore original settings
    logs.push("[Diagnostic] Restoring original settings to IndexedDB...");
    for (const [key, value] of Object.entries(original)) {
      await saveSettingToDB(key as keyof SystemSettingsState, value);
    }

    logs.push(`[Diagnostic] Test cycle completed. Result: ${allMatched ? "ALL PASSED ✅" : "ISSUES FOUND ❌"}`);
    console.log(logs.join("\n"));

    return {
      success: allMatched,
      logs,
      testedSettings,
    };
  } catch (err: any) {
    const errorMsg = `[Diagnostic] Critical failure during diagnostic test: ${err?.message || err}`;
    logs.push(errorMsg);
    console.error(errorMsg, err);
    return {
      success: false,
      logs,
      testedSettings: {},
    };
  }
}

