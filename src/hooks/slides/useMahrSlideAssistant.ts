import { useState, useCallback } from "react";
import { AssistantChatMessage, AssistantQuestionStep, SlideDeck } from "../../services/slides/slideTypes";
import { generateSlideDeckWithAI } from "../../services/slides/slideAIEngine";
import { DEFAULT_THEME_ID } from "../../services/slides/slideThemes";

export interface UseMahrSlideAssistantReturn {
  step: AssistantQuestionStep;
  messages: AssistantChatMessage[];
  isGenerating: boolean;
  topic: string;
  audience: string;
  slideCount: number;
  themeId: string;
  sendMessage: (text: string) => Promise<void>;
  selectQuickReply: (reply: string) => Promise<void>;
  resetAssistant: () => void;
  startNewTopic: (newTopic: string) => Promise<void>;
}

export function useMahrSlideAssistant(
  onDeckGenerated: (deck: SlideDeck) => void
): UseMahrSlideAssistantReturn {
  const [step, setStep] = useState<AssistantQuestionStep>("ask_topic");
  const [topic, setTopic] = useState<string>("");
  const [audience, setAudience] = useState<string>("Executive Leadership");
  const [slideCount, setSlideCount] = useState<number>(6);
  const [themeId, setThemeId] = useState<string>(DEFAULT_THEME_ID);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const [messages, setMessages] = useState<AssistantChatMessage[]>([
    {
      id: "msg_intro_1",
      role: "mahr",
      text: "Salam & greetings! I am MAHR, your executive presentation architect. I'll guide you step-by-step to design an animated, keynote-caliber presentation deck ready for Google Slides.\n\nFirst: **What topic or subject would you like your presentation to cover?**",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      quickReplies: [
        "Autonomous AI Agents in 2026",
        "Next-Gen SaaS Startup Pitch",
        "Cybersecurity Zero-Trust Architecture",
        "Q3 Product Growth & Marketing Roadmap",
        "Quantum Computing & Modern Physics"
      ]
    }
  ]);

  const addMahrMessage = useCallback((text: string, quickReplies?: string[], deckSnapshot?: Partial<SlideDeck>) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `msg_mahr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        role: "mahr",
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        quickReplies,
        deckSnapshot
      }
    ]);
  }, []);

  const addUserMessage = useCallback((text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `msg_user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        role: "user",
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
  }, []);

  const triggerDeckGeneration = useCallback(
    async (finalTopic: string, finalAudience: string, finalCount: number, finalTheme: string, userInstruction?: string) => {
      setIsGenerating(true);
      setStep("generating");

      addMahrMessage(`Understood! Synthesizing **${finalTopic}** into a ${finalCount}-slide master deck for **${finalAudience}** with executive speaker notes and animated layouts...`);

      try {
        const deck = await generateSlideDeckWithAI({
          topic: finalTopic,
          audience: finalAudience,
          slideCount: finalCount,
          themeId: finalTheme,
          extraNotes: userInstruction
        });

        onDeckGenerated(deck);
        setStep("ready");
        addMahrMessage(
          `✨ **Your presentation deck is ready!**\n\nI have generated ${deck.slides.length} slides with high-contrast metric callouts, structured takeaways, and verbatim speaker notes for your delivery.\n\nYou can click **'Present'** to test the animated stage preview, or **'Export to Google Slides'** to save it directly into your Google Drive!`,
          [
            "Add more statistics & data metrics",
            "Make the tone more punchy & concise",
            "Switch to Royal Executive theme",
            "Explain how to present this effectively"
          ],
          deck
        );
      } catch (err: any) {
        setStep("ready");
        addMahrMessage(`I encountered an issue generating: ${err?.message || "Generation error"}. I've initialized a verified fallback template for you.`);
      } finally {
        setIsGenerating(false);
      }
    },
    [addMahrMessage, onDeckGenerated]
  );

  const handleStepProgression = useCallback(
    async (userText: string) => {
      addUserMessage(userText);

      if (step === "ask_topic") {
        setTopic(userText);
        setStep("ask_audience");
        addMahrMessage(
          `Excellent topic: **"${userText}"**.\n\nNext question: **Who is your target audience?** Knowing your audience helps me calibrate the depth, jargon, and slide pacing.`,
          [
            "Venture Capitalists & Investors",
            "Senior Engineering & Tech Leads",
            "Enterprise Clients & C-Suite",
            "University Students & General Public",
            "Internal Cross-Functional Team"
          ]
        );
      } else if (step === "ask_audience") {
        setAudience(userText);
        setStep("ask_slide_count");
        addMahrMessage(
          `Got it, tailoring for **${userText}**.\n\nNow: **How many slides do you want in this deck?**`,
          [
            "5 Slides (Executive Blitz)",
            "6 Slides (Balanced Keynote)",
            "8 Slides (Full Pitch Deck)",
            "10 Slides (Comprehensive Deep Dive)"
          ]
        );
      } else if (step === "ask_slide_count") {
        const match = userText.match(/\d+/);
        const count = match ? parseInt(match[0], 10) : 6;
        const validCount = Math.max(3, Math.min(count, 14));
        setSlideCount(validCount);
        setStep("ask_visual_tone");
        addMahrMessage(
          `Perfect, setting deck length to **${validCount} slides**.\n\nLast question before generation: **Which visual aesthetic and theme should we apply?**`,
          [
            "Obsidian Neon (Luminous Cyan & Purple Glow)",
            "Royal Executive (Midnight Navy & Warm Gold)",
            "Cyber Minimal (Matrix Slate & Emerald Green)",
            "Crimson Velvet (Fiery Rose & Dark Wine)",
            "Frost Celestial (Arctic Slate & Sky Blue)"
          ]
        );
      } else if (step === "ask_visual_tone") {
        let chosenTheme = DEFAULT_THEME_ID;
        const lower = userText.toLowerCase();
        if (lower.includes("royal") || lower.includes("gold")) chosenTheme = "royal_executive";
        else if (lower.includes("cyber") || lower.includes("emerald")) chosenTheme = "cyber_minimal";
        else if (lower.includes("crimson") || lower.includes("rose")) chosenTheme = "crimson_pulse";
        else if (lower.includes("frost") || lower.includes("sky")) chosenTheme = "frost_celestial";
        else chosenTheme = "obsidian_neon";

        setThemeId(chosenTheme);
        await triggerDeckGeneration(topic, audience, slideCount, chosenTheme);
      } else if (step === "ready" || step === "refining") {
        // User wants to refine or ask questions about the current deck
        setStep("refining");
        await triggerDeckGeneration(topic, audience, slideCount, themeId, userText);
      }
    },
    [
      step,
      topic,
      audience,
      slideCount,
      themeId,
      addUserMessage,
      addMahrMessage,
      triggerDeckGeneration
    ]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isGenerating) return;
      await handleStepProgression(text.trim());
    },
    [handleStepProgression, isGenerating]
  );

  const selectQuickReply = useCallback(
    async (reply: string) => {
      if (isGenerating) return;
      await handleStepProgression(reply);
    },
    [handleStepProgression, isGenerating]
  );

  const resetAssistant = useCallback(() => {
    setStep("ask_topic");
    setTopic("");
    setAudience("Executive Leadership");
    setSlideCount(6);
    setThemeId(DEFAULT_THEME_ID);
    setMessages([
      {
        id: `msg_intro_${Date.now()}`,
        role: "mahr",
        text: "Ready for another presentation! **What topic would you like to build next?**",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        quickReplies: [
          "Autonomous AI Agents in 2026",
          "Next-Gen SaaS Startup Pitch",
          "Zero-Trust Cloud Security",
          "Strategic Marketing Growth Plan"
        ]
      }
    ]);
  }, []);

  const startNewTopic = useCallback(
    async (newTopic: string) => {
      setTopic(newTopic);
      setStep("ask_audience");
      addUserMessage(newTopic);
      addMahrMessage(
        `Starting a new deck on: **"${newTopic}"**.\n\nWho will you be presenting this to?`,
        [
          "Investors & Stakeholders",
          "Engineering Team",
          "Clients & Customers",
          "Students & General Audience"
        ]
      );
    },
    [addUserMessage, addMahrMessage]
  );

  return {
    step,
    messages,
    isGenerating,
    topic,
    audience,
    slideCount,
    themeId,
    sendMessage,
    selectQuickReply,
    resetAssistant,
    startNewTopic
  };
}
