import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { Mic, MicOff, Volume2, Sparkles, Radio } from "lucide-react";
import { AssistantVoiceState } from "../../hooks/google/useMahrAssistantVoice";

interface MahrVoiceOrbProps {
  voiceState: AssistantVoiceState;
  transcript?: string;
  spokenResponse?: string;
  onToggleListening: () => void;
  className?: string;
}

export const MahrVoiceOrb: React.FC<MahrVoiceOrbProps> = ({
  voiceState,
  transcript,
  spokenResponse,
  onToggleListening,
  className = "",
}) => {
  const orbRef = useRef<HTMLButtonElement>(null);
  const ring1Ref = useRef<HTMLDivElement>(null);
  const ring2Ref = useRef<HTMLDivElement>(null);
  const waveBarsRef = useRef<HTMLDivElement>(null);

  // GSAP Fluid Ambient Physics
  useEffect(() => {
    if (!orbRef.current || !ring1Ref.current || !ring2Ref.current) return;

    const ctx = gsap.context(() => {
      if (voiceState === "listening") {
        // MAHR holographic blue-cyan energetic spinning pulse
        gsap.to(ring1Ref.current, {
          scale: 1.35,
          opacity: 0.8,
          borderColor: "#06b6d4",
          repeat: -1,
          yoyo: true,
          duration: 0.6,
          ease: "sine.inOut",
        });
        gsap.to(ring2Ref.current, {
          scale: 1.55,
          opacity: 0.4,
          borderColor: "#3b82f6",
          repeat: -1,
          yoyo: true,
          duration: 0.8,
          delay: 0.2,
          ease: "sine.inOut",
        });
        gsap.to(orbRef.current, {
          scale: 1.08,
          boxShadow: "0 0 35px rgba(6, 182, 212, 0.6)",
          duration: 0.3,
        });
      } else if (voiceState === "speaking") {
        // Vibrant undulating voice aura
        gsap.to(ring1Ref.current, {
          scale: 1.25,
          opacity: 0.7,
          borderColor: "#8b5cf6",
          repeat: -1,
          yoyo: true,
          duration: 0.4,
          ease: "power1.inOut",
        });
        gsap.to(ring2Ref.current, {
          scale: 1.45,
          opacity: 0.3,
          borderColor: "#ec4899",
          repeat: -1,
          yoyo: true,
          duration: 0.7,
          ease: "power1.inOut",
        });
      } else if (voiceState === "processing") {
        // Rotating processing ring
        gsap.to(ring1Ref.current, {
          rotation: 360,
          scale: 1.2,
          opacity: 0.6,
          repeat: -1,
          duration: 1.2,
          ease: "linear",
        });
      } else {
        // Idle gentle breathing glow
        gsap.killTweensOf([ring1Ref.current, ring2Ref.current, orbRef.current]);
        gsap.to(ring1Ref.current, {
          scale: 1.1,
          opacity: 0.3,
          borderColor: "#38bdf8",
          duration: 2.2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
        gsap.to(ring2Ref.current, {
          scale: 1.2,
          opacity: 0.15,
          borderColor: "#818cf8",
          duration: 2.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
        gsap.to(orbRef.current, {
          scale: 1.0,
          boxShadow: "0 0 20px rgba(56, 189, 248, 0.25)",
          duration: 0.5,
        });
      }
    });

    return () => ctx.revert();
  }, [voiceState]);

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* Outer Glow Halo Rings */}
      <div className="relative flex items-center justify-center">
        <div
          ref={ring2Ref}
          className="absolute w-24 h-24 rounded-full border border-cyan-400/20 pointer-events-none"
        />
        <div
          ref={ring1Ref}
          className="absolute w-20 h-20 rounded-full border border-cyan-400/40 pointer-events-none"
        />

        {/* Central Orb Button */}
        <button
          ref={orbRef}
          id="mahr-voice-orb-btn"
          data-testid="mahr-voice-orb-btn"
          type="button"
          onClick={onToggleListening}
          className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer shadow-xl ${
            voiceState === "listening"
              ? "bg-gradient-to-tr from-cyan-600 via-sky-500 to-blue-400 text-white animate-pulse"
              : voiceState === "speaking"
              ? "bg-gradient-to-tr from-purple-600 via-indigo-500 to-pink-500 text-white"
              : voiceState === "processing"
              ? "bg-gradient-to-tr from-amber-500 to-orange-400 text-white"
              : "bg-gradient-to-tr from-zinc-800 via-zinc-900 to-cyan-950 border border-cyan-500/40 text-cyan-300 hover:text-white hover:border-cyan-400 hover:scale-105"
          }`}
          title={voiceState === "listening" ? "Listening... (Click to stop)" : "Click to speak to Assistant"}
        >
          {voiceState === "listening" ? (
            <Radio className="w-6 h-6 animate-spin" />
          ) : voiceState === "speaking" ? (
            <Volume2 className="w-6 h-6 animate-bounce" />
          ) : voiceState === "processing" ? (
            <Sparkles className="w-6 h-6 animate-spin" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Dynamic Soundwave Visualizer Bars */}
      {(voiceState === "speaking" || voiceState === "listening") && (
        <div
          ref={waveBarsRef}
          className="flex items-center gap-1 mt-2.5 h-4 px-2"
        >
          {[4, 8, 14, 10, 6, 12, 16, 8, 5].map((h, i) => (
            <div
              key={i}
              className="w-1 bg-cyan-400 rounded-full animate-pulse"
              style={{
                height: `${h}px`,
                animationDuration: `${0.3 + (i % 4) * 0.15}s`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Real-time Subtitle / Voice Feedback */}
      <div className="mt-2 text-center max-w-xs">
        {voiceState === "listening" && (
          <p className="text-xs text-cyan-300 font-mono animate-pulse">
            {transcript || "Listening... say 'Check calendar' or 'Check emails'"}
          </p>
        )}
        {voiceState === "processing" && (
          <p className="text-xs text-amber-300 font-mono">
            Contacting Google Workspace...
          </p>
        )}
        {voiceState === "speaking" && spokenResponse && (
          <p className="text-xs text-purple-300 line-clamp-2 px-2 bg-black/40 rounded-lg py-1 border border-purple-500/20">
            "{spokenResponse}"
          </p>
        )}
        {voiceState === "idle" && (
          <span className="text-[10px] text-zinc-500 font-mono">
            MAHR AI Assistant
          </span>
        )}
      </div>
    </div>
  );
};
