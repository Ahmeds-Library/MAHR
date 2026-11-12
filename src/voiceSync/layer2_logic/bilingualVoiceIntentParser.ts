import {
  BilingualSynchronizedCueSet,
  BilingualVoiceIntentMatch,
  VoiceActionDomain,
} from "../layer1_data/voiceSyncTypes";
import {
  VoiceActionResult,
  isVoiceToMindMapTrigger,
  matchVoiceCommand,
} from "../../services/voiceCommandService";

const URDU_ROMAN_MARKERS = [
  "kholo",
  "khol",
  "kholen",
  "banao",
  "bana",
  "banayein",
  "dikhao",
  "dikha",
  "karo",
  "karein",
  "likho",
  "likhein",
  "chalao",
  "chala",
  "agla",
  "agli",
  "pichla",
  "pichli",
  "aage",
  "peeche",
  "yaad",
  "rakho",
  "so jao",
  "sojao",
  "band karo",
  "mujhe",
  "mere",
  "meri",
  "abhi",
  "zaroor",
  "suno",
];

/**
 * Detects whether the user spoke in Urdu / Roman Urdu or English so Mahr's
 * synchronized Before/During/After narration responds in matching natural phrasing.
 */
export function detectSpokenLanguageMode(text: string): "ur_roman" | "en" {
  const lower = (text || "").toLowerCase();
  if (/[\u0600-\u06FF]/.test(text)) {
    return "ur_roman";
  }
  const tokens = lower.split(/[\s,?.!]+/);
  for (const marker of URDU_ROMAN_MARKERS) {
    if (marker.includes(" ") ? lower.includes(marker) : tokens.includes(marker)) {
      return "ur_roman";
    }
  }
  return "en";
}

/**
 * Strips leading and conversational wake words ("Hey Mahr", "Suno Mahr", "Mahr please")
 * so that spoken commands containing the assistant's name are never shadowed by `{ type: "wake" }`.
 */
export function stripWakeWordPrefix(
  transcript: string,
  activeAgentFirstName: string = "mahr"
): { cleaned: string; hadWakeWord: boolean } {
  const raw = (transcript || "").trim();
  if (!raw) return { cleaned: "", hadWakeWord: false };

  const escapedAgent = activeAgentFirstName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const leadingWakePattern = new RegExp(
    `^(?:hey|hello|hi|suno|acha|ok|okay|please|arrey|oye|listen)?[\\s,]*(?:mahr|mahir|mehar|myraa|maira|mira|${escapedAgent})[\\s,!.:;-]*(?:please|zara|abhi|ذرا)?[\\s,]*`,
    "i"
  );

  let cleaned = raw.replace(leadingWakePattern, "").trim();
  const hadLeadingWake = cleaned.length !== raw.length;

  // Also strip trailing wake word address like "open chalkboard mahr"
  const trailingWakePattern = new RegExp(
    `[\\s,]*(?:please\\s+)?(?:mahr|mahir|mehar|myraa|maira|mira|${escapedAgent})[\\s.!?]*$`,
    "i"
  );
  const afterTrailing = cleaned.replace(trailingWakePattern, "").trim();
  const hadTrailingWake = afterTrailing.length !== cleaned.length;
  cleaned = afterTrailing;

  return {
    cleaned: cleaned || raw,
    hadWakeWord: hadLeadingWake || hadTrailingWake,
  };
}

/**
 * Builds 3-phase synchronized vocal narration cues (Before, During, After action)
 * in both natural Roman Urdu + English and pure English.
 */
export function buildSynchronizedCues(
  domain: VoiceActionDomain,
  topic: string,
  extraDetail?: string
): BilingualSynchronizedCueSet {
  const shortTopic = (topic || "your workspace").slice(0, 48).trim();

  switch (domain) {
    case "mindmap":
      return {
        preAction: {
          ur_roman: `Ji bilkul! Main abhi "${shortTopic}" ka interactive mind map chalkboard par draw kar rahi hoon.`,
          en: `Right away! Opening the chalkboard and mapping out "${shortTopic}" for you now.`,
        },
        midAction: {
          ur_roman: `Main central nodes aur relationships ko connect kar rahi hoon taake flow bilkul clear nazar aaye...`,
          en: `Structuring the core concept nodes and linking the workflow branches live on your board...`,
        },
        postAction: {
          ur_roman: `Mind map tayyar hai! Aaiye is ke har step aur connection ko saath samajhte hain.`,
          en: `Your mind map for "${shortTopic}" is live on the chalkboard! Let's walk through the key connections.`,
        },
      };

    case "chalkboard":
      return {
        preAction: {
          ur_roman: `Abhi lijiye! Main chalkboard khol kar "${shortTopic}" sketch kar rahi hoon.`,
          en: `On it! Opening the live chalkboard and sketching "${shortTopic}" right now.`,
        },
        midAction: {
          ur_roman: `Diagram shapes, labels aur visual layout board par plot ho rahe hain...`,
          en: `Plotting vector shapes, labels, and structured visual notes onto the canvas...`,
        },
        postAction: {
          ur_roman: `Chalkboard par diagram aur notes ready hain! Dekhiye, main aap ko explain karti hoon.`,
          en: `The diagram and notes are ready on your chalkboard! Let me walk you through them.`,
        },
      };

    case "code":
      return {
        preAction: {
          ur_roman: `Zaroor! Main chalkboard code studio khol kar "${shortTopic}" ka code likh rahi hoon.`,
          en: `Sure thing! Opening the chalkboard code workspace and writing "${shortTopic}" now.`,
        },
        midAction: {
          ur_roman: `Code structure aur step-by-step logic تیار ho raha hai...`,
          en: `Preparing clean syntax and step-by-step execution annotations on the board...`,
        },
        postAction: {
          ur_roman: `Code chalkboard par ready hai! Hum isay line-by-line run aur debug kar sakte hain.`,
          en: `Your code is ready on the chalkboard! We can step through and test it together.`,
        },
      };

    case "slides":
      return {
        preAction: {
          ur_roman: `Ji zaroor! Main Presenton Studio khol rahi hoon aur "${shortTopic}" par slides bana rahi hoon.`,
          en: `Right away! Launching Presenton Studio and generating a slide deck on "${shortTopic}".`,
        },
        midAction: {
          ur_roman: `Main slides ka outline, key takeaways aur visual cards design kar rahi hoon...`,
          en: `Structuring the slide outline, visual cards, and speaker notes in real time...`,
        },
        postAction: {
          ur_roman: `"${shortTopic}" ki presentation tayyar hai! Aap bol kar agla ya pichla slide bhi chala sakte hain.`,
          en: `Your presentation on "${shortTopic}" is ready! You can say "next slide" or "previous slide" anytime.`,
        },
      };

    case "slides_nav":
      return {
        preAction: {
          ur_roman:
            extraDetail === "prev"
              ? `Ji, pichli slide par wapas ja rahi hoon.`
              : extraDetail === "export"
                ? `Abhi aap ki presentation export kar rahi hoon.`
                : `Ji, agla slide laga rahi hoon.`,
          en:
            extraDetail === "prev"
              ? `Moving back to the previous slide now.`
              : extraDetail === "export"
                ? `Exporting your presentation deck right now.`
                : `Advancing to the next slide now.`,
        },
        midAction: {
          ur_roman: `Slide view sync ho raha hai...`,
          en: `Synchronizing live slide canvas...`,
        },
        postAction: {
          ur_roman: `Slide update ho gayi hai!`,
          en: `Slide view updated!`,
        },
      };

    case "memory":
      return {
        preAction: {
          ur_roman:
            extraDetail === "save"
              ? `Ji bilkul, main yeh baat aap ke Memory Bank main abhi mehfooz kar rahi hoon.`
              : `Abhi aap ka Hybrid Memory Bank khol rahi hoon.`,
          en:
            extraDetail === "save"
              ? `Got it! Saving "${shortTopic}" into your long-term Memory Bank right now.`
              : `Opening your Hybrid Memory Bank studio now.`,
        },
        midAction: {
          ur_roman: `Semantic embeddings aur memory tier tags index ho rahe hain...`,
          en: `Indexing semantic embeddings and memory retention tiers...`,
        },
        postAction: {
          ur_roman:
            extraDetail === "save"
              ? `Maine "${shortTopic}" ko hamesha ke liye yaad rakh liya hai!`
              : `Memory Bank aap ke saamne khul gaya hai!`,
          en:
            extraDetail === "save"
              ? `Saved "${shortTopic}" to your Memory Bank and linked it to your knowledge graph!`
              : `Your Memory Bank dashboard is open and ready!`,
        },
      };

    case "obsidian":
      return {
        preAction: {
          ur_roman: `Ji! Main aap ka Obsidian Vault aur 128D Knowledge Graph khol rahi hoon.`,
          en: `Opening your Obsidian Vault and 128D Vector Knowledge Graph right now.`,
        },
        midAction: {
          ur_roman: `Wikilinks, backlinks aur semantic clusters scan ho rahe hain...`,
          en: `Scanning wikilinks, backlinks, and semantic vector connections for "${shortTopic}"...`,
        },
        postAction: {
          ur_roman: `Obsidian Vault aur Knowledge Graph ready hai!`,
          en: `Your Obsidian Vault and Knowledge Graph are live on screen!`,
        },
      };

    case "tasks":
      return {
        preAction: {
          ur_roman:
            extraDetail === "add"
              ? `Zaroor! Main "${shortTopic}" ko aap ke Daily Tasks main add kar rahi hoon.`
              : `Abhi aap ka Daily Task Manager aur study planner khol rahi hoon.`,
          en:
            extraDetail === "add"
              ? `Adding "${shortTopic}" to your Daily Tasks right now.`
              : `Opening your Daily Task Manager and schedule planner now.`,
        },
        midAction: {
          ur_roman: `Task list aur priority schedule sync ho raha hai...`,
          en: `Syncing your task list and priority schedule...`,
        },
        postAction: {
          ur_roman:
            extraDetail === "add"
              ? `Task "${shortTopic}" aap ki list main add ho gaya hai!`
              : `Daily Tasks workspace khul gaya hai!`,
          en:
            extraDetail === "add"
              ? `Task "${shortTopic}" has been added to your daily checklist!`
              : `Your Daily Tasks planner is open and synced!`,
        },
      };

    case "simulation":
      return {
        preAction: {
          ur_roman: `Bohat acha! Main "${shortTopic}" ke liye 3D Interactive Simulation Engine start kar rahi hoon.`,
          en: `Launching the 3D Interactive Simulation Lab for "${shortTopic}" right now!`,
        },
        midAction: {
          ur_roman: `3D WebGL geometry, physics parameters aur shaders load ho rahe hain...`,
          en: `Initializing 3D WebGL meshes, interactive controls, and physics parameters...`,
        },
        postAction: {
          ur_roman: `3D Simulation live hai! Aap isay ghuma kar har angle se explore kar sakte hain.`,
          en: `The 3D simulation for "${shortTopic}" is live! Let's explore how it works.`,
        },
      };

    case "studypad":
      return {
        preAction: {
          ur_roman:
            extraDetail === "pack"
              ? `Ji! Main aap ke notes se flashcards aur quiz तैयार kar rahi hoon.`
              : `Abhi aap ka Study Pad aur interactive notes khol rahi hoon.`,
          en:
            extraDetail === "pack"
              ? `Generating interactive flashcards and practice quiz questions from your notes now!`
              : `Opening your Study Pad and interactive notebook right now.`,
        },
        midAction: {
          ur_roman: `Key concepts nikali ja rahi hain aur flashcards compile ho rahe hain...`,
          en: `Analyzing key concepts and compiling active-recall flashcards and MCQs...`,
        },
        postAction: {
          ur_roman:
            extraDetail === "pack"
              ? `Flashcards aur quiz Study Pad main ready hain! Chaliye practice shuru karte hain.`
              : `Study Pad khul gaya hai! Hum yahan notes aur flashcards par kaam kar sakte hain.`,
          en:
            extraDetail === "pack"
              ? `Your flashcards and practice quiz are ready in the Study Pad!`
              : `Your Study Pad is open and ready!`,
        },
      };

    case "office":
      return {
        preAction: {
          ur_roman: `Abhi MAHR Virtual Office Floor khol rahi hoon.`,
          en: `Opening the MAHR Multi-Agent Virtual Office Floor right now.`,
        },
        midAction: {
          ur_roman: `Specialists aur team workspace connect ho rahe hain...`,
          en: `Connecting your virtual specialist agents on the office floor...`,
        },
        postAction: {
          ur_roman: `Virtual Office Floor tayyar hai!`,
          en: `The Virtual Office Floor is live and ready for delegation!`,
        },
      };

    case "routines":
      return {
        preAction: {
          ur_roman: `Ji, main Smart Routines studio khol rahi hoon.`,
          en: `Opening your Smart Autonomous Routines studio now.`,
        },
        midAction: {
          ur_roman: `Automated workflows load ho rahe hain...`,
          en: `Loading your automated study and presentation workflows...`,
        },
        postAction: {
          ur_roman: `Smart Routines aap ke saamne hain!`,
          en: `Smart Routines are open and ready to run!`,
        },
      };

    case "system":
    default:
      return {
        preAction: {
          ur_roman: `Ji bilkul, abhi kar rahi hoon!`,
          en: `Right away, applying that for you now!`,
        },
        midAction: {
          ur_roman: `Workspace settings update ho rahi hain...`,
          en: `Updating workspace state in real time...`,
        },
        postAction: {
          ur_roman: `Ho gaya!`,
          en: `All set and synchronized!`,
        },
      };
  }
}

/**
 * Comprehensive Bilingual (Urdu / Roman Urdu / English) Voice Intent Parser.
 * Resolves wake-word shadowing and maps natural speech across all 4 user-confirmed domains.
 */
export function parseBilingualVoiceIntent(
  rawTranscript: string,
  activeAgentFirstName: string = "mahr"
): BilingualVoiceIntentMatch {
  const trimmed = (rawTranscript || "").trim();
  const detectedLanguage = detectSpokenLanguageMode(trimmed);

  if (!trimmed) {
    return {
      type: "none",
      domain: "system",
      detectedLanguage,
      cleanedCommandText: "",
      rawText: "",
      cues: buildSynchronizedCues("system", ""),
    };
  }

  // Step 0: Strip leading/trailing wake words BEFORE intent detection so "Mahr, chalkboard kholo"
  // is never swallowed by `{ type: "wake" }`.
  const { cleaned, hadWakeWord } = stripWakeWordPrefix(trimmed, activeAgentFirstName);
  const lower = cleaned.toLowerCase().trim();

  // Check if the entire utterance was ONLY a wake greeting (e.g. "Hey Mahr", "Mahr wake up", "Suno Mahr")
  const pureWakePhrases = [
    "",
    "mahr",
    "mahir",
    "mehar",
    "myraa",
    "maira",
    "mira",
    "wake up",
    "uth jao",
    "uth ja",
    "jago",
    "jaag jao",
    "hello",
    "hi",
    "hey",
    "assalam o alaikum",
    "salam",
    "suno",
    "kya haal hai",
  ];
  if (hadWakeWord && pureWakePhrases.includes(lower)) {
    return {
      type: "wake",
      domain: "system",
      detectedLanguage,
      cleanedCommandText: cleaned,
      rawText: trimmed,
      cues: buildSynchronizedCues("system", "Wake Up"),
    };
  }

  // 1. Sleep / Disconnect
  const isSleep =
    /\b(go to sleep|so jao|sojao|night mahr|night myraa|standby|disconnect|shut down|turn off|chup ho jao|khuda hafiz|alvida|oyasumi)\b/i.test(
      lower
    ) || lower === "sleep";

  if (isSleep) {
    return {
      type: "sleep",
      domain: "system",
      detectedLanguage,
      cleanedCommandText: cleaned,
      rawText: trimmed,
      cues: buildSynchronizedCues("system", "Sleep Mode"),
    };
  }

  // 2. Domain 2B: Live Presenton Slide Deck Navigation (next/previous/export slide)
  if (
    /\b(next slide|agla slide|agli slide|aage chalo|next page|slide aage|go to next slide)\b/i.test(
      lower
    )
  ) {
    return {
      type: "slides_navigate",
      domain: "slides_nav",
      slideAction: "next",
      detectedLanguage,
      cleanedCommandText: cleaned,
      rawText: trimmed,
      cues: buildSynchronizedCues("slides_nav", "Next Slide", "next"),
    };
  }

  if (
    /\b(previous slide|prev slide|pichla slide|pichli slide|peeche jao|back slide|go back a slide)\b/i.test(
      lower
    )
  ) {
    return {
      type: "slides_navigate",
      domain: "slides_nav",
      slideAction: "prev",
      detectedLanguage,
      cleanedCommandText: cleaned,
      rawText: trimmed,
      cues: buildSynchronizedCues("slides_nav", "Previous Slide", "prev"),
    };
  }

  if (/\b(export slides|export pptx|download slides|download ppt|slides download)\b/i.test(lower)) {
    return {
      type: "slides_navigate",
      domain: "slides_nav",
      slideAction: "export",
      detectedLanguage,
      cleanedCommandText: cleaned,
      rawText: trimmed,
      cues: buildSynchronizedCues("slides_nav", "Export Slides", "export"),
    };
  }

  // 3. Domain 1A: Voice-to-MindMap (English + Roman Urdu)
  const mindMapCheck = isVoiceToMindMapTrigger(cleaned);
  const romanUrduMindMapMatch =
    /\b(mind\s*map|concept\s*map|workflow\s*map|naksha)\b.*\b(banao|bana|kholo|dikhao|draw|sketch)\b/i.test(
      lower
    ) ||
    /\b(banao|bana|draw|sketch)\b.*\b(mind\s*map|concept\s*map)\b/i.test(lower);

  if (mindMapCheck.isMatch || romanUrduMindMapMatch) {
    const extractedTopic =
      mindMapCheck.topic ||
      cleaned
        .replace(
          /\b(mind\s*map|concept\s*map|banao|bana|kholo|dikhao|draw|sketch|ka|ki|ke|par|on|for|about|please)\b/gi,
          " "
        )
        .replace(/\s+/g, " ")
        .trim() ||
      cleaned;
    return {
      type: "voice_to_mindmap",
      domain: "mindmap",
      topic: extractedTopic,
      isWorkflow: mindMapCheck.isWorkflow || lower.includes("workflow") || lower.includes("flow"),
      detectedLanguage,
      cleanedCommandText: cleaned,
      rawText: trimmed,
      cues: buildSynchronizedCues("mindmap", extractedTopic),
    };
  }

  // 4. Domain 2A: Presenton Slide Creation (English + Roman Urdu)
  if (
    /\b(presentation|ppt|slide deck|slides|keynote|presenton)\b/i.test(lower) ||
    /\b(slides?\s+banao|presentation\s+banao|ppt\s+banao|slides?\s+kholo|presentation\s+kholo)\b/i.test(
      lower
    )
  ) {
    const topic =
      cleaned
        .replace(
          /^(?:make|create|generate|prepare|build|open|show|ek|aik)?\s*(?:a\s+|an\s+)?(?:presentation|ppt|slides|slide deck|deck|presenton)\s*(?:banao|bana|kholo|dikhao|taiyar karo|karo)?\s*(?:on|about|for|par|ke baare mein|ka|ki)?/i,
          ""
        )
        .replace(/\b(presentation|ppt|slides|slide deck|banao|bana|kholo|dikhao|karo|par)\b/gi, " ")
        .replace(/\s+/g, " ")
        .trim() || "Strategic Topic Overview";

    return {
      type: "open_slides",
      domain: "slides",
      topic,
      detectedLanguage,
      cleanedCommandText: cleaned,
      rawText: trimmed,
      cues: buildSynchronizedCues("slides", topic),
    };
  }

  // 5. Domain 3: Memory Bank, Obsidian Vault & Daily Tasks
  // 5A. Save a new memory ("yaad rakho ...", "remember that ...", "save to memory ...")
  if (
    /\b(yaad rakho|yaad rakhna|remember that|save to memory|memory main save|store in memory|memorize that)\b/i.test(
      lower
    )
  ) {
    const memoryContent =
      cleaned
        .replace(
          /^(?:please\s+)?(?:yaad rakho|yaad rakhna|remember that|save to memory|memory main save karo|store in memory|memorize that)\s*(?:ke|ki|that|:)?\s*/i,
          ""
        )
        .trim() || cleaned;

    return {
      type: "save_memory",
      domain: "memory",
      topic: memoryContent,
      detectedLanguage,
      cleanedCommandText: cleaned,
      rawText: trimmed,
      cues: buildSynchronizedCues("memory", memoryContent, "save"),
    };
  }

  // 5B. Obsidian Vault & Knowledge Graph ("obsidian kholo", "vault kholo", "knowledge graph", "vector search")
  if (
    /\b(obsidian|second brain|vault kholo|open vault|knowledge graph|vector search|search memory|recall memory|vector memory|graph dikhao|connections dikhao)\b/i.test(
      lower
    )
  ) {
    const isVectorQuery =
      /\b(search memory|vector search|recall memory|what do you remember|kya yaad hai)\b/i.test(
        lower
      );
    const topic =
      cleaned
        .replace(
          /\b(obsidian|second brain|vault|knowledge graph|vector search|search memory|recall memory|kholo|dikhao|open|show|for|about)\b/gi,
          " "
        )
        .replace(/\s+/g, " ")
        .trim() || "Knowledge Graph";

    return {
      type: isVectorQuery ? "vector_search" : "open_obsidian",
      domain: "obsidian",
      topic,
      detectedLanguage,
      cleanedCommandText: cleaned,
      rawText: trimmed,
      cues: buildSynchronizedCues("obsidian", topic),
    };
  }

  // 5C. Open Memory Bank Dashboard ("memory dikhao", "memory bank kholo", "open memory")
  if (
    /\b(open memory|show memory|memory dashboard|memory bank|memory kholo|memory dikhao|memories dikhao|yaadein dikhao)\b/i.test(
      lower
    )
  ) {
    return {
      type: "open_memory",
      domain: "memory",
      topic: "Memory Bank",
      detectedLanguage,
      cleanedCommandText: cleaned,
      rawText: trimmed,
      cues: buildSynchronizedCues("memory", "Memory Bank", "open"),
    };
  }

  // 5D. Daily Tasks ("task add karo", "add task", "todo banao", "tasks dikhao")
  if (
    /\b(add task|add a task|new task|task add karo|task banao|todo add karo|todo banao|create task)\b/i.test(
      lower
    )
  ) {
    const taskTitle =
      cleaned
        .replace(
          /^(?:please\s+)?(?:add a task|add task|new task|create task|task add karo|task banao|todo add karo|todo banao)\s*(?:to|for|ke|ki|:)?\s*/i,
          ""
        )
        .replace(/\b(task add karo|task banao)\b/gi, "")
        .trim() || "Focused Study Session";

    return {
      type: "add_task",
      domain: "tasks",
      topic: taskTitle,
      detectedLanguage,
      cleanedCommandText: cleaned,
      rawText: trimmed,
      cues: buildSynchronizedCues("tasks", taskTitle, "add"),
    };
  }

  if (
    /\b(open tasks|show tasks|daily tasks|tasks kholo|tasks dikhao|my schedule|study plan|generate tasks|schedule banao)\b/i.test(
      lower
    )
  ) {
    return {
      type: "open_tasks",
      domain: "tasks",
      topic: "Daily Tasks",
      detectedLanguage,
      cleanedCommandText: cleaned,
      rawText: trimmed,
      cues: buildSynchronizedCues("tasks", "Daily Tasks", "open"),
    };
  }

  // 6. Domain 4: 3D Simulations, Study Pad Notes & System Controls
  // 6A. 3D Simulation Lab
  if (
    /\b(3d simulation|simulation chalao|simulation kholo|run simulation|physics simulation|3d lab|3d model banao|simulate)\b/i.test(
      lower
    )
  ) {
    const simTopic =
      cleaned
        .replace(
          /\b(3d simulation|simulation|chalao|kholo|banao|run|open|launch|start|for|of|on|par|ka|ki)\b/gi,
          " "
        )
        .replace(/\s+/g, " ")
        .trim() || "Interactive Physics & Biology Model";

    return {
      type: "open_simulation",
      domain: "simulation",
      topic: simTopic,
      detectedLanguage,
      cleanedCommandText: cleaned,
      rawText: trimmed,
      cues: buildSynchronizedCues("simulation", simTopic),
    };
  }

  // 6B. Study Pad Flashcards & Quiz Generation
  if (
    /\b(flashcards?\s+banao|make flashcards|generate flashcards|quiz\s+banao|make a quiz|mcq\s+banao|study pack|compile flashcards)\b/i.test(
      lower
    )
  ) {
    return {
      type: "generate_study_pack",
      domain: "studypad",
      topic: cleaned,
      detectedLanguage,
      cleanedCommandText: cleaned,
      rawText: trimmed,
      cues: buildSynchronizedCues("studypad", "Flashcards & Quiz", "pack"),
    };
  }

  // 6C. Open Study Pad / Notes
  if (
    /\b(study pad|studypad|open notes|show notes|notes kholo|notes dikhao|study pad kholo|notebook kholo)\b/i.test(
      lower
    )
  ) {
    return {
      type: "open_studypad",
      domain: "studypad",
      topic: "Study Pad",
      detectedLanguage,
      cleanedCommandText: cleaned,
      rawText: trimmed,
      cues: buildSynchronizedCues("studypad", "Study Pad", "open"),
    };
  }

  // 7. Domain 1B: Code on Chalkboard ("code likho", "write code", "algorithm likho")
  if (
    /\b(code likho|write code|code on chalkboard|algorithm likho|program likho|function likho|debug code)\b/i.test(
      lower
    )
  ) {
    const codeTopic =
      cleaned
        .replace(/\b(code likho|write code|on chalkboard|algorithm likho|program likho|for|on)\b/gi, " ")
        .replace(/\s+/g, " ")
        .trim() || cleaned;

    return {
      type: "code_chalkboard",
      domain: "code",
      topic: codeTopic,
      detectedLanguage,
      cleanedCommandText: cleaned,
      rawText: trimmed,
      cues: buildSynchronizedCues("code", codeTopic),
    };
  }

  // 8. Domain 1C: Chalkboard / Diagrams / Sketch ("chalkboard kholo", "board kholo", "diagram banao", "flowchart banao", "draw")
  if (
    /\b(chalkboard|whiteboard|blackboard|board kholo|board dikhao|flowchart|flow chart|diagram|diagram banao|sketch|draw)\b/i.test(
      lower
    )
  ) {
    return {
      type: "sketch",
      domain: "chalkboard",
      topic: cleaned,
      detectedLanguage,
      cleanedCommandText: cleaned,
      rawText: trimmed,
      cues: buildSynchronizedCues("chalkboard", cleaned),
    };
  }

  // 9. Virtual Office & Smart Routines
  if (
    /\b(open office|virtual office|office kholo|munder difflin|call jim|call dwight|call pam|team floor)\b/i.test(
      lower
    )
  ) {
    return {
      type: "open_office",
      domain: "office",
      topic: "Virtual Office Floor",
      detectedLanguage,
      cleanedCommandText: cleaned,
      rawText: trimmed,
      cues: buildSynchronizedCues("office", "Virtual Office Floor"),
    };
  }

  if (
    /\b(open routine|smart routine|routines kholo|morning briefing|daily briefing|quick routines)\b/i.test(
      lower
    )
  ) {
    return {
      type: "open_routines",
      domain: "routines",
      topic: "Smart Routines",
      detectedLanguage,
      cleanedCommandText: cleaned,
      rawText: trimmed,
      cues: buildSynchronizedCues("routines", "Smart Routines"),
    };
  }

  // 10. Focus Mode
  if (
    /\b(focus mode|hide distractions|distractions hatao|hide the sidebar|center the visualizer)\b/i.test(
      lower
    )
  ) {
    const isDeactivate = /\b(off|deactivate|exit|stop|disable|band|khatam)\b/i.test(lower);
    return {
      type: "focus_mode",
      domain: "system",
      isFocusDeactivate: isDeactivate,
      detectedLanguage,
      cleanedCommandText: cleaned,
      rawText: trimmed,
      cues: buildSynchronizedCues("system", isDeactivate ? "Exit Focus Mode" : "Focus Mode"),
    };
  }

  // 11. Registered Voice Command Shortcuts (themes, personas, etc.)
  const matchedCmd = matchVoiceCommand(cleaned);
  if (matchedCmd && matchedCmd.id !== "wake_word") {
    return {
      type: "voice_command",
      domain: "system",
      topic: matchedCmd.phrase,
      detectedLanguage,
      cleanedCommandText: cleaned,
      rawText: trimmed,
      cues: buildSynchronizedCues("system", matchedCmd.description),
    };
  }

  // 12. Fallback: If the utterance only contained a wake word with conversational greeting
  if (hadWakeWord && cleaned.split(/\s+/).length <= 3) {
    return {
      type: "wake",
      domain: "system",
      detectedLanguage,
      cleanedCommandText: cleaned,
      rawText: trimmed,
      cues: buildSynchronizedCues("system", "Wake"),
    };
  }

  return {
    type: "none",
    domain: "system",
    detectedLanguage,
    cleanedCommandText: cleaned,
    rawText: trimmed,
    cues: buildSynchronizedCues("system", ""),
  };
}

/**
 * Converts a `BilingualVoiceIntentMatch` to the legacy `VoiceActionResult` contract
 * so existing callers of `detectVoiceAction()` automatically benefit from wake-word
 * unshadowing and bilingual Urdu/Roman-Urdu/English matching.
 */
export function toLegacyVoiceActionResult(
  match: BilingualVoiceIntentMatch
): VoiceActionResult {
  switch (match.type) {
    case "voice_to_mindmap":
      return {
        type: "voice_to_mindmap",
        topic: match.topic,
        isWorkflow: match.isWorkflow,
        rawText: match.rawText,
      };
    case "sleep":
      return { type: "sleep", rawText: match.rawText };
    case "wake":
      return { type: "wake", rawText: match.rawText };
    case "focus_mode":
      return {
        type: "focus_mode",
        isFocusDeactivate: match.isFocusDeactivate,
        rawText: match.rawText,
      };
    case "open_obsidian":
    case "vector_search":
      return {
        type: "vector_search",
        topic: match.topic,
        rawText: match.rawText,
      };
    case "open_slides":
      return {
        type: "open_slides",
        topic: match.topic,
        rawText: match.rawText,
      };
    case "open_office":
      return { type: "open_office", rawText: match.rawText };
    case "open_routines":
      return { type: "open_routines", rawText: match.rawText };
    case "sketch":
    case "code_chalkboard":
      return {
        type: "sketch",
        topic: match.topic || match.cleanedCommandText,
        rawText: match.rawText,
      };
    case "voice_command": {
      const cmd = matchVoiceCommand(match.cleanedCommandText);
      if (cmd) {
        return {
          type: "voice_command",
          command: cmd,
          rawText: match.rawText,
        };
      }
      return { type: "none", rawText: match.rawText };
    }
    default:
      return { type: "none", rawText: match.rawText };
  }
}

// Streaming transcript coalescer state to prevent duplicate triggers on incremental Live API chunks
let lastExecutedIntentSignature = "";
let lastExecutedTimestamp = 0;
let rollingUserTranscriptWindow = "";
let lastTranscriptChunkTime = 0;

/**
 * Coalesces incremental `inputTranscription` chunks from Gemini Live within a 1.8s rolling window
 * and deduplicates matched intents over a 2.8s cooldown so each spoken command executes
 * once with `< 50ms` dispatch latency.
 */
export function matchStreamingVoiceIntent(
  incomingChunk: string,
  activeAgentFirstName: string = "mahr"
): BilingualVoiceIntentMatch | null {
  const now = performance.now();
  const cleanChunk = (incomingChunk || "").trim();
  if (!cleanChunk) return null;

  if (now - lastTranscriptChunkTime > 2200) {
    rollingUserTranscriptWindow = cleanChunk;
  } else {
    // If incomingChunk already contains the previous prefix, replace; otherwise append
    if (
      cleanChunk.toLowerCase().startsWith(rollingUserTranscriptWindow.toLowerCase()) ||
      cleanChunk.length > rollingUserTranscriptWindow.length + 6
    ) {
      rollingUserTranscriptWindow = cleanChunk;
    } else if (!rollingUserTranscriptWindow.toLowerCase().includes(cleanChunk.toLowerCase())) {
      rollingUserTranscriptWindow = `${rollingUserTranscriptWindow} ${cleanChunk}`.trim();
    }
  }
  lastTranscriptChunkTime = now;

  // First try matching on the direct incoming transcript, then on the coalesced window
  let match = parseBilingualVoiceIntent(cleanChunk, activeAgentFirstName);
  if (match.type === "none" || match.type === "wake") {
    const windowMatch = parseBilingualVoiceIntent(rollingUserTranscriptWindow, activeAgentFirstName);
    if (windowMatch.type !== "none") {
      match = windowMatch;
    }
  }

  if (match.type === "none" || match.type === "wake") {
    return null;
  }

  const signature = `${match.type}:${match.domain}:${(match.topic || "").toLowerCase().slice(0, 24)}`;
  if (signature === lastExecutedIntentSignature && now - lastExecutedTimestamp < 2800) {
    return null;
  }

  lastExecutedIntentSignature = signature;
  lastExecutedTimestamp = now;
  return match;
}
