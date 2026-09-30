import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { Mic, MicOff, Power, Sparkles, Volume2 } from "lucide-react";

interface MahrDockOrbProps {
  state: "disconnected" | "connecting" | "listening" | "speaking";
  isMuted: boolean;
  voiceConfidence: number;
  themeHex: string;
  themeSecondaryHex: string;
  onToggleConnect: () => void;
  onToggleMute: () => void;
}

export const MahrDockOrb: React.FC<MahrDockOrbProps> = ({
  state,
  isMuted,
  voiceConfidence,
  themeHex,
  themeSecondaryHex,
  onToggleConnect,
  onToggleMute,
}) => {
  const orbRef = useRef<HTMLButtonElement>(null);
  const ring1Ref = useRef<HTMLDivElement>(null);
  const ring2Ref = useRef<HTMLDivElement>(null);
  const ring3Ref = useRef<HTMLDivElement>(null);

  const isConnected = state !== "disconnected";
  const isSpeaking = state === "speaking";
  const isListening = state === "listening";

  // GSAP Breathing & Dynamic Aura Effect
  useEffect(() => {
    if (!orbRef.current) return;

    const ctx = gsap.context(() => {
      if (!isConnected) {
        gsap.to(orbRef.current, {
          scale: 1,
          boxShadow: `0 0 20px ${themeHex}33`,
          duration: 2.2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      } else if (isSpeaking) {
        gsap.to(orbRef.current, {
          scale: 1.1,
          boxShadow: `0 0 35px ${themeHex}99, 0 0 50px ${themeSecondaryHex}66`,
          duration: 0.35,
          repeat: -1,
          yoyo: true,
          ease: "power2.inOut",
        });
        if (ring1Ref.current && ring2Ref.current) {
          gsap.to(ring1Ref.current, { scale: 1.35, opacity: 0.8, duration: 0.5, repeat: -1, yoyo: true });
          gsap.to(ring2Ref.current, { scale: 1.55, opacity: 0.5, duration: 0.7, repeat: -1, yoyo: true });
        }
      } else if (isListening) {
        gsap.to(orbRef.current, {
          scale: 1.05,
          boxShadow: `0 0 30px #10b98188`,
          duration: 0.8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
        if (ring1Ref.current) {
          gsap.to(ring1Ref.current, { scale: 1.25, opacity: 0.7, duration: 0.8, repeat: -1, yoyo: true });
        }
      } else {
        gsap.to(orbRef.current, {
          scale: 1.03,
          boxShadow: `0 0 25px ${themeHex}66`,
          duration: 1.4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
    });

    return () => ctx.revert();
  }, [isConnected, isSpeaking, isListening, themeHex, themeSecondaryHex]);

  return (
    <div className="relative flex items-center justify-center">
      {/* Dynamic Animated GSAP Concentric Halo Rings */}
      {isConnected && (
        <>
          <div
            ref={ring1Ref}
            className="absolute inset-0 rounded-full border border-cyan-400/40 pointer-events-none transition-transform"
          />
          <div
            ref={ring2Ref}
            className="absolute -inset-1.5 rounded-full border border-indigo-400/30 pointer-events-none transition-transform"
          />
          <div
            ref={ring3Ref}
            className="absolute -inset-3 rounded-full border border-emerald-400/20 pointer-events-none transition-transform"
          />
        </>
      )}

      {/* Voice Confidence SVG Radial Tracker */}
      {isListening && (
        <svg className="absolute w-[86px] h-[86px] -rotate-90 pointer-events-none z-10">
          <circle cx="43" cy="43" r="38" className="stroke-white/10 fill-none" strokeWidth="2.5" />
          <circle
            cx="43"
            cy="43"
            r="38"
            className={`fill-none transition-all duration-300 ${
              voiceConfidence >= 75
                ? "stroke-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                : voiceConfidence >= 45
                ? "stroke-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                : "stroke-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.8)]"
            }`}
            strokeWidth="2.5"
            strokeDasharray={2 * Math.PI * 38}
            strokeDashoffset={2 * Math.PI * 38 * (1 - Math.min(100, Math.max(5, voiceConfidence)) / 100)}
            strokeLinecap="round"
          />
        </svg>
      )}

      {/* Primary Mahr Interaction Orb */}
      <button
        ref={orbRef}
        onClick={onToggleConnect}
        className={`relative z-20 w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl cursor-pointer ${
          isSpeaking
            ? "bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 text-white"
            : isListening
            ? "bg-gradient-to-tr from-emerald-500 via-teal-600 to-cyan-500 text-white"
            : state === "connecting"
            ? "bg-gradient-to-tr from-amber-500 via-orange-600 to-yellow-500 text-white animate-pulse"
            : "bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950 text-slate-300 hover:text-cyan-300 border border-white/20 hover:border-cyan-400/50"
        }`}
        title={isConnected ? "Disconnect Mahr" : "Connect with Mahr Voice AI (or say 'Hey Mahr')"}
      >
        {!isConnected ? (
          <Power className="w-7 h-7 transition-transform group-hover:scale-110" />
        ) : isSpeaking ? (
          <Volume2 className="w-7 h-7 animate-pulse" />
        ) : (
          <Sparkles className="w-7 h-7 animate-spin-slow" />
        )}
      </button>

      {/* Floating Microphone Mute Control */}
      {isConnected && (
        <button
          onClick={onToggleMute}
          className={`absolute -right-10 sm:-right-12 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full border flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg ${
            isMuted
              ? "bg-rose-500/30 border-rose-500/60 text-rose-300 shadow-rose-950/60"
              : "bg-slate-900/80 border-white/20 text-slate-300 hover:text-white hover:bg-slate-800"
          }`}
          title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
        >
          {isMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
};
