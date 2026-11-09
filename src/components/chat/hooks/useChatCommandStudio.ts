import React, { useState, useMemo, useCallback } from "react";
import { ChatActionMode, SlashCommandItem } from "../types";
import { SLASH_COMMANDS } from "../services/chatInstructionDispatcher";

interface UseChatCommandStudioOptions {
  input: string;
  onInputChange: (val: string) => void;
  activeMode: ChatActionMode;
  onModeChange: (mode: ChatActionMode) => void;
}

export function useChatCommandStudio({
  input,
  onInputChange,
  activeMode,
  onModeChange,
}: UseChatCommandStudioOptions) {
  const [selectedSlashIndex, setSelectedSlashIndex] = useState<number>(0);

  // Determine if slash command palette should be visible
  const slashQuery = useMemo(() => {
    const trimmed = input.trimStart();
    if (!trimmed.startsWith("/")) return null;
    // Only show palette while typing the first command token (no space yet)
    const spaceIdx = trimmed.indexOf(" ");
    if (spaceIdx !== -1) return null;
    return trimmed.toLowerCase();
  }, [input]);

  const filteredSlashCommands = useMemo<SlashCommandItem[]>(() => {
    if (slashQuery === null) return [];
    return SLASH_COMMANDS.filter(
      (item) =>
        item.command.toLowerCase().startsWith(slashQuery) ||
        item.label.toLowerCase().includes(slashQuery.slice(1))
    );
  }, [slashQuery]);

  const isSlashMenuOpen = filteredSlashCommands.length > 0;

  const handleSelectSlashCommand = useCallback(
    (cmdItem: SlashCommandItem) => {
      if (cmdItem.mode) {
        onModeChange(cmdItem.mode);
      }
      if (cmdItem.command === "/clear" || cmdItem.command === "/screen") {
        onInputChange(`${cmdItem.command} `);
      } else {
        onInputChange(`${cmdItem.command} `);
      }
      setSelectedSlashIndex(0);
    },
    [onInputChange, onModeChange]
  );

  // Intercept keyboard navigation when slash command menu is open
  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>): boolean => {
      if (!isSlashMenuOpen) return false;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedSlashIndex((prev) => (prev + 1) % filteredSlashCommands.length);
        return true;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedSlashIndex(
          (prev) => (prev - 1 + filteredSlashCommands.length) % filteredSlashCommands.length
        );
        return true;
      }
      if (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey)) {
        const picked = filteredSlashCommands[selectedSlashIndex] || filteredSlashCommands[0];
        if (picked && input.trim() !== picked.command) {
          e.preventDefault();
          handleSelectSlashCommand(picked);
          return true;
        }
      }
      if (e.key === "Escape") {
        e.preventDefault();
        onInputChange("");
        return true;
      }
      return false;
    },
    [isSlashMenuOpen, filteredSlashCommands, selectedSlashIndex, input, handleSelectSlashCommand, onInputChange]
  );

  return {
    activeMode,
    setActiveMode: onModeChange,
    isSlashMenuOpen,
    filteredSlashCommands,
    selectedSlashIndex,
    setSelectedSlashIndex,
    handleSelectSlashCommand,
    handleInputKeyDown,
  };
}
