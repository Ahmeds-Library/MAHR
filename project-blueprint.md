# MAHR — God-Mode Project Blueprint
> **Auto-generated on every push — DO NOT EDIT MANUALLY**
> This file is the single source of truth for AI agents and developers.

| Field | Value |
|---|---|
| **Generated At** | `2026-09-26T18:21:10.461Z` |
| **Git Branch** | `unknown` |
| **Commit Hash** | `unknown` |
| **Last Commit** | N/A |
| **Author** | N/A |
| **Root** | `/MAHR` |

---
## 1. Architecture & Infrastructure

### System Overview
MAHR is an **Electron + Vite/React desktop application** with a dual backend:
- **TypeScript Server** (`server.ts` and companions) — Express-based, handles AI sessions, WebSocket, DB, vault, office state.
- **Go Backend** (`server-golang/`) — High-performance memory/vector store, knowledge graph, and live relay via gorilla/websocket.
- **Frontend** (`src/`) — React 19 + Zustand + Tailwind v4, built with Vite.
- **Electron Shell** (`electron/`) — Desktop wrapper, packaged with electron-builder.

### Directory Tree
```
MAHR/
├── .env.example
├── AGENTS.md
├── app.py
├── assets/
│   ├── .aistudio/
│   │   ├── .gitignore
│   │   ├── ANIMA GIRL TAKING.mp4
│   │   ├── ANIMA GIRL THINKING.mp4
│   │   └── JUST WAITNG.mp4
│   ├── idle.mp4
│   ├── talking.mp4
│   └── thinking.mp4
├── certs/
│   ├── codesign.crt
│   ├── codesign.key
│   └── codesign.pfx
├── daily_tasks.json
├── deleted_memories.json
├── electron/
│   ├── main.cjs
│   └── preload.cjs
├── electron-builder.json
├── engine.py
├── firebase-applet-config.json
├── index.html
├── knowledge_graph.json
├── launch-mahr-linux.sh
├── launch-mahr-windows.bat
├── local-agent.js
├── memories.json
├── metadata.json
├── office_state.json
├── package.json
├── project-blueprint.md
├── public/
│   ├── assets/
│   │   ├── idle.mp4
│   │   ├── talking.mp4
│   │   └── thinking.mp4
│   ├── brand/
│   │   ├── logo-light.png
│   │   └── logo.png
│   ├── downloads/
│   │   ├── MAHR-GPG-KEY.asc
│   │   ├── MAHR-Setup-v2.4.0.exe
│   │   ├── MAHR-Setup-v2.4.0.exe.sig
│   │   ├── SHA256SUMS.txt
│   │   ├── SHA256SUMS.txt.asc
│   │   ├── mahr-desktop_2.4.0_amd64.deb
│   │   └── mahr-desktop_2.4.0_amd64.deb.sig
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── icon-maskable-512.png
│   ├── icon.jpeg
│   ├── launch-mahr-linux.sh
│   ├── launch-mahr-windows.bat
│   ├── logo.png
│   ├── mahr.ico
│   ├── manifest.webmanifest
│   ├── office/
│   │   ├── maps/
│   │   │   ├── brooklyn99.tmj
│   │   │   └── office.tmj
│   │   └── tilesets/
│   │       ├── LIMEZUASSETS-LICENSE.txt
│   │       ├── a5-office-floors-walls.png
│   │       ├── interiors.png
│   │       └── office-tileset.png
│   └── sw.js
├── scripts/
│   ├── create_installers.cjs
│   ├── desktop-runner.cjs
│   ├── electron-main.cjs
│   ├── fix-alias-imports.mjs
│   ├── generate-blueprint.mjs
│   ├── generate-png-icons.cjs
│   ├── mahr.bat
│   ├── mahr.vbs
│   ├── vault_generator.cjs
│   └── win-server.ps1
├── server-golang/
│   ├── README.md
│   ├── api/
│   │   ├── handlers.go
│   │   ├── router.go
│   │   └── websocket.go
│   ├── go.mod
│   ├── main.go
│   ├── repository/
│   │   ├── models.go
│   │   └── store.go
│   └── services/
│       ├── gemini_client.go
│       ├── memory_service.go
│       └── vector_engine.go
├── server.ts
├── server_chat_history.json
├── server_db.ts
├── server_memory.ts
├── server_office.ts
├── server_tokens.ts
├── server_vault.ts
├── src/
│   ├── App.tsx
│   ├── ambient.d.ts
│   ├── components/
│   │   ├── AskMahrModal.tsx
│   │   ├── AskMyraaModal.tsx
│   │   ├── BrushProfilesModal.tsx
│   │   ├── Chalkboard.tsx
│   │   ├── ChatJournal.tsx
│   │   ├── DailyTaskManager.tsx
│   │   ├── DigitalLogicDesignLab.tsx
│   │   ├── FloatingScreenShareHub.tsx
│   │   ├── FooterVisualizer.tsx
│   │   ├── GlobalAlerts.tsx
│   │   ├── GranularMeshGradientBackground.tsx
│   │   ├── HeaderNav.tsx
│   │   ├── HolographicCanvas.tsx
│   │   ├── HolographicProjector.tsx
│   │   ├── HumanMoodStudio.tsx
│   │   ├── KeyboardShortcutsModal.tsx
│   │   ├── KnowledgeGraphDashboard.tsx
│   │   ├── MagnifierOverlay.tsx
│   │   ├── MahrCollaborationSuite.tsx
│   │   ├── MahrCoreVisualizer.tsx
│   │   ├── MemoryDashboard.tsx
│   │   ├── ModelSwitcherModal.tsx
│   │   ├── MyraaCollaborationSuite.tsx
│   │   ├── MyraaCoreVisualizer.tsx
│   │   ├── ProactiveTaskReminderToast.tsx
│   │   ├── ReinforcementLearningStudio.tsx
│   │   ├── ScreenShareMagnifierModal.tsx
│   │   ├── SimulationCanvas.tsx
│   │   ├── SkillsManager.tsx
│   │   ├── SlateDeduplicatorModal.tsx
│   │   ├── StudyPadPanel.tsx
│   │   ├── SubAgentsStudio.tsx
│   │   ├── VoiceDialogueToast.tsx
│   │   ├── brand/
│   │   │   └── MahrEmblemLogo.tsx
│   │   ├── chat/
│   │   │   ├── AskMahrModal.tsx
│   │   │   ├── ChatHeader.tsx
│   │   │   ├── ChatInputBar.tsx
│   │   │   ├── ChatMessageItem.tsx
│   │   │   ├── ChatMessageList.tsx
│   │   │   ├── QuickPromptChips.tsx
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   ├── desktop/
│   │   │   ├── DesktopAndRemoteModal.tsx
│   │   │   └── DesktopTitleBar.tsx
│   │   ├── flowchart/
│   │   │   ├── ConditionChipRow.tsx
│   │   │   ├── FlowNodeCard.tsx
│   │   │   ├── FlowchartCanvas.tsx
│   │   │   ├── FlowchartMenu.tsx
│   │   │   └── FlowchartToolbar.tsx
│   │   ├── mindmap/
│   │   │   ├── InteractiveMindMapCanvas.tsx
│   │   │   ├── MindMapDetailModal.tsx
│   │   │   ├── MindMapNodeCard.tsx
│   │   │   └── MindMapToolbar.tsx
│   │   ├── settings/
│   │   │   ├── AudioVoiceTab.tsx
│   │   │   ├── CommandMapTab.tsx
│   │   │   ├── DatabaseSettingsTab.tsx
│   │   │   ├── DesktopAppsTab.tsx
│   │   │   ├── PersonaAiTab.tsx
│   │   │   ├── SettingsModal.tsx
│   │   │   └── StorageThemeTab.tsx
│   │   ├── simulation/
│   │   │   ├── FluidLiquidCanvas2D.tsx
│   │   │   ├── MahrLiveSynthesisExplainer.tsx
│   │   │   ├── SimulationControls.tsx
│   │   │   ├── SimulationLiveGraph.tsx
│   │   │   ├── SimulationParameterSlider.tsx
│   │   │   ├── SimulationPresetSelector.tsx
│   │   │   ├── SimulationStudio.tsx
│   │   │   ├── SimulationStudyGuide.tsx
│   │   │   ├── SimulationTelemetry.tsx
│   │   │   └── UniversalSimulationStudio.tsx
│   │   ├── slides/
│   │   │   ├── GoogleSlidesExportDialog.tsx
│   │   │   ├── SlideCanvasPreview.tsx
│   │   │   ├── SlidePresentMode.tsx
│   │   │   ├── SlideStudioWhiteboard.tsx
│   │   │   └── studio/
│   │   │       ├── StudioCanvas.tsx
│   │   │       ├── StudioHeader.tsx
│   │   │       ├── StudioMahrChatBar.tsx
│   │   │       ├── StudioSlideList.tsx
│   │   │       └── inspector/
│   │   │           ├── StudioInspector.tsx
│   │   │           ├── TabContent.tsx
│   │   │           ├── TabLayout.tsx
│   │   │           ├── TabNotes.tsx
│   │   │           └── TabVisuals.tsx
│   │   └── whiteboard/
│   │       ├── MahrVoiceCompanion.tsx
│   │       ├── WhiteboardAIImageModal.tsx
│   │       ├── WhiteboardFloatingDock.tsx
│   │       ├── WhiteboardHeader.tsx
│   │       ├── WhiteboardStylusHUD.tsx
│   │       ├── WhiteboardUtilityDrawer.tsx
│   │       ├── WhiteboardZoomBar.tsx
│   │       └── types.ts
│   ├── hooks/
│   │   ├── slides/
│   │   │   ├── useGoogleSlidesAuth.ts
│   │   │   ├── useMahrSlideAssistant.ts
│   │   │   └── useSlideStudio.ts
│   │   ├── useAskMahr.ts
│   │   ├── useAskMyraa.ts
│   │   ├── useAudioSessionManager.ts
│   │   ├── useChatHistory.ts
│   │   ├── useDailyTasksAndMemories.ts
│   │   ├── useDesktopApp.ts
│   │   ├── useInteractiveMindMap.ts
│   │   ├── useMahrAudioVisualizer.ts
│   │   ├── useMyraaAudioVisualizer.ts
│   │   ├── useProactiveTaskReminders.ts
│   │   ├── useSimulationStream.ts
│   │   ├── useStudyPad.ts
│   │   ├── useWakeWordEngine.ts
│   │   └── whiteboard/
│   │       └── useMahrVoiceIntent.ts
│   ├── index.css
│   ├── lib/
│   │   ├── UniversalSimulationParser.ts
│   │   ├── audio.ts
│   │   ├── brushProfiles.ts
│   │   ├── chalkAudio.ts
│   │   ├── chalkboardPresets.ts
│   │   ├── db.ts
│   │   ├── diagramLayout.ts
│   │   ├── flowchartPresets.ts
│   │   ├── fluid/
│   │   │   └── fluidSolver2D.ts
│   │   ├── mathFormatter.ts
│   │   ├── memoryTypes.ts
│   │   ├── mindMapGenerator.ts
│   │   ├── simulationEngine.ts
│   │   ├── simulationPresets.ts
│   │   ├── simulationShaderMaterial.ts
│   │   ├── simulationTypes.ts
│   │   ├── simulations/
│   │   │   ├── astronomySimulations.ts
│   │   │   ├── biologyChaosSimulations.ts
│   │   │   ├── electromagnetismSimulations.ts
│   │   │   ├── fluidLiquidSimulations.ts
│   │   │   ├── mechanicsSimulations.ts
│   │   │   ├── opticsSimulations.ts
│   │   │   └── quantumSimulations.ts
│   │   ├── subagentTypes.ts
│   │   └── tokenUtils.ts
│   ├── main.tsx
│   ├── office/
│   │   ├── MAHROfficeFloorView.tsx
│   │   ├── MAHROfficeModal.tsx
│   │   ├── assets/
│   │   │   ├── maps/
│   │   │   │   ├── brooklyn99.tmj
│   │   │   │   └── office.tmj
│   │   │   └── tilesets/
│   │   │       ├── LIMEZUASSETS-LICENSE.txt
│   │   │       ├── a5-office-floors-walls.png
│   │   │       ├── interiors.png
│   │   │       └── office-tileset.png
│   │   ├── bridge/
│   │   │   └── officeBridge.ts
│   │   ├── components/
│   │   │   ├── AddAgentModal.tsx
│   │   │   ├── AgentCard.tsx
│   │   │   ├── AgentControlStrip.tsx
│   │   │   ├── AgentDetailPanel.tsx
│   │   │   ├── AgentHoldButton.tsx
│   │   │   ├── AgentNameEditor.tsx
│   │   │   ├── AgentStrip.tsx
│   │   │   ├── AiEnginesSettings.tsx
│   │   │   ├── AskMeTab.tsx
│   │   │   ├── BlockedBanner.tsx
│   │   │   ├── CodeEditor.tsx
│   │   │   ├── CommandBar.tsx
│   │   │   ├── CommandCenterPanel.tsx
│   │   │   ├── EditAgentModal.tsx
│   │   │   ├── FileTree.tsx
│   │   │   ├── FilesTab.tsx
│   │   │   ├── FullscreenTerminal.tsx
│   │   │   ├── GitTab.tsx
│   │   │   ├── HivePicker.tsx
│   │   │   ├── Icon.tsx
│   │   │   ├── IntegrationsRegistry.tsx
│   │   │   ├── McpDefaultsSettings.tsx
│   │   │   ├── MemoryGraphPanel.tsx
│   │   │   ├── MemoryPanel.tsx
│   │   │   ├── MessageQueueComposer.tsx
│   │   │   ├── MichaelBooting.tsx
│   │   │   ├── OfficeThemePicker.tsx
│   │   │   ├── OnboardingWizard.tsx
│   │   │   ├── PixelBadge.tsx
│   │   │   ├── PixelButton.tsx
│   │   │   ├── PixelPanel.tsx
│   │   │   ├── ProviderLogo.tsx
│   │   │   ├── PtyTerminalView.tsx
│   │   │   ├── QuitWarningModal.tsx
│   │   │   ├── RealtimeMichaelToggle.tsx
│   │   │   ├── RecentText.tsx
│   │   │   ├── ReleaseDrop.tsx
│   │   │   ├── SettingsHeroCard.tsx
│   │   │   ├── SettingsModal.tsx
│   │   │   ├── SetupPanel.tsx
│   │   │   ├── SidebarSplitter.tsx
│   │   │   ├── SidebarTabs.tsx
│   │   │   ├── SkillsTab.tsx
│   │   │   ├── SpritePortrait.tsx
│   │   │   ├── TaskDetailOverlay.tsx
│   │   │   ├── TasksKanban.tsx
│   │   │   ├── TerminalView.tsx
│   │   │   ├── ThreadsPanel.tsx
│   │   │   ├── ToolWaterfall.tsx
│   │   │   ├── UpdateBadge.tsx
│   │   │   ├── UpdateToast.tsx
│   │   │   ├── UpdatesSection.tsx
│   │   │   ├── WorkersTab.tsx
│   │   │   ├── ansiText.ts
│   │   │   ├── askMeOrder.ts
│   │   │   ├── git/
│   │   │   │   ├── CommitGraph.tsx
│   │   │   │   └── graph.ts
│   │   │   ├── memoryGraph/
│   │   │   │   ├── buildGraph.ts
│   │   │   │   ├── extractTopics.ts
│   │   │   │   └── forceLayout.ts
│   │   │   ├── termColor.ts
│   │   │   ├── terminalAutomation.ts
│   │   │   ├── terminalFontSize.ts
│   │   │   ├── terminalPool.ts
│   │   │   ├── terminalRecovery.ts
│   │   │   ├── terminalSelection.ts
│   │   │   └── triggers/
│   │   │       ├── ContextSection.tsx
│   │   │       ├── JsonEditor.tsx
│   │   │       ├── OrgSection.tsx
│   │   │       ├── SchedulesSection.tsx
│   │   │       ├── TriggerHistoryTab.tsx
│   │   │       ├── TriggersTab.tsx
│   │   │       ├── WebhooksSection.tsx
│   │   │       ├── api.ts
│   │   │       └── ui.tsx
│   │   ├── design/
│   │   │   ├── fonts.css
│   │   │   ├── global.css
│   │   │   ├── theme.ts
│   │   │   ├── tokens.css
│   │   │   └── tokens.ts
│   │   ├── env.d.ts
│   │   ├── freeflow/
│   │   │   ├── holdOption.ts
│   │   │   └── recorder.ts
│   │   ├── generated/
│   │   │   └── pam_solution.ts
│   │   ├── hooks/
│   │   │   ├── queueDelivery.ts
│   │   │   ├── useHive.ts
│   │   │   ├── usePtyParser.ts
│   │   │   ├── useResolvedGodName.ts
│   │   │   ├── useRestoreTeam.ts
│   │   │   ├── useTelemetry.ts
│   │   │   ├── useTypewriter.ts
│   │   │   └── useWorkspaceImage.ts
│   │   ├── i18n/
│   │   │   ├── index.ts
│   │   │   ├── locales/
│   │   │   │   ├── ar.json
│   │   │   │   ├── en.json
│   │   │   │   └── zh-CN.json
│   │   │   ├── useDirection.ts
│   │   │   └── useGodNameSync.ts
│   │   ├── ide/
│   │   │   ├── GitPanes.tsx
│   │   │   ├── IdePanel.tsx
│   │   │   ├── ImagePreview.tsx
│   │   │   ├── MonacoDiff.tsx
│   │   │   ├── MonacoEditor.tsx
│   │   │   ├── chrome.ts
│   │   │   └── monaco.ts
│   │   ├── integrations/
│   │   │   └── registryClient.ts
│   │   ├── markdown/
│   │   │   ├── MarkdownPreview.tsx
│   │   │   ├── mdLinks.ts
│   │   │   ├── rehypeAutoDir.ts
│   │   │   └── remarkSoftBreaks.ts
│   │   ├── realtime/
│   │   │   ├── CompletionToast.tsx
│   │   │   ├── CostHud.tsx
│   │   │   ├── DevicePicker.tsx
│   │   │   ├── VOICE-MESSAGE-ACCESS.md
│   │   │   ├── actions.ts
│   │   │   ├── costStore.ts
│   │   │   ├── session.ts
│   │   │   └── tools.ts
│   │   ├── scene/
│   │   │   └── office/
│   │   │       ├── Camera.ts
│   │   │       ├── Character.ts
│   │   │       ├── CharacterSprite.ts
│   │   │       ├── DeskScreen.ts
│   │   │       ├── MessageEnvelope.ts
│   │   │       ├── OfficeFloor.tsx
│   │   │       ├── SeatPool.ts
│   │   │       ├── SpriteAdapter.ts
│   │   │       ├── ThoughtBubble.ts
│   │   │       ├── TiledMapRenderer.ts
│   │   │       ├── ToolBubble.ts
│   │   │       ├── cafeteriaLines.ts
│   │   │       ├── cast.ts
│   │   │       ├── glRecovery.ts
│   │   │       ├── pathfinding.ts
│   │   │       ├── portraitArt.ts
│   │   │       ├── themeLoader.ts
│   │   │       └── themeRegistry.ts
│   │   ├── shared/
│   │   │   ├── agentProvider.ts
│   │   │   ├── agentRole.ts
│   │   │   ├── broadcast.ts
│   │   │   ├── claudeCommands.ts
│   │   │   ├── codexCommands.ts
│   │   │   ├── codexRemote.ts
│   │   │   ├── commandLine.ts
│   │   │   ├── dropFonts.ts
│   │   │   ├── engineAvailability.ts
│   │   │   ├── godIdentity.ts
│   │   │   ├── grokCommands.ts
│   │   │   ├── heroPayload.ts
│   │   │   ├── hire.ts
│   │   │   ├── hireQueue.ts
│   │   │   ├── hiveNudge.ts
│   │   │   ├── hookEvents.ts
│   │   │   ├── imageTypes.ts
│   │   │   ├── imeGuard.ts
│   │   │   ├── integrations.ts
│   │   │   ├── mcpCatalog.ts
│   │   │   ├── modelCatalog.json
│   │   │   ├── modelCatalogPayload.ts
│   │   │   ├── ossModels.ts
│   │   │   ├── providerAutomation.ts
│   │   │   ├── realtimePricing.ts
│   │   │   ├── releaseDrop.ts
│   │   │   ├── releaseNotes.ts
│   │   │   ├── taskLedger.ts
│   │   │   ├── terminalPaths.ts
│   │   │   ├── tokenCaps.ts
│   │   │   ├── toolCatalog.ts
│   │   │   ├── triggers.ts
│   │   │   ├── updateState.ts
│   │   │   └── weeklySchedule.ts
│   │   ├── store/
│   │   │   ├── config.ts
│   │   │   ├── focusMode.ts
│   │   │   ├── realAgentEvents.ts
│   │   │   ├── rosterSource.ts
│   │   │   └── store.ts
│   │   └── terminal/
│   │       ├── arabicJoiner.ts
│   │       ├── arabicSetting.ts
│   │       ├── arabicSpacingFix.ts
│   │       └── useArabicTerminalSync.ts
│   ├── services/
│   │   ├── auth/
│   │   │   └── googleAuthService.ts
│   │   ├── chatService.ts
│   │   ├── colorPsychologyEngine.ts
│   │   ├── flowchartEngine.ts
│   │   ├── humanEmotionEngine.ts
│   │   ├── memoryClassifierService.ts
│   │   ├── memoryService.ts
│   │   ├── mindMapLayoutEngine.ts
│   │   ├── mindMapVectorService.ts
│   │   ├── platformAdapter.ts
│   │   ├── proactiveReminderEngine.ts
│   │   ├── pwaService.ts
│   │   ├── qrCodeGenerator.ts
│   │   ├── reinforcementLearningEngine.ts
│   │   ├── settingsService.ts
│   │   ├── simulationService.ts
│   │   ├── slateDeduplicationService.ts
│   │   ├── slides/
│   │   │   ├── googleSlidesApi.ts
│   │   │   ├── slideAIEngine.ts
│   │   │   ├── slideThemes.ts
│   │   │   ├── slideTypes.ts
│   │   │   └── slideVectorIntelligence.ts
│   │   ├── speechSynthesisService.ts
│   │   ├── speechToneEngine.ts
│   │   ├── themeService.ts
│   │   ├── vectorMemoryEngine.ts
│   │   ├── voiceCommandService.ts
│   │   └── whiteboard/
│   │       └── whiteboardVoiceIntentEngine.ts
│   ├── types/
│   │   ├── flowchartTypes.ts
│   │   └── mindMapTypes.ts
│   └── vite-env.d.ts
├── tsconfig.json
├── tsconfig.minimal.json
└── vite.config.ts
```

### Path Aliases (vite.config.ts)
| Alias | Resolves To |
|---|---|
| `@office\` | `src/office/$1` |
| `@shared\` | `src/office/shared/$1` |
| `@brand\` | `public/brand/$1` |
| `@components\` | `src/components/$1` |
| `@hooks\` | `src/hooks/$1` |
| `@lib\` | `src/lib/$1` |
| `@\` | `src/$1` |


### Electron Build Config
| Field | Value |
|---|---|
| **App ID** | `com.mahr.ai` |
| **Product Name** | `MAHR` |
| **Linux Targets** | `AppImage, deb` |
| **Windows NSIS** | `No` |

### Launch Scripts
| Script | Platform | Purpose |
|---|---|---|
| `launch-mahr-linux.sh` | Linux | Start app in dev/prod |
| `launch-mahr-windows.bat` | Windows | Start app on Windows |
| `scripts/mahr.bat` | Windows | Alt launcher |
| `scripts/win-server.ps1` | Windows | PowerShell server runner |
| `scripts/desktop-runner.cjs` | Cross | Desktop orchestration |

---
## 2. Codebase Health & Metrics

### Totals
| Metric | Value |
|---|---|
| **Total Code Files** | 390 |
| **Total Lines of Code** | 121,077 |
| **Total Code Size** | 4.99 MB |
| **public/ Asset Size** | 23.59 MB |
| **assets/ Size** | 4.48 MB |

### By Extension
| Extension | Files | LOC | Size |
|---|---|---|---|
| `.tsx` | 164 | 62,570 | 2.60 MB |
| `.ts` | 184 | 46,881 | 1.89 MB |
| `.json` | 16 | 4,856 | 259.99 KB |
| `.cjs` | 7 | 2,126 | 76.84 KB |
| `.md` | 4 | 1,513 | 64.04 KB |
| `.go` | 9 | 1,355 | 36.07 KB |
| `.mjs` | 2 | 951 | 36.04 KB |
| `.js` | 2 | 443 | 15.66 KB |
| `.py` | 2 | 382 | 12.56 KB |

### By Directory
| Directory | Files | LOC | Size |
|---|---|---|---|
| `src/` | 346 | 104,652 | 4.37 MB |
| `server.ts/` | 1 | 5,383 | 236.41 KB |
| `scripts/` | 7 | 2,430 | 92.55 KB |
| `server-golang/` | 10 | 1,440 | 39.59 KB |
| `server_memory.ts/` | 1 | 1,439 | 51.17 KB |
| `project-blueprint.md/` | 1 | 1,317 | 53.69 KB |
| `server_db.ts/` | 1 | 1,073 | 44.75 KB |
| `server_office.ts/` | 1 | 876 | 28.04 KB |
| `electron/` | 2 | 647 | 20.33 KB |
| `engine.py/` | 1 | 371 | 12.28 KB |
| `local-agent.js/` | 1 | 334 | 12.70 KB |
| `server_tokens.ts/` | 1 | 263 | 8.04 KB |
| `office_state.json/` | 1 | 160 | 5.96 KB |
| `server_vault.ts/` | 1 | 125 | 4.17 KB |
| `public/` | 1 | 109 | 2.96 KB |
| `daily_tasks.json/` | 1 | 74 | 2.50 KB |
| `package.json/` | 1 | 68 | 2.29 KB |
| `tsconfig.json/` | 1 | 60 | 1.08 KB |
| `vite.config.ts/` | 1 | 59 | 2.05 KB |
| `tsconfig.minimal.json/` | 1 | 58 | 1.04 KB |
| `AGENTS.md/` | 1 | 36 | 2.72 KB |
| `electron-builder.json/` | 1 | 28 | 418.00 B |
| `deleted_memories.json/` | 1 | 18 | 270.00 B |
| `knowledge_graph.json/` | 1 | 15 | 473.00 B |
| `app.py/` | 1 | 11 | 287.00 B |
| `firebase-applet-config.json/` | 1 | 11 | 466.00 B |
| `metadata.json/` | 1 | 11 | 413.00 B |
| `server_chat_history.json/` | 1 | 8 | 253.00 B |
| `memories.json/` | 1 | 1 | 2.00 B |


---
## 3. Dependencies & Tech Stack

### Runtime Dependencies (package.json)
| Package | Version | Category |
|---|---|---|
| `@google/genai` | `^2.4.0` | AI / Gemini |
| `@tailwindcss/vite` | `^4.1.14` | Styling |
| `@types/three` | `^0.185.4` | Dependency |
| `@vitejs/plugin-react` | `^5.0.4` | Build Plugin |
| `bytenode` | `^1.6.0` | Build |
| `cannon-es` | `^0.20.0` | Physics |
| `canvas-confetti` | `^1.9.4` | UI Effects |
| `dotenv` | `^17.2.3` | Config |
| `express` | `^4.21.2` | HTTP Server |
| `firebase` | `^12.19.0` | 3rd-Party / Firebase |
| `gsap` | `^3.15.0` | Animation |
| `i18next` | `^26.4.2` | i18n |
| `jszip` | `^3.10.1` | Utilities |
| `lucide-react` | `^0.546.0` | Icons |
| `mongodb` | `^7.6.0` | Database |
| `motion` | `^12.23.24` | Animation |
| `perfect-freehand` | `^1.2.3` | Drawing |
| `pg` | `^8.23.0` | Database (PostgreSQL) |
| `pixi.js` | `^8.5.1` | 2D / Rendering |
| `react` | `^19.0.1` | UI Framework |
| `react-dom` | `^19.0.1` | UI Framework |
| `react-i18next` | `^17.0.14` | i18n |
| `three` | `^0.185.1` | 3D / Rendering |
| `vite` | `^6.2.3` | Bundler |
| `ws` | `^8.21.0` | WebSocket |
| `zustand` | `^4.5.5` | State Management |


<details>
<summary>Dev Dependencies</summary>

| Package | Version | Category |
|---|---|---|
| `@electron/asar` | `^4.3.0` | Dev Tooling |
| `@types/canvas-confetti` | `^1.9.0` | Dev Tooling |
| `@types/express` | `^4.17.21` | Dev Tooling |
| `@types/node` | `^22.14.0` | Dev Tooling |
| `@types/pg` | `^8.23.1` | Dev Tooling |
| `@types/react` | `^19.3.0` | Dev Tooling |
| `@types/react-dom` | `^19.3.0` | Dev Tooling |
| `@types/ws` | `^8.18.1` | Dev Tooling |
| `autoprefixer` | `^10.4.21` | Dev Tooling |
| `electron` | `^44.4.3` | Desktop Shell |
| `electron-builder` | `^26.15.3` | Packaging |
| `esbuild` | `^0.25.0` | Bundler |
| `tailwindcss` | `^4.1.14` | Styling |
| `tsx` | `^4.21.0` | TS Execution |
| `typescript` | `~5.8.2` | Language |
| `vite` | `^6.2.3` | Bundler |

</details>

### Go Backend (server-golang/go.mod)
| Field | Value |
|---|---|
| **Module** | `myraa-backend` |
| **Go Version** | `1.22` |

| Package | Version |
|---|---|
| `github.com/gorilla/websocket` | `v1.5.3` |

---
## 4. Git Hotspots & Code Debt

### Git Hotspots — Last 30 Days (Top 15 Most-Changed Files)
| File | Changes |
|---|---|
| (No git history yet or fresh clone) | — |


### TODO / FIXME Tracker
| Type | File | Line | Description |
|---|---|---|---|
| `TODO` | `scripts/generate-blueprint.mjs` | L415 | / FIXME Tracker |
| `TODO` | `src/office/MAHROfficeFloorView.tsx` | L1041 | (${tasks.filter(t => t.col === 'todo').length})\n` + |
| `TODO` | `src/office/shared/agentProvider.ts` | L235 | // Codex's long-context coding model for the orchestrator role. // TODO-verify |
| `TODO` | `src/office/shared/agentProvider.ts` | L332 | // gemini-cli heritage: --yolo auto-approves all actions. // TODO-verify |
| `TODO` | `src/office/shared/agentProvider.ts` | L342 | // gemini-cli style interactive-orient flag. // TODO-verify |
| `TODO` | `src/office/shared/agentProvider.ts` | L344 | // Qwen's long-context coder model for the orchestrator. // TODO-verify |
| `TODO` | `src/office/shared/mcpCatalog.ts` | L21 | * verified against an installed server are flagged `// TODO-verify`. Workstream 3 |
| `TODO` | `src/office/shared/mcpCatalog.ts` | L66 | // Reference time server ships as Python. // TODO-verify transport (uvx vs an npm port) |
| `TODO` | `src/office/shared/mcpCatalog.ts` | L75 | // Reference fetch server ships as Python. // TODO-verify transport (uvx vs an npm port) |
| `TODO` | `src/office/shared/mcpCatalog.ts` | L103 | // TODO-verify transport (uvx vs an npm port). |
| `TODO` | `src/office/shared/mcpCatalog.ts` | L126 | // TODO-verify exact server package for the user's DB engine (Postgres assumed). |
| `TODO` | `src/office/shared/mcpCatalog.ts` | L139 | // TODO-verify provider package (Gmail/Google Calendar assumed). |
| `TODO` | `src/office/shared/mcpCatalog.ts` | L148 | // TODO-verify provider package (Brave Search assumed). |
| `TODO` | `src/office/store/config.ts` | L214 | *    endpoint. Starting suggestions only. // TODO-verify the live list. |
| `TODO` | `src/office/store/config.ts` | L219 | *    // TODO-verify exact live slugs (they drift). |
| `TODO` | `src/office/store/config.ts` | L224 | *    would bypass the proxy. // TODO-verify exact live ids. |
| `TODO` | `src/office/store/config.ts` | L226 | *    Curated BYOK suggestions; free-text editable. // TODO-verify exact live slugs. |
| `TODO` | `src/office/store/config.ts` | L228 | *    suggestions, editable command field. // TODO-verify exact live ids (the |


---
## 5. Backend & API Deep Dive

### Go Backend Routes (server-golang/)
Module: `myraa-backend` | Go `1.22` | WebSocket: `gorilla/websocket`
| Method | Path | Handler |
|---|---|---|
| `GET, POST` | `/api/health` | See handlers.go |
| `GET, POST` | `/api/memory` | See handlers.go |
| `POST, DELETE` | `/api/memory/` | See handlers.go |
| `POST` | `/api/memory/semantic-check` | See handlers.go |
| `POST` | `/api/vector-memory/query` | See handlers.go |
| `POST` | `/api/vector-memory/ingest-artifacts` | See handlers.go |
| `GET` | `/api/knowledge-graph/vector-network` | See handlers.go |
| `GET, POST` | `/api/daily-tasks` | See handlers.go |
| `GET, POST` | `/api/chat-history` | See handlers.go |
| `WS` | `/api/live-relay` | See handlers.go |
| `ANY` | `/` | See handlers.go |


### TypeScript Server Routes (server.ts)
<details>
<summary>Express API routes extracted from server.ts</summary>

| Method | Path |
|---|---|
| `GET` | `/api/health` |
| `GET` | `/api/security/vault-status` |
| `GET` | `/api/tokens/usage` |
| `GET` | `/api/download/windows-exe-payload` |
| `GET` | `/api/download/linux-deb-payload` |
| `POST` | `/api/tokens/refresh-active` |
| `GET` | `/api/models` |
| `POST` | `/api/tokens/count` |
| `GET` | `/api/ws-info` |
| `POST` | `/api/ws-log` |
| `GET` | `/api/memories` |
| `POST` | `/api/memories` |
| `DELETE` | `/api/memories/:id` |
| `POST` | `/api/memories/sync` |
| `POST` | `/api/chat/sync` |
| `GET` | `/api/daily-tasks` |
| `POST` | `/api/daily-tasks` |
| `GET` | `/api/office/state` |
| `POST` | `/api/office/state` |
| `POST` | `/api/office/dispatch` |
| `POST` | `/api/office/sync-tasks` |
| `POST` | `/api/office/memory-ingest` |
| `POST` | `/api/office/graph-entity` |
| `GET` | `/api/office/knowledge-summary` |
| `GET` | `/api/office/stream` |
| `POST` | `/api/office/mahr-command` |
| `GET` | `/api/db/status` |
| `GET` | `/api/db/config` |
| `POST` | `/api/db/test` |
| `POST` | `/api/db/switch` |
| `GET` | `/api/office/project-files` |
| `GET` | `/api/office/list-dir` |
| `GET` | `/api/office/read-file` |
| `GET` | `/api/office/raw-file` |
| `POST` | `/api/office/write-file` |
| `POST` | `/api/office/exec` |
| `GET` | `/api/office/git/status` |
| `GET` | `/api/office/git/log` |
| `GET` | `/api/office/git/branches` |
| `GET` | `/api/office/git/ahead-behind` |
| `POST` | `/api/office/auto-delegate` |
| `POST` | `/api/daily-tasks/auto-generate` |
| `POST` | `/api/sentiment/analyze` |
| `GET` | `/api/knowledge-graph` |
| `POST` | `/api/knowledge-graph/build` |
| `DELETE` | `/api/knowledge-graph/entity/:id` |
| `GET` | `/api/knowledge-graph/vector-network` |
| `POST` | `/api/knowledge-graph/vector-search` |
| `POST` | `/api/vector-memory/query` |
| `POST` | `/api/memory/semantic-check` |
| `POST` | `/api/vector-memory/ingest-artifacts` |
| `POST` | `/api/simulations/generate` |
| `POST` | `/api/dld/generate` |
| `GET` | `/api/media/search` |
| `POST` | `/api/images/generate` |
| `POST` | `/api/images/edit` |
| `POST` | `/api/chat/subagent` |
| `POST` | `/api/slides/generate` |
| `POST` | `/api/study/generate` |
| `POST` | `/api/study/suggestions` |
| `GET` | `/api/proxy` |
| `GET` | `/api/youtube-search` |
| `POST` | `/generate-simulation` |
| `USE` | `/assets` |
| `GET` | `*` |

</details>

### Security & CORS (Go Backend)
| Setting | Value |
|---|---|
| **Allow-Origin** | `*` |
| **Allow-Methods** | `GET, POST, PUT, DELETE, OPTIONS` |
| **Auth Strategy** | JWT / Session-based (see server.ts) |
| **Rate Limiting** | See server.ts middleware |

### Server Architecture
| Server File | Purpose |
|---|---|
| `server.ts` | Main Express entry, AI sessions, WebSocket bridge |
| `server_db.ts` | Database layer (SQLite + PG) |
| `server_memory.ts` | Memory persistence and semantic search |
| `server_office.ts` | MAHR Office state and collaboration |
| `server_tokens.ts` | Token telemetry and rate limiting |
| `server_vault.ts` | Encrypted vault (API key storage) |
| `server-golang/` | High-perf Go backend for vector ops and live relay |

### Third-Party Integrations
| Integration | Detected In |
|---|---|
| **Firebase** | `firebase-applet-config.json` |
| **MongoDB** | `server.ts` |
| **Google Gemini AI** | `server.ts` |


---
## 6. Database & State

### Embedded SQLite (mahr_brain.db)
Tables detected in `server_db.ts`:
| Table | Detected In |
|---|---|
| `memories` | `server_db.ts` |
| `knowledge_nodes` | `server_db.ts` |
| `knowledge_edges` | `server_db.ts` |
| `office_agents` | `server_db.ts` |
| `office_tasks` | `server_db.ts` |
| `office_terminal_logs` | `server_db.ts` |
| `chat_history` | `server_db.ts` |
| `daily_tasks` | `server_db.ts` |
| `db_meta` | `server_db.ts` |


### SQL Migrations
> No .sql migration files found. Database schema is defined programmatically in `server_db.ts`.

### JSON State Files (Runtime Persistence)
| File | Purpose | Size |
|---|---|---|
| `memories.json` | Persistent memory entries | 2.00 B |
| `daily_tasks.json` | Daily task list | 2.50 KB |
| `knowledge_graph.json` | Knowledge graph nodes/edges | 473.00 B |
| `office_state.json` | MAHR Office session state | 5.96 KB |
| `token_telemetry.json` | Token usage telemetry | 1.15 KB |
| `server_chat_history.json` | Chat session history | 253.00 B |


### Go Vector Store
The Go backend (`server-golang/repository/`, `server-golang/services/`) maintains an
in-memory vector store for semantic memory retrieval. Embeddings are generated via Gemini
and persisted via `/api/vector-memory/ingest-artifacts`.

---
## 7. Frontend Ecosystem

### Build & Bundle
| Tool | Config |
|---|---|
| **Bundler** | Vite 6 (`vite.config.ts`) |
| **UI Framework** | React 19 |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/vite`) |
| **State** | Zustand v4 |
| **Animation** | GSAP 3 + Motion (Framer) |
| **3D** | Three.js + Pixi.js |
| **Physics** | cannon-es |
| **i18n** | i18next + react-i18next |
| **Icons** | lucide-react |
| **Output** | `dist/` (web), `dist_electron/` (Electron) |

### React Hooks Map
| Hook | File | Exports |
|---|---|---|
| `useGoogleSlidesAuth` | `src/hooks/slides/useGoogleSlidesAuth.ts` | `useGoogleSlidesAuth` |
| `useMahrSlideAssistant` | `src/hooks/slides/useMahrSlideAssistant.ts` | `useMahrSlideAssistant` |
| `useSlideStudio` | `src/hooks/slides/useSlideStudio.ts` | `useSlideStudio` |
| `useAskMahr` | `src/hooks/useAskMahr.ts` | `useAskMahr`, `useAskMyraa` |
| `useAskMyraa` | `src/hooks/useAskMyraa.ts` | — |
| `useAudioSessionManager` | `src/hooks/useAudioSessionManager.ts` | `useAudioSessionManager` |
| `useChatHistory` | `src/hooks/useChatHistory.ts` | `useChatHistory` |
| `useDailyTasksAndMemories` | `src/hooks/useDailyTasksAndMemories.ts` | `useDailyTasksAndMemories` |
| `useDesktopApp` | `src/hooks/useDesktopApp.ts` | `useDesktopApp` |
| `useInteractiveMindMap` | `src/hooks/useInteractiveMindMap.ts` | `useInteractiveMindMap` |
| `useMahrAudioVisualizer` | `src/hooks/useMahrAudioVisualizer.ts` | `useMahrAudioVisualizer`, `useMyraaAudioVisualizer` |
| `useMyraaAudioVisualizer` | `src/hooks/useMyraaAudioVisualizer.ts` | — |
| `useProactiveTaskReminders` | `src/hooks/useProactiveTaskReminders.ts` | `useProactiveTaskReminders` |
| `useSimulationStream` | `src/hooks/useSimulationStream.ts` | `useSimulationStream` |
| `useStudyPad` | `src/hooks/useStudyPad.ts` | `useStudyPad` |
| `useWakeWordEngine` | `src/hooks/useWakeWordEngine.ts` | `useWakeWordEngine` |
| `useMahrVoiceIntent` | `src/hooks/whiteboard/useMahrVoiceIntent.ts` | `useMahrVoiceIntent` |


### Services Map
<details>
<summary>All frontend services (28 files)</summary>

| Service | File | Key Exports |
|---|---|---|
| `googleAuthService` | `src/services/auth/googleAuthService.ts` | `auth`, `initAuth`, `googleSignIn`, `getAccessToken`, `googleSignOut` |
| `chatService` | `src/services/chatService.ts` | `loadChatHistoryFromStorage`, `saveChatHistoryToStorage`, `pruneChatHistory` |
| `colorPsychologyEngine` | `src/services/colorPsychologyEngine.ts` | `PSYCHOLOGY_PROFILES`, `analyzeSpeechColorPsychology` |
| `flowchartEngine` | `src/services/flowchartEngine.ts` | `calculateNodeAnchors`, `generateBezierPath`, `clampNodeX` |
| `humanEmotionEngine` | `src/services/humanEmotionEngine.ts` | `HUMAN_MOOD_CONFIGS`, `detectHumanMoodFromDialogue` |
| `memoryClassifierService` | `src/services/memoryClassifierService.ts` | `classifyMemoryFromText` |
| `memoryService` | `src/services/memoryService.ts` | `loadMemoriesFromStorage`, `saveMemoriesToStorage`, `extractFactCandidates` |
| `mindMapLayoutEngine` | `src/services/mindMapLayoutEngine.ts` | `generateOrganicSplinePath`, `calculateRadialLayout`, `calculateHorizontalTreeLayout`, `calculateDynamicExpansionCoordinates` |
| `mindMapVectorService` | `src/services/mindMapVectorService.ts` | `expandNodeWithVectorMemory`, `MINDMAP_PRESETS` |
| `platformAdapter` | `src/services/platformAdapter.ts` | `registerBeforeInstallPromptListener`, `onInstallPromptChange`, `promptPWAInstall`, `detectPlatform`, `minimizeWindow` |
| `proactiveReminderEngine` | `src/services/proactiveReminderEngine.ts` | `recordUserActivity`, `initActivityTracker`, `getIdleDurationMs`, `generateTaskReminderSpeech`, `checkProactiveReminder` |
| `pwaService` | `src/services/pwaService.ts` | `initializePWA` |
| `qrCodeGenerator` | `src/services/qrCodeGenerator.ts` | `generateQRCodeSVG` |
| `reinforcementLearningEngine` | `src/services/reinforcementLearningEngine.ts` | `DEFAULT_RL_POLICY`, `loadRLPolicy`, `saveRLPolicy`, `loadKnowledgeDeficits`, `saveKnowledgeDeficits` |
| `settingsService` | `src/services/settingsService.ts` | `DEFAULT_SETTINGS`, `loadSettingsFromDB`, `saveSettingToDB`, `clearAllAppDataFromDB`, `runSettingsDiagnosticCycle` |
| `simulationService` | `src/services/simulationService.ts` | `generateSimulationWithGemini`, `generateDldCircuitWithGemini`, `createSimulationWebSocket` |
| `slateDeduplicationService` | `src/services/slateDeduplicationService.ts` | `deduplicateDrawingsState` |
| `googleSlidesApi` | `src/services/slides/googleSlidesApi.ts` | `createGoogleSlidesPresentation`, `exportSlideDeckToGoogleSlides` |
| `slideAIEngine` | `src/services/slides/slideAIEngine.ts` | `generateSlideDeckWithAI`, `createFallbackPresentationDeck` |
| `slideThemes` | `src/services/slides/slideThemes.ts` | `SLIDE_THEMES`, `DEFAULT_THEME_ID` |
| `slideTypes` | `src/services/slides/slideTypes.ts` | — |
| `slideVectorIntelligence` | `src/services/slides/slideVectorIntelligence.ts` | `getVectorGroundingForTopic`, `augmentOptionsWithVectorContext` |
| `speechSynthesisService` | `src/services/speechSynthesisService.ts` | `getMoodSpeechModulation`, `setGlobalSpeechMood`, `getGlobalSpeechMood`, `triggerProactivePause`, `isCurrentlyInProactivePause` |
| `speechToneEngine` | `src/services/speechToneEngine.ts` | `detectEmotionFromText`, `getEmotionToneSettings`, `evaluateVoiceAnswerScore` |
| `themeService` | `src/services/themeService.ts` | `THEME_COLOR_CONFIGS`, `getThemeConfig`, `getVisualizerBarStyle` |
| `vectorMemoryEngine` | `src/services/vectorMemoryEngine.ts` | `SEMANTIC_CLUSTERS`, `computeVectorEmbedding`, `cosineSimilarity`, `buildVectorKnowledgeGraph`, `queryVectorMemory` |
| `voiceCommandService` | `src/services/voiceCommandService.ts` | `VOICE_COMMANDS_LIST`, `matchVoiceCommand`, `isVoiceToMindMapTrigger`, `detectVoiceAction` |
| `whiteboardVoiceIntentEngine` | `src/services/whiteboard/whiteboardVoiceIntentEngine.ts` | `parseWhiteboardVoiceCommand` |

</details>

### Top 20 Components by Size
| Component | File | Size |
|---|---|---|
| `Chalkboard` | `src/components/Chalkboard.tsx` | 214.58 KB |
| `DigitalLogicDesignLab` | `src/components/DigitalLogicDesignLab.tsx` | 138.47 KB |
| `MahrCollaborationSuite` | `src/components/MahrCollaborationSuite.tsx` | 66.06 KB |
| `KnowledgeGraphDashboard` | `src/components/KnowledgeGraphDashboard.tsx` | 46.70 KB |
| `HeaderNav` | `src/components/HeaderNav.tsx` | 40.56 KB |
| `ReinforcementLearningStudio` | `src/components/ReinforcementLearningStudio.tsx` | 38.99 KB |
| `BrushProfilesModal` | `src/components/BrushProfilesModal.tsx` | 27.36 KB |
| `SimulationCanvas` | `src/components/SimulationCanvas.tsx` | 26.94 KB |
| `SkillsManager` | `src/components/SkillsManager.tsx` | 26.09 KB |
| `ModelSwitcherModal` | `src/components/ModelSwitcherModal.tsx` | 23.87 KB |
| `StudyPadPanel` | `src/components/StudyPadPanel.tsx` | 22.76 KB |
| `DatabaseSettingsTab` | `src/components/settings/DatabaseSettingsTab.tsx` | 21.78 KB |
| `MemoryDashboard` | `src/components/MemoryDashboard.tsx` | 19.25 KB |
| `MahrCoreVisualizer` | `src/components/MahrCoreVisualizer.tsx` | 18.80 KB |
| `DesktopAppsTab` | `src/components/settings/DesktopAppsTab.tsx` | 18.79 KB |
| `FluidLiquidCanvas2D` | `src/components/simulation/FluidLiquidCanvas2D.tsx` | 18.35 KB |
| `SubAgentsStudio` | `src/components/SubAgentsStudio.tsx` | 17.90 KB |
| `DailyTaskManager` | `src/components/DailyTaskManager.tsx` | 17.12 KB |
| `SlideCanvasPreview` | `src/components/slides/SlideCanvasPreview.tsx` | 16.50 KB |
| `FlowchartCanvas` | `src/components/flowchart/FlowchartCanvas.tsx` | 16.29 KB |
| ... | +68 more | ... |


### Office Module Files (174 files)
<details>
<summary>src/office/ file list</summary>

- `src/office/MAHROfficeFloorView.tsx`
- `src/office/MAHROfficeModal.tsx`
- `src/office/bridge/officeBridge.ts`
- `src/office/components/AddAgentModal.tsx`
- `src/office/components/AgentCard.tsx`
- `src/office/components/AgentControlStrip.tsx`
- `src/office/components/AgentDetailPanel.tsx`
- `src/office/components/AgentHoldButton.tsx`
- `src/office/components/AgentNameEditor.tsx`
- `src/office/components/AgentStrip.tsx`
- `src/office/components/AiEnginesSettings.tsx`
- `src/office/components/AskMeTab.tsx`
- `src/office/components/BlockedBanner.tsx`
- `src/office/components/CodeEditor.tsx`
- `src/office/components/CommandBar.tsx`
- `src/office/components/CommandCenterPanel.tsx`
- `src/office/components/EditAgentModal.tsx`
- `src/office/components/FileTree.tsx`
- `src/office/components/FilesTab.tsx`
- `src/office/components/FullscreenTerminal.tsx`
- `src/office/components/GitTab.tsx`
- `src/office/components/HivePicker.tsx`
- `src/office/components/Icon.tsx`
- `src/office/components/IntegrationsRegistry.tsx`
- `src/office/components/McpDefaultsSettings.tsx`
- `src/office/components/MemoryGraphPanel.tsx`
- `src/office/components/MemoryPanel.tsx`
- `src/office/components/MessageQueueComposer.tsx`
- `src/office/components/MichaelBooting.tsx`
- `src/office/components/OfficeThemePicker.tsx`
- `src/office/components/OnboardingWizard.tsx`
- `src/office/components/PixelBadge.tsx`
- `src/office/components/PixelButton.tsx`
- `src/office/components/PixelPanel.tsx`
- `src/office/components/ProviderLogo.tsx`
- `src/office/components/PtyTerminalView.tsx`
- `src/office/components/QuitWarningModal.tsx`
- `src/office/components/RealtimeMichaelToggle.tsx`
- `src/office/components/RecentText.tsx`
- `src/office/components/ReleaseDrop.tsx`
- `src/office/components/SettingsHeroCard.tsx`
- `src/office/components/SettingsModal.tsx`
- `src/office/components/SetupPanel.tsx`
- `src/office/components/SidebarSplitter.tsx`
- `src/office/components/SidebarTabs.tsx`
- `src/office/components/SkillsTab.tsx`
- `src/office/components/SpritePortrait.tsx`
- `src/office/components/TaskDetailOverlay.tsx`
- `src/office/components/TasksKanban.tsx`
- `src/office/components/TerminalView.tsx`
- `src/office/components/ThreadsPanel.tsx`
- `src/office/components/ToolWaterfall.tsx`
- `src/office/components/UpdateBadge.tsx`
- `src/office/components/UpdateToast.tsx`
- `src/office/components/UpdatesSection.tsx`
- `src/office/components/WorkersTab.tsx`
- `src/office/components/ansiText.ts`
- `src/office/components/askMeOrder.ts`
- `src/office/components/git/CommitGraph.tsx`
- `src/office/components/git/graph.ts`
- `src/office/components/memoryGraph/buildGraph.ts`
- `src/office/components/memoryGraph/extractTopics.ts`
- `src/office/components/memoryGraph/forceLayout.ts`
- `src/office/components/termColor.ts`
- `src/office/components/terminalAutomation.ts`
- `src/office/components/terminalFontSize.ts`
- `src/office/components/terminalPool.ts`
- `src/office/components/terminalRecovery.ts`
- `src/office/components/terminalSelection.ts`
- `src/office/components/triggers/ContextSection.tsx`
- `src/office/components/triggers/JsonEditor.tsx`
- `src/office/components/triggers/OrgSection.tsx`
- `src/office/components/triggers/SchedulesSection.tsx`
- `src/office/components/triggers/TriggerHistoryTab.tsx`
- `src/office/components/triggers/TriggersTab.tsx`
- `src/office/components/triggers/WebhooksSection.tsx`
- `src/office/components/triggers/api.ts`
- `src/office/components/triggers/ui.tsx`
- `src/office/design/theme.ts`
- `src/office/design/tokens.ts`
- `src/office/env.d.ts`
- `src/office/freeflow/holdOption.ts`
- `src/office/freeflow/recorder.ts`
- `src/office/generated/pam_solution.ts`
- `src/office/hooks/queueDelivery.ts`
- `src/office/hooks/useHive.ts`
- `src/office/hooks/usePtyParser.ts`
- `src/office/hooks/useResolvedGodName.ts`
- `src/office/hooks/useRestoreTeam.ts`
- `src/office/hooks/useTelemetry.ts`
- `src/office/hooks/useTypewriter.ts`
- `src/office/hooks/useWorkspaceImage.ts`
- `src/office/i18n/index.ts`
- `src/office/i18n/useDirection.ts`
- `src/office/i18n/useGodNameSync.ts`
- `src/office/ide/GitPanes.tsx`
- `src/office/ide/IdePanel.tsx`
- `src/office/ide/ImagePreview.tsx`
- `src/office/ide/MonacoDiff.tsx`
- `src/office/ide/MonacoEditor.tsx`
- `src/office/ide/chrome.ts`
- `src/office/ide/monaco.ts`
- `src/office/integrations/registryClient.ts`
- `src/office/markdown/MarkdownPreview.tsx`
- `src/office/markdown/mdLinks.ts`
- `src/office/markdown/rehypeAutoDir.ts`
- `src/office/markdown/remarkSoftBreaks.ts`
- `src/office/realtime/CompletionToast.tsx`
- `src/office/realtime/CostHud.tsx`
- `src/office/realtime/DevicePicker.tsx`
- `src/office/realtime/actions.ts`
- `src/office/realtime/costStore.ts`
- `src/office/realtime/session.ts`
- `src/office/realtime/tools.ts`
- `src/office/scene/office/Camera.ts`
- `src/office/scene/office/Character.ts`
- `src/office/scene/office/CharacterSprite.ts`
- `src/office/scene/office/DeskScreen.ts`
- `src/office/scene/office/MessageEnvelope.ts`
- `src/office/scene/office/OfficeFloor.tsx`
- `src/office/scene/office/SeatPool.ts`
- `src/office/scene/office/SpriteAdapter.ts`
- `src/office/scene/office/ThoughtBubble.ts`
- `src/office/scene/office/TiledMapRenderer.ts`
- `src/office/scene/office/ToolBubble.ts`
- `src/office/scene/office/cafeteriaLines.ts`
- `src/office/scene/office/cast.ts`
- `src/office/scene/office/glRecovery.ts`
- `src/office/scene/office/pathfinding.ts`
- `src/office/scene/office/portraitArt.ts`
- `src/office/scene/office/themeLoader.ts`
- `src/office/scene/office/themeRegistry.ts`
- `src/office/shared/agentProvider.ts`
- `src/office/shared/agentRole.ts`
- `src/office/shared/broadcast.ts`
- `src/office/shared/claudeCommands.ts`
- `src/office/shared/codexCommands.ts`
- `src/office/shared/codexRemote.ts`
- `src/office/shared/commandLine.ts`
- `src/office/shared/dropFonts.ts`
- `src/office/shared/engineAvailability.ts`
- `src/office/shared/godIdentity.ts`
- `src/office/shared/grokCommands.ts`
- `src/office/shared/heroPayload.ts`
- `src/office/shared/hire.ts`
- `src/office/shared/hireQueue.ts`
- `src/office/shared/hiveNudge.ts`
- `src/office/shared/hookEvents.ts`
- `src/office/shared/imageTypes.ts`
- `src/office/shared/imeGuard.ts`
- `src/office/shared/integrations.ts`
- `src/office/shared/mcpCatalog.ts`
- `src/office/shared/modelCatalogPayload.ts`
- `src/office/shared/ossModels.ts`
- `src/office/shared/providerAutomation.ts`
- `src/office/shared/realtimePricing.ts`
- `src/office/shared/releaseDrop.ts`
- `src/office/shared/releaseNotes.ts`
- `src/office/shared/taskLedger.ts`
- `src/office/shared/terminalPaths.ts`
- `src/office/shared/tokenCaps.ts`
- `src/office/shared/toolCatalog.ts`
- `src/office/shared/triggers.ts`
- `src/office/shared/updateState.ts`
- `src/office/shared/weeklySchedule.ts`
- `src/office/store/config.ts`
- `src/office/store/focusMode.ts`
- `src/office/store/realAgentEvents.ts`
- `src/office/store/rosterSource.ts`
- `src/office/store/store.ts`
- `src/office/terminal/arabicJoiner.ts`
- `src/office/terminal/arabicSetting.ts`
- `src/office/terminal/arabicSpacingFix.ts`
- `src/office/terminal/useArabicTerminalSync.ts`
</details>

### Internationalization (i18n)
Detected locale files: `index.ts`, `locales`, `useDirection.ts`, `useGodNameSync.ts`


### Environment Variables (.env.example)
| Key | Description |
|---|---|
| `GEMINI_API_KEY` | Users configure this via the Secrets panel in the AI Studio UI. |
| `APP_URL` | Used for self-referential links, OAuth callbacks, and API endpoints. |


---
## 8. CI/CD & Build Scripts

### GitHub Actions Workflows
#### `.github/workflows/generate-blueprint.yml`
```yaml
# ================================================================
# MAHR — God-Mode Blueprint Auto-Generator
# .github/workflows/generate-blueprint.yml
#
# Triggers on every push to `main`.
# Runs the blueprint generator and auto-commits the updated file.
#
# SETUP REQUIRED:
#   1. Go to your repo on GitHub
#   2. Settings → Actions → General → Workflow permissions
#   3. Select "Read and write permissions"
#   4. Click Save
# ================================================================

name: Generate Project Blueprint

on:
  push:
    branches:
      - main
    # Avoid re-triggering when the bot commits the blueprint itself
    paths-ignore:
      - 'project-blueprint.md'

  # Allow manual trigger from the Actions tab
  workflow_dispatch:

jobs:
  generate-blueprint:
    name: Build & Commit Blueprint
    runs-on: ubuntu-latest
    timeout-minutes: 10

    permissions:
      contents: write  # Required to push the updated blueprint

    steps:
      # ── 1. Checkout full history (for git log hotspots) ──────
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history needed for git hotspots analysis

      # ── 2. Set up Node.js ────────────────────────────────────
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      # ── 3. Install dependencies (skip heavy optional deps) ───
      - name: Install dependencies
        run: 
```



### NPM Scripts
| Script | Command |
|---|---|
| `npm run dev` | `NODE_OPTIONS="--max-old-space-size=4096" tsx server.ts` |
| `npm run build` | `vite build` |
| `npm run build:desktop` | `vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs && esbuild electron/main.cjs --bundle --platform=node --format=cjs --packages=external --target=node20 --outfile=dist_electron/main.cjs && node scripts/create_installers.cjs` |
| `npm run build:electron` | `esbuild electron/main.cjs --bundle --platform=node --format=cjs --packages=external --target=node20 --outfile=dist_electron/main.cjs` |
| `npm run start` | `node server.ts` |
| `npm run preview` | `vite preview` |
| `npm run clean` | `rm -rf dist server.js` |
| `npm run lint` | `tsc --noEmit` |
| `npm run electron:start` | `electron electron/main.cjs` |
| `npm run electron:pack` | `electron-builder --dir` |
| `npm run electron:build:win` | `electron-builder --win` |
| `npm run electron:build:linux` | `electron-builder --linux AppImage deb` |
| `npm run electron:build:all` | `electron-builder -wl` |


### Electron Packaging Targets
| Command | Output |
|---|---|
| `npm run electron:build:win` | Windows NSIS installer |
| `npm run electron:build:linux` | Linux AppImage + .deb |
| `npm run electron:build:all` | All platforms |
| `npm run build:desktop` | Full desktop bundle pipeline |

---
## 9. AI Agent Quick Reference

> This section exists specifically for AI coding agents. Read this first.

### Key Entry Points
| What | Where |
|---|---|
| **Frontend entry** | `src/main.tsx` => `src/App.tsx` |
| **Express server entry** | `server.ts` |
| **Go server entry** | `server-golang/main.go` |
| **Electron main** | `electron/main.cjs` |
| **Vite config** | `vite.config.ts` |
| **TS config** | `tsconfig.json` |

### Do NOT Edit
- `project-blueprint.md` — auto-generated
- `mahr_brain.db*` — live runtime DB
- `bun.lock` / `package-lock.json` — managed by package manager
- `dist/`, `dist_electron/` — build outputs

### Critical Conventions
1. **Path alias `@/`** resolves to `src/` (root source directory)
2. **`@office/`** resolves to `src/office/` (Office system submodule)
3. **`@shared/`** resolves to `src/office/shared/`
4. **`@brand/`** resolves to `public/brand/`
5. **`@components/`**, **`@hooks/`**, **`@lib/`** resolve directly to their respective folders in `src/`
6. TypeScript server files use `.ts` extension but run via `tsx` (ESM)
7. Electron files use `.cjs` (CommonJS)
8. State files (`*.json`) in root are runtime data — ignore for code tasks

### Architecture Decision Records
| Decision | Rationale |
|---|---|
| Dual backend (TS + Go) | Go handles CPU-heavy vector ops; TS handles AI sessions |
| SQLite + JSON files | Zero-infra local persistence for desktop app |
| Electron wrapper | Cross-platform desktop distribution |
| Vite + React 19 | Fast dev cycle, concurrent rendering |
| Zustand | Minimal boilerplate state management |
| gorilla/websocket | High-perf live relay for real-time multimodal sessions |

---
## 10. Testing & Quality

### Test Files
> No test files detected. Consider adding:
> - `src/__tests__/` — React component tests (Jest + React Testing Library)
> - `server-golang/**/*_test.go` — Go unit tests


---
---
*Blueprint generated by `scripts/generate-blueprint.mjs` — 2026-09-26T18:21:10.739Z*
