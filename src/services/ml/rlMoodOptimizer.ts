import { HumanMoodType } from "@/services/humanEmotionEngine";
import { dbGet, dbSet } from "@/lib/db";

export interface RLAtmospherePolicy {
  meshIntensity: number; // 0.5 to 1.6
  crossfadeDurationMs: number; // 1200 to 2800ms
  speechRate: number; // 0.85 to 1.25
  empathyWeight: number; // 0.0 to 1.0
  pulseScale: number; // 1.02 to 1.15 (visualizer pulse amplitude)
  pulseFrequencyHz: number; // 1.1 to 3.0 (visualizer pulse tempo)
  hologramAuraIntensity: number; // 0.3 to 0.95
  totalRewards: number;
  episodesCount: number;
  lastUpdated: string;
}

const RL_ATMOSPHERE_KEY = "mahr_rl_atmosphere_policy_v3";

const DEFAULT_ATMOSPHERE_POLICIES: Record<HumanMoodType, RLAtmospherePolicy> = {
  joyful: { meshIntensity: 1.15, crossfadeDurationMs: 1600, speechRate: 1.05, empathyWeight: 0.85, pulseScale: 1.08, pulseFrequencyHz: 2.4, hologramAuraIntensity: 0.85, totalRewards: 10, episodesCount: 1, lastUpdated: new Date().toISOString() },
  curious: { meshIntensity: 1.1, crossfadeDurationMs: 1700, speechRate: 1.0, empathyWeight: 0.75, pulseScale: 1.06, pulseFrequencyHz: 2.1, hologramAuraIntensity: 0.75, totalRewards: 10, episodesCount: 1, lastUpdated: new Date().toISOString() },
  analytical: { meshIntensity: 0.95, crossfadeDurationMs: 1900, speechRate: 0.98, empathyWeight: 0.65, pulseScale: 1.05, pulseFrequencyHz: 1.8, hologramAuraIntensity: 0.68, totalRewards: 10, episodesCount: 1, lastUpdated: new Date().toISOString() },
  calm: { meshIntensity: 0.85, crossfadeDurationMs: 2400, speechRate: 0.92, empathyWeight: 0.9, pulseScale: 1.03, pulseFrequencyHz: 1.2, hologramAuraIntensity: 0.55, totalRewards: 10, episodesCount: 1, lastUpdated: new Date().toISOString() },
  pensive: { meshIntensity: 0.9, crossfadeDurationMs: 2200, speechRate: 0.94, empathyWeight: 0.8, pulseScale: 1.04, pulseFrequencyHz: 1.4, hologramAuraIntensity: 0.62, totalRewards: 10, episodesCount: 1, lastUpdated: new Date().toISOString() },
  therapist: { meshIntensity: 0.9, crossfadeDurationMs: 2500, speechRate: 0.92, empathyWeight: 0.98, pulseScale: 1.04, pulseFrequencyHz: 1.3, hologramAuraIntensity: 0.7, totalRewards: 10, episodesCount: 1, lastUpdated: new Date().toISOString() },
  agitated: { meshIntensity: 0.75, crossfadeDurationMs: 1500, speechRate: 0.95, empathyWeight: 0.95, pulseScale: 1.09, pulseFrequencyHz: 2.8, hologramAuraIntensity: 0.8, totalRewards: 10, episodesCount: 1, lastUpdated: new Date().toISOString() },
  gussa: { meshIntensity: 0.8, crossfadeDurationMs: 1400, speechRate: 1.0, empathyWeight: 0.8, pulseScale: 1.1, pulseFrequencyHz: 3.0, hologramAuraIntensity: 0.85, totalRewards: 10, episodesCount: 1, lastUpdated: new Date().toISOString() },
  naraz: { meshIntensity: 0.85, crossfadeDurationMs: 2000, speechRate: 0.95, empathyWeight: 0.92, pulseScale: 1.06, pulseFrequencyHz: 2.0, hologramAuraIntensity: 0.72, totalRewards: 10, episodesCount: 1, lastUpdated: new Date().toISOString() },
  playful: { meshIntensity: 1.2, crossfadeDurationMs: 1600, speechRate: 1.08, empathyWeight: 0.8, pulseScale: 1.09, pulseFrequencyHz: 2.6, hologramAuraIntensity: 0.88, totalRewards: 10, episodesCount: 1, lastUpdated: new Date().toISOString() },
  loving: { meshIntensity: 1.05, crossfadeDurationMs: 2200, speechRate: 0.95, empathyWeight: 0.95, pulseScale: 1.05, pulseFrequencyHz: 1.5, hologramAuraIntensity: 0.75, totalRewards: 10, episodesCount: 1, lastUpdated: new Date().toISOString() },
  proud: { meshIntensity: 1.25, crossfadeDurationMs: 1700, speechRate: 1.04, empathyWeight: 0.85, pulseScale: 1.08, pulseFrequencyHz: 2.3, hologramAuraIntensity: 0.9, totalRewards: 10, episodesCount: 1, lastUpdated: new Date().toISOString() },
  neutral: { meshIntensity: 1.0, crossfadeDurationMs: 1800, speechRate: 1.0, empathyWeight: 0.75, pulseScale: 1.04, pulseFrequencyHz: 1.5, hologramAuraIntensity: 0.65, totalRewards: 10, episodesCount: 1, lastUpdated: new Date().toISOString() },
};

/**
 * Loads the active RL atmosphere policy table.
 */
export async function loadRLAtmospherePolicies(): Promise<Record<HumanMoodType, RLAtmospherePolicy>> {
  try {
    const saved = await dbGet(RL_ATMOSPHERE_KEY);
    if (saved && typeof saved === "object") {
      return { ...DEFAULT_ATMOSPHERE_POLICIES, ...saved };
    }
  } catch (e) {}
  return { ...DEFAULT_ATMOSPHERE_POLICIES };
}

/**
 * Saves the updated RL atmosphere policy table.
 */
export async function saveRLAtmospherePolicies(
  policies: Record<HumanMoodType, RLAtmospherePolicy>
): Promise<void> {
  try {
    await dbSet(RL_ATMOSPHERE_KEY, policies);
  } catch (e) {}
}

/**
 * Reinforcement Learning Policy Update:
 * Adjusts mesh intensity, crossfade duration, and visualizer pulse resonance according to reward signal (+1.0 to -1.0).
 */
export function updateAtmospherePolicyWithReward(
  current: RLAtmospherePolicy,
  reward: number // e.g. +1.0 for positive reaction, -1.0 for friction
): RLAtmospherePolicy {
  const lr = 0.08; // Learning rate
  const clampedReward = Math.max(-1.5, Math.min(1.5, reward));

  // If positive reward: reinforce current settings slightly; if negative: adjust toward calmer pacing and smoother pulsing
  const newIntensity = Math.max(0.5, Math.min(1.5, (current.meshIntensity || 1.0) + (clampedReward > 0 ? 0.015 : -0.04) * lr));
  const newDuration = Math.max(1200, Math.min(2800, (current.crossfadeDurationMs || 1800) + (clampedReward < 0 ? 80 : -20) * lr));
  const newPacing = Math.max(0.88, Math.min(1.2, (current.speechRate || 1.0) + (clampedReward * 0.02) * lr));
  
  // Adaptive pulse scale & frequency optimization
  const targetScaleDelta = clampedReward > 0 ? 0.005 : -0.01;
  const newPulseScale = Math.max(1.02, Math.min(1.14, (current.pulseScale || 1.05) + targetScaleDelta * lr));
  const newAura = Math.max(0.35, Math.min(0.92, (current.hologramAuraIntensity || 0.65) + (clampedReward > 0 ? 0.02 : -0.03) * lr));

  return {
    ...current,
    meshIntensity: Number(newIntensity.toFixed(3)),
    crossfadeDurationMs: Math.round(newDuration),
    speechRate: Number(newPacing.toFixed(3)),
    pulseScale: Number(newPulseScale.toFixed(3)),
    pulseFrequencyHz: current.pulseFrequencyHz || 1.5,
    hologramAuraIntensity: Number(newAura.toFixed(3)),
    totalRewards: Number(((current.totalRewards || 0) + clampedReward).toFixed(2)),
    episodesCount: (current.episodesCount || 0) + 1,
    lastUpdated: new Date().toISOString(),
  };
}
