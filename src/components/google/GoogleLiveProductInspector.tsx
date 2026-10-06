import React, { useEffect, useState } from "react";
import {
  X,
  RefreshCw,
  ExternalLink,
  Calendar,
  Mail,
  HardDrive,
  CheckSquare,
  FileText,
  Plus,
} from "lucide-react";
import { GoogleProductInfo } from "../../services/google/googleWorkspaceTypes";
import { listUserDriveFiles } from "../../services/google/googleDriveClient";
import { listUpcomingCalendarEvents } from "../../services/google/googleCalendarClient";
import { listRecentEmails } from "../../services/google/googleGmailClient";
import { listUserTasks, createUserTask } from "../../services/google/googleTasksClient";
import { createGoogleDoc } from "../../services/google/googleDocsClient";
import { GoogleDestructiveConfirmModal } from "./GoogleDestructiveConfirmModal";

interface GoogleLiveProductInspectorProps {
  product: GoogleProductInfo | null;
  accessToken: string | null;
  onClose: () => void;
  onToast?: (msg: string) => void;
}

export const GoogleLiveProductInspector: React.FC<GoogleLiveProductInspectorProps> = ({
  product,
  accessToken,
  onClose,
  onToast,
}) => {
  const [loading, setLoading] = useState(false);
  const [dataItems, setDataItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Confirmation modal state for user mutations
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    action: async () => {},
  });

  const fetchData = async () => {
    if (!product || !accessToken) return;
    setLoading(true);
    setError(null);
    try {
      if (product.id === "drive") {
        const files = await listUserDriveFiles(accessToken, 8);
        setDataItems(files);
      } else if (product.id === "calendar") {
        const events = await listUpcomingCalendarEvents(accessToken, 8);
        setDataItems(events);
      } else if (product.id === "gmail") {
        const messages = await listRecentEmails(accessToken, 6);
        setDataItems(messages);
      } else if (product.id === "tasks") {
        const tasks = await listUserTasks(accessToken, 8);
        setDataItems(tasks);
      } else {
        setDataItems([]);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load live data from Google API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [product, accessToken]);

  if (!product) return null;

  const handleCreateQuickTask = () => {
    setConfirmModal({
      isOpen: true,
      title: "Add Task to Google Tasks?",
      description: "Create a new task 'Review AI Learning Lesson' in your primary Google Tasks list.",
      action: async () => {
        if (!accessToken) return;
        try {
          await createUserTask(accessToken, "Review AI Learning Lesson", "Created via MAHR Personal Assistant");
          onToast?.("Task created successfully in Google Tasks!");
          fetchData();
        } catch (err: any) {
          setError(err.message);
        }
      },
    });
  };

  const handleCreateQuickDoc = () => {
    setConfirmModal({
      isOpen: true,
      title: "Create Google Doc?",
      description: "Create a new empty document titled 'MAHR Study Notes' directly in your Google Drive.",
      action: async () => {
        if (!accessToken) return;
        try {
          const doc = await createGoogleDoc(accessToken, "MAHR Study Notes", "Created by MAHR AI Personal Assistant.");
          onToast?.(`Doc created! Opening ${doc.title}...`);
          window.open(doc.documentUrl, "_blank");
        } catch (err: any) {
          setError(err.message);
        }
      },
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <div className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl border border-white/20 bg-zinc-950 shadow-2xl overflow-hidden text-white">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                {product.id === "calendar" && <Calendar className="w-5 h-5" />}
                {product.id === "gmail" && <Mail className="w-5 h-5" />}
                {product.id === "drive" && <HardDrive className="w-5 h-5" />}
                {product.id === "tasks" && <CheckSquare className="w-5 h-5" />}
                {["slides", "docs", "sheets"].includes(product.id) && <FileText className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">{product.name} Live Sync</h3>
                <p className="text-xs text-zinc-400">Real-time data authenticated via your Google Account</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchData}
                disabled={loading}
                title="Refresh Live Data"
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs">
                {error}
              </div>
            )}

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
                <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                <span className="text-xs font-mono">Querying {product.name} API...</span>
              </div>
            ) : dataItems.length === 0 ? (
              <div className="py-8 text-center text-zinc-400 text-xs">
                <p>No active items returned from your {product.name} account.</p>
                <p className="text-[11px] text-zinc-500 mt-1">Zero-default mode verified: No fake records shown.</p>

                {product.id === "tasks" && (
                  <button
                    type="button"
                    onClick={handleCreateQuickTask}
                    className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create First Task
                  </button>
                )}
                {product.id === "docs" && (
                  <button
                    type="button"
                    onClick={handleCreateQuickDoc}
                    className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create New Document
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {product.id === "drive" &&
                  dataItems.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <HardDrive className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <div className="truncate">
                          <p className="text-xs font-medium text-zinc-200 truncate">{file.name}</p>
                          <p className="text-[10px] text-zinc-500">
                            {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : "Recent"}
                          </p>
                        </div>
                      </div>
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-zinc-400 hover:text-white"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  ))}

                {product.id === "calendar" &&
                  dataItems.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-sky-300">{event.summary}</p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            {event.start?.dateTime
                              ? new Date(event.start.dateTime).toLocaleString([], {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "All day"}
                          </p>
                        </div>
                        {event.htmlLink && (
                          <a
                            href={event.htmlLink}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-zinc-400 hover:text-white"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}

                {product.id === "gmail" &&
                  dataItems.map((mail) => (
                    <div
                      key={mail.id}
                      className="p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-rose-300 truncate">{mail.subject || "(No Subject)"}</p>
                        {mail.unread && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-mono">
                            UNREAD
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{mail.from}</p>
                      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">{mail.snippet}</p>
                    </div>
                  ))}

                {product.id === "tasks" &&
                  dataItems.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center ${
                            task.status === "completed"
                              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                              : "border-zinc-600"
                          }`}
                        >
                          {task.status === "completed" && <CheckSquare className="w-3 h-3" />}
                        </div>
                        <span
                          className={`text-xs ${
                            task.status === "completed" ? "line-through text-zinc-500" : "text-zinc-200 font-medium"
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs">
            <span className="text-[11px] text-zinc-500 font-mono">Official Google Workspace API Protocol</span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-zinc-200 text-xs font-medium transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Explicit User Confirmation Modal */}
      <GoogleDestructiveConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        description={confirmModal.description}
        isDanger={false}
        confirmLabel="Proceed"
        onConfirm={async () => {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          await confirmModal.action();
        }}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </>
  );
};
