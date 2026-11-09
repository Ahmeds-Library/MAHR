import React, { useState, useEffect } from "react";
import {
  FolderOpen,
  Edit3,
  Eye,
  Save,
  Link2,
  ArrowUpRight,
  Calendar,
  FilePlus2,
} from "lucide-react";
import {
  ObsidianNoteFile,
  ObsidianLinkedBacklink,
  ObsidianUnlinkedMention,
} from "../layer1_data/obsidianTypes";
import { OBSIDIAN_NOTE_TEMPLATES } from "../layer2_logic/obsidianBacklinksAndTemplatesService";
import { ObsidianBacklinksDrawer } from "./ObsidianBacklinksDrawer";

interface ObsidianNoteEditorPaneProps {
  note: ObsidianNoteFile;
  linkedBacklinks: ObsidianLinkedBacklink[];
  unlinkedMentions: ObsidianUnlinkedMention[];
  onSaveEditedNote: (updatedNote: ObsidianNoteFile) => void;
  onClickWikiLink: (wikiTitle: string) => void;
  onSelectNoteById: (noteId: string) => void;
  onConvertUnlinkedMention: (mention: ObsidianUnlinkedMention) => void;
  onOpenDailyNote: () => void;
  onCreateFromTemplate: (templateId: string, customTitle?: string) => void;
}

export const ObsidianNoteEditorPane: React.FC<ObsidianNoteEditorPaneProps> = ({
  note,
  linkedBacklinks,
  unlinkedMentions,
  onSaveEditedNote,
  onClickWikiLink,
  onSelectNoteById,
  onConvertUnlinkedMention,
  onOpenDailyNote,
  onCreateFromTemplate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(note.title);
  const [draftBody, setDraftBody] = useState(note.markdownBody);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [newNoteTitleInput, setNewNoteTitleInput] = useState("");

  useEffect(() => {
    setDraftTitle(note.title);
    setDraftBody(note.markdownBody);
    setIsEditing(false);
  }, [note.id, note.title, note.markdownBody]);

  const handleSave = () => {
    onSaveEditedNote({
      ...note,
      title: draftTitle.trim() || note.title,
      markdownBody: draftBody,
    });
    setIsEditing(false);
  };

  return (
    <div className="flex-1 bg-[#0e101c] flex flex-col min-w-0 overflow-y-auto p-5 space-y-4">
      {/* Top Note Toolbar: Daily Note, Templates, Edit/Reader Switch */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-3">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-mono text-purple-300 flex items-center gap-1.5">
            <FolderOpen size={12} />
            <span className="truncate">{note.relativePath}</span>
            <span>·</span>
            <span className="text-slate-400">
              {note.tags.map((t) => `#${t}`).join(" ")}
            </span>
          </div>

          {isEditing ? (
            <input
              type="text"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              className="mt-1.5 w-full px-3 py-1.5 rounded-xl bg-black/50 border border-purple-400/50 text-sm font-bold text-white focus:outline-none"
            />
          ) : (
            <h3 className="text-base sm:text-lg font-bold text-white mt-1 truncate">
              {note.title}.md
            </h3>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onOpenDailyNote}
            className="px-2.5 py-1.5 rounded-xl border border-indigo-400/40 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-200 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
            title="Open or create today's Daily Note"
          >
            <Calendar size={12} />
            <span>Daily Note</span>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTemplateMenu((v) => !v)}
              className="px-2.5 py-1.5 rounded-xl border border-pink-400/40 bg-pink-500/15 hover:bg-pink-500/25 text-pink-200 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
              title="Create a new vault note from an Obsidian template"
            >
              <FilePlus2 size={12} />
              <span>+ New / Template</span>
            </button>

            {showTemplateMenu && (
              <div className="absolute right-0 mt-1.5 w-72 p-3 rounded-2xl bg-slate-950 border border-white/15 shadow-2xl z-30 space-y-2.5">
                <div className="text-[11px] font-mono text-slate-300 font-semibold">
                  Create Vault Note from Template
                </div>
                <input
                  type="text"
                  value={newNoteTitleInput}
                  onChange={(e) => setNewNoteTitleInput(e.target.value)}
                  placeholder="Optional note title..."
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/15 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
                <div className="space-y-1">
                  {OBSIDIAN_NOTE_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => {
                        onCreateFromTemplate(
                          tpl.id,
                          newNoteTitleInput.trim() || undefined
                        );
                        setNewNoteTitleInput("");
                        setShowTemplateMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-purple-500/20 border border-transparent hover:border-purple-400/30 transition cursor-pointer"
                    >
                      <div className="text-xs font-mono font-semibold text-white">
                        {tpl.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        Folder: {tpl.folder} · {tpl.tags.map((t) => `#${t}`).join(" ")}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {isEditing ? (
            <button
              type="button"
              onClick={handleSave}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <Save size={12} />
              <span>Save .md</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-2.5 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <Edit3 size={12} />
              <span>Edit Markdown</span>
            </button>
          )}

          {isEditing && (
            <button
              type="button"
              onClick={() => {
                setDraftTitle(note.title);
                setDraftBody(note.markdownBody);
                setIsEditing(false);
              }}
              className="px-2.5 py-1.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-xs font-mono flex items-center gap-1 transition cursor-pointer"
            >
              <Eye size={12} />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>

      {/* YAML Frontmatter Block */}
      <pre className="p-3 rounded-xl bg-black/50 border border-white/10 text-[11px] font-mono text-cyan-300 overflow-x-auto">
        {note.yamlFrontmatter}
      </pre>

      {/* Markdown Body: Live Editor vs Reader */}
      {isEditing ? (
        <div className="space-y-2">
          <div className="text-[11px] font-mono text-slate-400">
            Tip: Use <code className="text-purple-300">[[Note Title]]</code> to create live Knowledge Graph edges and <code className="text-cyan-300">#tags</code> for taxonomy indexing.
          </div>
          <textarea
            value={draftBody}
            onChange={(e) => setDraftBody(e.target.value)}
            rows={14}
            className="w-full p-4 rounded-2xl bg-black/60 border border-purple-500/40 text-xs sm:text-sm text-slate-100 font-mono leading-relaxed focus:outline-none focus:border-purple-400 resize-y"
          />
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-xs sm:text-sm text-slate-200 font-sans leading-relaxed whitespace-pre-wrap">
          {note.markdownBody}
        </div>
      )}

      {/* Outgoing Clickable [[WikiLinks]] */}
      <div className="space-y-2 pt-2 border-t border-white/10">
        <div className="text-xs font-mono font-bold text-purple-300 flex items-center gap-1.5 tabular-nums">
          <Link2 size={13} />
          <span>Outgoing [[WikiLinks]] ({note.wikiLinks.length})</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from(new Set(note.wikiLinks)).map((linkTitle, idx) => (
            <button
              key={`${linkTitle}-${idx}`}
              type="button"
              onClick={() => onClickWikiLink(linkTitle)}
              className="px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/30 border border-purple-400/30 text-xs font-mono text-purple-200 flex items-center gap-1 transition cursor-pointer"
            >
              <span>[[{linkTitle}]]</span>
              <ArrowUpRight size={11} />
            </button>
          ))}
        </div>
      </div>

      {/* Live Linked Backlinks & Unlinked Mentions Detector */}
      <ObsidianBacklinksDrawer
        linkedBacklinks={linkedBacklinks}
        unlinkedMentions={unlinkedMentions}
        onSelectNoteById={onSelectNoteById}
        onConvertUnlinkedMention={onConvertUnlinkedMention}
      />
    </div>
  );
};
