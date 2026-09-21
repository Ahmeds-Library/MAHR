// 🏢 Layer 2: useMunderDifflinOffice Hook
// Controller hook managing the virtual office floor, task delegation, and executive reviews

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  OfficeAgent,
  OfficeTaskTicket,
  OfficeMemo,
  INITIAL_OFFICE_AGENTS,
  INITIAL_OFFICE_MEMOS,
  TicketStatus
} from "../types/munderDifflinTypes";
import {
  loadOfficeState,
  saveOfficeState,
  bossDecomposeAndDelegate,
  executeAgentTicket
} from "../services/munderDifflinService";
import confetti from "canvas-confetti";

export interface UseMunderDifflinOfficeProps {
  onUpdateWhiteboardText?: (newMarkdown: string) => void;
  onUpdateStudyPadText?: (newNotes: string) => void;
  onNotifyUser?: (msg: string) => void;
}

export function useMunderDifflinOffice({
  onUpdateWhiteboardText,
  onUpdateStudyPadText,
  onNotifyUser
}: UseMunderDifflinOfficeProps = {}) {
  const [agents, setAgents] = useState<OfficeAgent[]>(INITIAL_OFFICE_AGENTS);
  const [tickets, setTickets] = useState<OfficeTaskTicket[]>([]);
  const [memos, setMemos] = useState<OfficeMemo[]>(INITIAL_OFFICE_MEMOS);
  const [activeTab, setActiveTab] = useState<"floor" | "kanban" | "mailbox" | "boss_suite" | "terminal" | "worktrees">("floor");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>("agent-mahr-boss");
  const [isDelegating, setIsDelegating] = useState<boolean>(false);
  const [isConferenceActive, setIsConferenceActive] = useState<boolean>(false);
  const [standupTranscript, setStandupTranscript] = useState<string[]>([]);
  const [flyingEnvelopes, setFlyingEnvelopes] = useState<Array<{
    id: string;
    fromPos: { x: number; y: number };
    toPos: { x: number; y: number };
    label: string;
  }>>([]);
  const [dundieModalOpen, setDundieModalOpen] = useState<boolean>(false);
  const [latestDundie, setLatestDundie] = useState<{ winnerName: string; awardTitle: string; speech: string } | null>(null);
  const [lastBossSpeech, setLastBossSpeech] = useState<string>(
    "Welcome to Munder-Difflin! I am MAHR, your Executive Regional Manager. Give me any mission, and I'll delegate it to our specialized team."
  );

  // Load persisted state on mount
  useEffect(() => {
    let mounted = true;
    loadOfficeState().then((state) => {
      if (mounted) {
        setAgents(state.agents);
        setTickets(state.tickets);
        setMemos(state.memos);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Save state on changes
  useEffect(() => {
    saveOfficeState(agents, tickets, memos);
  }, [agents, tickets, memos]);

  // Selected agent object
  const selectedAgent = useMemo(() => {
    return agents.find((a) => a.id === selectedAgentId) || agents[0];
  }, [agents, selectedAgentId]);

  // MAHR (The Boss)
  const bossAgent = useMemo(() => {
    return agents.find((a) => a.isBoss) || agents[0];
  }, [agents]);

  // Unread memos count for the whole office
  const totalUnreadMemos = useMemo(() => {
    return memos.filter((m) => !m.read).length;
  }, [memos]);

  // Statistics
  const stats = useMemo(() => {
    const total = tickets.length;
    const completed = tickets.filter((t) => t.status === "approved").length;
    const inProgress = tickets.filter((t) => t.status === "working" || t.status === "assigned").length;
    const underReview = tickets.filter((t) => t.status === "boss_review").length;
    return { total, completed, inProgress, underReview };
  }, [tickets]);

  // 1. Delegate a Mission as the Boss
  const handleBossDelegateMission = useCallback(
    async (missionGoal: string) => {
      if (!missionGoal.trim()) return;
      setIsDelegating(true);

      // Boss updates speech and state
      setLastBossSpeech(`Evaluating mission: "${missionGoal}"... Calling emergency team sync!`);

      // Decompose
      const { newTickets, newMemos, bossSpeech } = bossDecomposeAndDelegate(missionGoal, agents);

      // Update agents' statuses
      setAgents((prev) =>
        prev.map((agent) => {
          const isAssigned = newTickets.some((t) => t.assignedToAgentId === agent.id);
          if (agent.isBoss) {
            return { ...agent, status: "reviewing" };
          }
          if (isAssigned) {
            const ticket = newTickets.find((t) => t.assignedToAgentId === agent.id);
            return {
              ...agent,
              status: "working",
              currentTaskTitle: ticket?.title,
              unreadMailCount: agent.unreadMailCount + 1
            };
          }
          return agent;
        })
      );

      setTickets((prev) => [...newTickets, ...prev]);
      setMemos((prev) => [...newMemos, ...prev]);
      setLastBossSpeech(bossSpeech);
      setIsDelegating(false);

      if (onNotifyUser) {
        onNotifyUser(`👔 MAHR (Boss) delegated ${newTickets.length} tasks to the Munder-Difflin office team!`);
      }
    },
    [agents, onNotifyUser]
  );

  // 2. Execute a ticket on behalf of an agent
  const handleExecuteTicket = useCallback(
    (ticketId: string) => {
      const ticket = tickets.find((t) => t.id === ticketId);
      if (!ticket) return;

      const agent = agents.find((a) => a.id === ticket.assignedToAgentId);
      if (!agent) return;

      // Mark agent as working
      setAgents((prev) =>
        prev.map((a) => (a.id === agent.id ? { ...a, status: "working" } : a))
      );

      // Simulate rapid AI agent computation & produce deliverable
      setTimeout(() => {
        const { deliverable, memoToBoss, bossFeedback } = executeAgentTicket(ticket, agent);

        // Update ticket
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  status: "boss_review",
                  outputDeliverable: deliverable,
                  bossFeedback,
                  completedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                }
              : t
          )
        );

        // Add memo to boss
        setMemos((prev) => [memoToBoss, ...prev]);

        // Update agent status to reviewing
        setAgents((prev) =>
          prev.map((a) =>
            a.id === agent.id
              ? { ...a, status: "reviewing" }
              : a.id === "agent-mahr-boss"
              ? { ...a, unreadMailCount: a.unreadMailCount + 1 }
              : a
          )
        );

        if (onNotifyUser) {
          onNotifyUser(`📬 ${agent.name} submitted ticket deliverable to MAHR for executive review!`);
        }
      }, 600);
    },
    [tickets, agents, onNotifyUser]
  );

  // 3. MAHR (The Boss) Reviews & Signs Off on a Deliverable
  const handleBossSignOff = useCallback(
    (ticketId: string) => {
      const ticket = tickets.find((t) => t.id === ticketId);
      if (!ticket) return;

      const agent = agents.find((a) => a.id === ticket.assignedToAgentId);

      // Confetti burst for executive approval
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // no-op
      }

      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? { ...t, status: "approved" }
            : t
        )
      );

      setAgents((prev) =>
        prev.map((a) => {
          if (a.id === ticket.assignedToAgentId) {
            return {
              ...a,
              status: "completed",
              tasksCompleted: a.tasksCompleted + 1,
              currentTaskTitle: undefined
            };
          }
          if (a.isBoss) {
            return { ...a, status: "idle" };
          }
          return a;
        })
      );

      const approvalMemo: OfficeMemo = {
        id: `memo-approved-${Date.now()}`,
        fromAgentId: "agent-mahr-boss",
        toAgentId: ticket.assignedToAgentId,
        subject: `👑 EXECUTIVE APPROVAL: ${ticket.title}`,
        content: `Great job, ${agent?.nickname || "team member"}! Your deliverable has passed executive review and is officially approved.\n\nFeedback: ${ticket.bossFeedback || "Outstanding effort."}\n\n— MAHR, Executive Regional Manager`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        read: false,
        type: "boss_approval",
        relatedTicketId: ticket.id
      };

      setMemos((prev) => [approvalMemo, ...prev]);

      if (onNotifyUser) {
        onNotifyUser(`👑 MAHR granted Executive Sign-Off for ${ticket.title}!`);
      }
    },
    [tickets, agents, onNotifyUser]
  );

  // 4. Export consolidated executive report to Whiteboard or Study Pad
  const handleExportOfficeReport = useCallback(() => {
    const completedTickets = tickets.filter((t) => t.status === "approved" || t.status === "boss_review");
    if (completedTickets.length === 0) {
      if (onNotifyUser) onNotifyUser("⚠️ No completed deliverables to export yet. Assign a mission first!");
      return;
    }

    let report = `# 🏢 MUNDER-DIFFLIN MULTI-AGENT EXECUTIVE BRIEFING\n\n`;
    report += `*Coordinated by MAHR, Executive Regional Manager • Generated: ${new Date().toLocaleString()}*\n\n---\n\n`;
    report += `## 👔 Boss Summary Statement\n> "${lastBossSpeech}"\n\n`;
    report += `### 📊 Department Deliverables & Verification\n\n`;

    completedTickets.forEach((t, i) => {
      const agent = agents.find((a) => a.id === t.assignedToAgentId);
      report += `#### ${i + 1}. [${agent?.nickname?.toUpperCase() || "AGENT"}] ${t.title}\n`;
      report += `- **Assigned Agent**: ${agent?.name || "Specialist"} (${agent?.characterRole})\n`;
      report += `- **Priority**: \`${t.priority.toUpperCase()}\` | **Status**: \`${t.status.toUpperCase()}\`\n`;
      report += `\n${t.outputDeliverable || "*(In progress)*"}\n\n`;
      if (t.bossFeedback) {
        report += `**Boss Feedback**: *${t.bossFeedback}*\n\n`;
      }
      report += `---\n\n`;
    });

    if (onUpdateWhiteboardText) {
      onUpdateWhiteboardText(report);
    }
    if (onUpdateStudyPadText) {
      onUpdateStudyPadText(report);
    }
    if (onNotifyUser) {
      onNotifyUser("✨ Munder-Difflin Executive Briefing successfully synced to Whiteboard & Study Pad!");
    }
  }, [tickets, agents, lastBossSpeech, onUpdateWhiteboardText, onUpdateStudyPadText, onNotifyUser]);

  // 5. Emergency Conference Room Standup Meeting (Michael Scott Style)
  const handleCallStandup = useCallback(() => {
    setIsConferenceActive(true);
    setLastBossSpeech("EVERYBODY IN THE CONFERENCE ROOM! FIVE MINUTES! NO, RIGHT NOW!");
    
    // Set all agents to "working" or "reviewing"
    setAgents((prev) =>
      prev.map((a) => (a.isBoss ? { ...a, status: "working" } : { ...a, status: "reviewing" }))
    );

    const transcript = [
      "👑 MAHR (Boss): 'Welcome everyone. I called this standup because synergy is down 4% and we need to revolutionize paper—I mean, AI agents!'",
      "🌾 Dwight: 'Code harness fortified. I have confiscated 3 unauthorized prompt injections and placed Jim's keyboard in a bear safe.'",
      "🥪 Jim: 'Right. And I noticed Dwight's desk is currently outside in the hallway. Architecture looks clean though.'",
      "🎨 Pam: 'All memos dispatched. The student's whiteboard is completely up to date with today's calculus and circuit formulas.'",
      "💻 Ryan: 'I just open-sourced our entire meeting onto GitHub and called it WUPHF-Chain. VCs are already sliding into my DMs.'",
      "📊 Stanley: 'It is 4:45 PM. Can someone please tell me what this has to do with Pretzel Day?'",
      "🐱 Angela: 'The Party Planning Committee has determined that Stanley's pretzel request violates subsection 4B of the code style guide.'",
      "🍪 Kevin: 'Why waste time say lot word when few word do trick? Code good. Chili hot.'",
      "📑 Oscar: 'Actually, Kevin, chili has zero correlation with algorithmic time complexity, but your arithmetic estimates were surprisingly accurate.'",
      "🕊️ Toby: 'Guys, we really need to review the employee safety guidelines regarding AI execution permissions...'",
      "👑 MAHR (Boss): 'Nobody asked you, Toby! Why are you the way that you are? Standup adjourned!'"
    ];

    setStandupTranscript(transcript);

    // After 6 seconds, wrap up standup and celebrate
    setTimeout(() => {
      setIsConferenceActive(false);
      setAgents((prev) => prev.map((a) => ({ ...a, status: "idle" })));
      try {
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      } catch (e) {
        // no-op
      }
      if (onNotifyUser) {
        onNotifyUser("📢 Munder-Difflin Conference Room Standup completed with 100% office morale!");
      }
    }, 6000);
  }, [onNotifyUser]);

  // 6. Send Agent on a Coffee Break
  const handleSendToCoffeeBreak = useCallback((agentId: string) => {
    const target = agents.find((a) => a.id === agentId);
    if (!target) return;

    setAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, status: "coffee_break" } : a))
    );

    const breakMemo: OfficeMemo = {
      id: `memo-coffee-${Date.now()}`,
      fromAgentId: agentId,
      toAgentId: "all",
      subject: `☕ Coffee Break: ${target.nickname} stepped to the breakroom`,
      content: `${target.name} is taking a 15-minute coffee break at the breakroom dispenser. Status: recharging tokens.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      read: false,
      type: "watercooler"
    };

    setMemos((prev) => [breakMemo, ...prev]);

    if (onNotifyUser) {
      onNotifyUser(`☕ ${target.name} went to the breakroom for fresh coffee!`);
    }

    // Auto resume after 5 seconds
    setTimeout(() => {
      setAgents((prev) =>
        prev.map((a) => (a.id === agentId ? { ...a, status: "idle" } : a))
      );
    }, 5000);
  }, [agents, onNotifyUser]);

  // 7. Award a Dundie Award (The Dundies!)
  const handleAwardDundie = useCallback((agentId: string, customAward?: string) => {
    const target = agents.find((a) => a.id === agentId);
    if (!target) return;

    const awardTitle = customAward || target.dundieAward || "Outstanding Performance in Paper & Code";
    const speech = `👑 MAHR: 'And the Dundie for "${awardTitle}" goes to... ${target.name}! Feel god in this Chili's tonight!'`;

    setLatestDundie({
      winnerName: target.name,
      awardTitle,
      speech
    });
    setDundieModalOpen(true);

    try {
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
    } catch (e) {
      // no-op
    }

    const dundieMemo: OfficeMemo = {
      id: `memo-dundie-${Date.now()}`,
      fromAgentId: "agent-mahr-boss",
      toAgentId: "all",
      subject: `🏆 DUNDIE AWARD: ${target.name} wins "${awardTitle}"!`,
      content: speech,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      read: false,
      type: "dundie_award"
    };

    setMemos((prev) => [dundieMemo, ...prev]);

    if (onNotifyUser) {
      onNotifyUser(`🏆 MAHR awarded a Dundie to ${target.name}: "${awardTitle}"!`);
    }
  }, [agents, onNotifyUser]);

  // 8. Run an interactive CLI command on an agent's terminal
  const handleRunAgentCli = useCallback((agentId: string, command: string) => {
    if (!command.trim()) return;
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return;

    const cmdClean = command.trim();
    const timestamp = new Date().toLocaleTimeString();

    let output = `[${agent.cliTool}] Execution verified. Zero syntax errors detected.`;
    if (cmdClean.includes("status")) {
      output = `[STATUS] Desk #${agent.deskNumber} (${agent.department}): ${agent.status.toUpperCase()} • Tasks completed: ${agent.tasksCompleted}`;
    } else if (cmdClean.includes("audit") || cmdClean.includes("test")) {
      output = `[TEST] 14 assertions passed. 0 warnings. Code quality index: 99.8%.`;
    } else if (cmdClean.includes("memory") || cmdClean.includes("recall")) {
      output = `[MEMORY] Vector index grounded. 4 recent concepts cached in IndexedDB.`;
    } else if (cmdClean.includes("prank")) {
      output = `[PRANK] Jello mold preparation initiated on target workstation.`;
    }

    const newLogs = [
      `[${agent.name.split(" ")[0].toLowerCase()}@munder-difflin ~]$ ${cmdClean}`,
      output
    ];

    setAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, terminalLogs: [...a.terminalLogs, ...newLogs] } : a))
    );
  }, [agents]);

  // Mark all memos read
  const handleMarkAllMemosRead = useCallback(() => {
    setMemos((prev) => prev.map((m) => ({ ...m, read: true })));
    setAgents((prev) => prev.map((a) => ({ ...a, unreadMailCount: 0 })));
  }, []);

  return {
    agents,
    tickets,
    memos,
    activeTab,
    setActiveTab,
    selectedAgentId,
    setSelectedAgentId,
    selectedAgent,
    bossAgent,
    isDelegating,
    isConferenceActive,
    standupTranscript,
    flyingEnvelopes,
    dundieModalOpen,
    setDundieModalOpen,
    latestDundie,
    lastBossSpeech,
    stats,
    totalUnreadMemos,
    handleBossDelegateMission,
    handleExecuteTicket,
    handleBossSignOff,
    handleExportOfficeReport,
    handleMarkAllMemosRead,
    handleCallStandup,
    handleSendToCoffeeBreak,
    handleAwardDundie,
    handleRunAgentCli
  };
}
