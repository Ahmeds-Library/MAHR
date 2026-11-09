import { useState, useCallback, useRef, useEffect } from "react";
import { useGoogleWorkspace } from "./useGoogleWorkspace";
import { listUpcomingCalendarEvents } from "../../services/google/googleCalendarClient";
import { listRecentEmails } from "../../services/google/googleGmailClient";
import { listUserTasks, createUserTask, updateUserTask } from "../../services/google/googleTasksClient";
import { speakUtterance } from "../../services/speechSynthesisService";

export type AssistantVoiceState = "idle" | "listening" | "processing" | "speaking";

export interface AssistantActivityLog {
  id: string;
  type: "calendar" | "gmail" | "tasks" | "drive" | "general";
  title: string;
  detail: string;
  timestamp: string;
}

export function useMahrAssistantVoice() {
  const { isAuthenticated, getToken, user } = useGoogleWorkspace();
  const [voiceState, setVoiceState] = useState<AssistantVoiceState>("idle");
  const [spokenResponse, setSpokenResponse] = useState<string>("");
  const [transcript, setTranscript] = useState<string>("");
  const [activityLogs, setActivityLogs] = useState<AssistantActivityLog[]>([]);
  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech Recognition if available
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setVoiceState("listening");
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
        if (event.results[current].isFinal) {
          handleVoiceCommand(text);
        }
      };

      recognition.onerror = () => {
        setVoiceState("idle");
      };

      recognition.onend = () => {
        // Will transition to processing/speaking if command was sent
        setVoiceState((prev) => (prev === "listening" ? "idle" : prev));
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const speak = useCallback((text: string) => {
    setSpokenResponse(text);
    setVoiceState("speaking");

    // Route through the primary SpeechSynthesisService (Live Audio Engine)
    const spoke = speakUtterance({
      text,
      overrideEmotion: "happy",
      onEnd: () => setVoiceState("idle"),
      onError: () => setVoiceState("idle"),
    });

    // Native browser speech synthesis fallback
    if (!spoke && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.onend = () => setVoiceState("idle");
        utterance.onerror = () => setVoiceState("idle");
        window.speechSynthesis.speak(utterance);
      } catch {
        setTimeout(() => setVoiceState("idle"), 2500);
      }
    } else if (!spoke) {
      setTimeout(() => setVoiceState("idle"), 2500);
    }
  }, []);

  const handleVoiceCommand = useCallback(
    async (commandText: string) => {
      setVoiceState("processing");
      const normalized = commandText.toLowerCase().trim();
      const userName = user?.displayName
        ? user.displayName.split(" ")[0]
        : (user?.email ? user.email.split("@")[0] : "friend");

      // Detect Workspace Intents
      const isCalendarIntent =
        normalized.includes("calendar") ||
        normalized.includes("schedule") ||
        normalized.includes("meeting") ||
        normalized.includes("event");

      const isEmailIntent =
        normalized.includes("email") ||
        normalized.includes("gmail") ||
        normalized.includes("mail") ||
        normalized.includes("inbox");

      const isCreateTaskIntent =
        normalized.startsWith("add task") ||
        normalized.startsWith("create task") ||
        normalized.startsWith("remember to") ||
        normalized.startsWith("schedule task") ||
        normalized.startsWith("new task") ||
        normalized.includes("add a task") ||
        normalized.includes("add to my tasks");

      const isCompleteTaskIntent =
        normalized.startsWith("complete task") ||
        normalized.startsWith("finish task") ||
        normalized.startsWith("mark task") ||
        normalized.includes("mark as completed") ||
        normalized.includes("mark as done");

      const isTaskQueryIntent =
        normalized.includes("task") ||
        normalized.includes("to-do") ||
        normalized.includes("todo");

      const isClassroomIntent =
        normalized.includes("classroom") ||
        normalized.includes("assignment") ||
        normalized.includes("coursework") ||
        normalized.includes("homework");

      const isWorkspaceIntent =
        isCalendarIntent ||
        isEmailIntent ||
        isCreateTaskIntent ||
        isCompleteTaskIntent ||
        isTaskQueryIntent ||
        isClassroomIntent;

      // Handle App Update Voice Command
      const isUpdateIntent =
        normalized.includes("check for update") ||
        normalized.includes("check update") ||
        normalized.includes("app update") ||
        normalized.includes("update check karo") ||
        normalized.includes("version check");

      if (isUpdateIntent) {
        try {
          const { checkForAppUpdates, CURRENT_APP_VERSION } = await import(
            "../../services/updater/githubReleaseService"
          );
          const result = await checkForAppUpdates(CURRENT_APP_VERSION);
          if (result.hasUpdate) {
            speak(
              `Aap ke liye MAHR ka naya version ${result.latestVersion} release ho chuka hai! Aap header mein Update button daba kar download kar saktay hain.`
            );
          } else {
            speak(
              `Aap ka MAHR system pehle se hi latest version ${CURRENT_APP_VERSION} par update hai, aur auto-sync engine active hai.`
            );
          }
          setActivityLogs((prev) => [
            {
              id: Date.now().toString(),
              type: "general",
              title: "System Update Check",
              detail: result.hasUpdate ? `Update v${result.latestVersion} available` : `Up to date (v${CURRENT_APP_VERSION})`,
              timestamp: "Just now",
            },
            ...prev.slice(0, 5),
          ]);
        } catch {
          speak("Update check karte waqt masla aya, lekin auto-sync background mein chal raha hai.");
        }
        return;
      }

      // Handle Workspace specific commands
      if (isWorkspaceIntent) {
        if (!isAuthenticated) {
          speak(
            "To access your Google Calendar, Gmail, or Tasks, please connect your account in Settings. In the meantime, I can answer your questions or help you study!"
          );
          return;
        }

        const token = await getToken();
        if (!token) {
          speak("Your Google session has expired. Please reconnect your account in Settings.");
          return;
        }

        // 1. Calendar intent
        if (isCalendarIntent) {
          try {
            const events = await listUpcomingCalendarEvents(token, 3);
            if (events.length === 0) {
              speak(`Your calendar is completely clear today, ${userName}.`);
            } else {
              const first = events[0];
              const timeStr = first.start?.dateTime
                ? new Date(first.start.dateTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
                : "today";
              speak(`You have ${events.length} upcoming event${events.length > 1 ? "s" : ""}. Next is "${first.summary}" at ${timeStr}.`);
              setActivityLogs((prev) => [
                {
                  id: Date.now().toString(),
                  type: "calendar",
                  title: first.summary,
                  detail: `Scheduled for ${timeStr}`,
                  timestamp: "Just now",
                },
                ...prev.slice(0, 5),
              ]);
            }
          } catch {
            speak("I had trouble reaching your Google Calendar. Please check your permissions.");
          }
          return;
        }

        // 2. Gmail intent
        if (isEmailIntent) {
          try {
            const emails = await listRecentEmails(token, 3);
            const unreadCount = emails.filter((e) => e.unread).length;
            if (unreadCount > 0) {
              speak(`You have ${unreadCount} unread email${unreadCount > 1 ? "s" : ""}. The latest is: ${emails[0]?.subject || "New email"}.`);
            } else {
              speak(`Your inbox is all caught up, ${userName}.`);
            }
            if (emails.length > 0) {
              setActivityLogs((prev) => [
                {
                  id: Date.now().toString(),
                  type: "gmail",
                  title: emails[0].subject || "Latest Email",
                  detail: `From ${emails[0].from || "Unknown"}`,
                  timestamp: "Just now",
                },
                ...prev.slice(0, 5),
              ]);
            }
          } catch {
            speak("I could not access your Gmail inbox right now.");
          }
          return;
        }

        // 3. Create Task Intent
        if (isCreateTaskIntent) {
          let taskTitle = commandText
            .replace(/^(add task|create task|remember to|schedule task|new task|add a task|add to my tasks|please add task|please)/i, "")
            .trim();
          if (taskTitle.toLowerCase().startsWith("to ")) {
            taskTitle = taskTitle.substring(3).trim();
          }
          if (!taskTitle) taskTitle = "Voice reminder";
          taskTitle = taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1);

          try {
            const created = await createUserTask(token, taskTitle, "Added by MAHR Voice Assistant");
            speak(`I've added "${created.title}" to your Google Tasks.`);
            setActivityLogs((prev) => [
              {
                id: Date.now().toString(),
                type: "tasks",
                title: created.title,
                detail: "Created in Google Tasks",
                timestamp: "Just now",
              },
              ...prev.slice(0, 5),
            ]);
          } catch {
            speak("I was unable to create the task in Google Tasks.");
          }
          return;
        }

        // 4. Complete Task Intent
        if (isCompleteTaskIntent) {
          try {
            const tasks = await listUserTasks(token, "@default", 20);
            const pending = tasks.filter((t) => t.status === "needsAction");
            if (pending.length === 0) {
              speak(`You have no pending Google tasks to complete, ${userName}!`);
              return;
            }

            const query = normalized
              .replace(/^(complete task|finish task|mark task|done task)/i, "")
              .replace(/(as done|as completed|done)/i, "")
              .trim()
              .toLowerCase();

            const target = query
              ? pending.find((t) => t.title.toLowerCase().includes(query)) || pending[0]
              : pending[0];

            await updateUserTask(token, target.id, { status: "completed" });
            speak(`Done! I've marked "${target.title}" as completed.`);
            setActivityLogs((prev) => [
              {
                id: Date.now().toString(),
                type: "tasks",
                title: `Completed: ${target.title}`,
                detail: "Marked done in Google Tasks",
                timestamp: "Just now",
              },
              ...prev.slice(0, 5),
            ]);
          } catch {
            speak("I was unable to update your task in Google Tasks.");
          }
          return;
        }

        // 5. Query Tasks Intent
        if (isTaskQueryIntent) {
          try {
            const tasks = await listUserTasks(token, "@default", 10);
            const pending = tasks.filter((t) => t.status === "needsAction");
            if (pending.length === 0) {
              speak(`All your Google tasks are completed, ${userName}. Great job!`);
            } else {
              speak(`You have ${pending.length} pending Google task${pending.length > 1 ? "s" : ""}. Top item is: "${pending[0].title}".`);
              setActivityLogs((prev) => [
                {
                  id: Date.now().toString(),
                  type: "tasks",
                  title: pending[0].title,
                  detail: `${pending.length} pending in Google Tasks`,
                  timestamp: "Just now",
                },
                ...prev.slice(0, 5),
              ]);
            }
          } catch {
            speak("Unable to reach Google Tasks right now.");
          }
          return;
        }

        // 6. Classroom Intent
        if (isClassroomIntent) {
          try {
            const { listClassroomCourses, listClassroomCourseWork } = await import(
              "../../services/google/googleClassroomClient"
            );
            const courses = await listClassroomCourses(token);
            if (courses.length === 0) {
              speak(`You do not have any active classes in Google Classroom, ${userName}.`);
            } else {
              const first = courses[0];
              const assignments = await listClassroomCourseWork(token, first.id);
              if (assignments.length > 0) {
                speak(
                  `In ${first.name}, your next assignment is "${assignments[0].title}". You can click Classroom in the navigation to study it with me on the chalkboard!`
                );
              } else {
                speak(`You have ${courses.length} enrolled classes in Google Classroom. Top class is ${first.name}, and you are caught up!`);
              }
              setActivityLogs((prev) => [
                {
                  id: Date.now().toString(),
                  type: "general",
                  title: `Classroom: ${first.name}`,
                  detail: `${assignments.length} assignments found`,
                  timestamp: "Just now",
                },
                ...prev.slice(0, 5),
              ]);
            }
          } catch {
            speak("I was unable to load your Google Classroom right now. Please check your connected accounts in Settings.");
          }
          return;
        }
      }

      // Conversational Human Assistant: Use Gemini AI to respond like a real human tutor
      try {
        const chatRes = await fetch("/api/chat/subagent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: commandText,
            subAgentName: "MAHR",
            subAgentRole: "Interactive Personal Tutor & Voice Companion",
            subAgentSystemPrompt:
              "You are MAHR, an advanced digital learning companion and interactive tutor. Respond in 1 to 3 clear, warm, conversational sentences suitable for speech synthesis. Do not use markdown formatting, bullet points, asterisks, or code blocks. If the user spoke in Urdu, reply in natural conversational Urdu.",
            userContext: `Voice dialogue session with user: ${userName}${user?.email ? ` (${user.email})` : ""}.`
          }),
        });

        if (chatRes.ok) {
          const data = await chatRes.json();
          let replyText = (data.text || "").replace(/```[\s\S]*?```/g, "").replace(/[*_#`]/g, "").trim();
          if (replyText) {
            speak(replyText);
            setActivityLogs((prev) => [
              {
                id: Date.now().toString(),
                type: "general",
                title: commandText.length > 35 ? commandText.slice(0, 32) + "..." : commandText,
                detail: replyText.length > 50 ? replyText.slice(0, 47) + "..." : replyText,
                timestamp: "Just now",
              },
              ...prev.slice(0, 5),
            ]);
            return;
          }
        }
      } catch (aiErr) {
        console.warn("[MahrVoice] Real-time conversational AI voice error:", aiErr);
      }

      // Natural Human Fallback
      speak(`I'm right here with you, ${userName}. What would you like to work on?`);
    },
    [isAuthenticated, getToken, user, speak]
  );

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        setTranscript("");
        recognitionRef.current.start();
      } catch {
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current.start(), 200);
      }
    } else {
      speak("Speech recognition is not supported in this browser environment. You can use text chat or click workspace actions.");
    }
  }, [speak]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setVoiceState("idle");
  }, []);

  return {
    voiceState,
    spokenResponse,
    transcript,
    activityLogs,
    startListening,
    stopListening,
    speak,
    handleVoiceCommand,
  };
}
