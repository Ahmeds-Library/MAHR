import React from "react";
import { useGoogleWorkspace } from "@/hooks/google/useGoogleWorkspace";
import { GoogleSignInOfficialButton } from "@/components/google/GoogleSignInOfficialButton";
import { PixelPanel } from "./PixelPanel";
import { PixelButton } from "./PixelButton";
import { CheckCircle2, ShieldCheck, RefreshCw, LogOut } from "lucide-react";

export const GoogleWorkspaceOfficeSection: React.FC = () => {
  const { user, isAuthenticated, isLoggingIn, isSyncing, products, signIn, signOut, refreshSync } =
    useGoogleWorkspace();

  const productList = Object.values(products);

  return (
    <PixelPanel style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: "var(--cth-paper-100)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--cth-ink-300)",
            }}
          >
            <ShieldCheck size={14} color="var(--cth-ink-900)" />
          </div>
          <div>
            <div style={{ fontFamily: "var(--cth-font-display)", fontSize: 11, color: "var(--cth-ink-900)", textTransform: "uppercase" }}>
              Google Workspace & Accounts (7 Connected Apps)
            </div>
            <div style={{ fontSize: 11, color: "var(--cth-ink-700)" }}>
              {isAuthenticated
                ? `Active Account: ${user?.email} (Zero-Default Tenant Isolated)`
                : "Connect your official Google account to sync Slides, Docs, Sheets, Drive, Gmail, Calendar & Tasks"}
            </div>
          </div>
        </div>

        {isAuthenticated && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <PixelButton
              variant="secondary"
              onClick={refreshSync}
              disabled={isSyncing}
              style={{ fontSize: 11, padding: "4px 8px", display: "flex", alignItems: "center", gap: 4 }}
            >
              <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
              {isSyncing ? "Syncing..." : "Sync"}
            </PixelButton>
            <PixelButton
              variant="destructive"
              onClick={signOut}
              style={{ fontSize: 11, padding: "4px 8px", display: "flex", alignItems: "center", gap: 4 }}
            >
              <LogOut size={12} />
              Disconnect
            </PixelButton>
          </div>
        )}
      </div>

      {/* Main Connection Status */}
      {!isAuthenticated ? (
        <div style={{ padding: 10, background: "var(--cth-paper-200)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontSize: 12, color: "var(--cth-ink-800)" }}>
            No Google account connected. Zero-default mode is active.
          </div>
          <GoogleSignInOfficialButton onClick={signIn} isLoading={isLoggingIn} text="Connect Google Account" />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
          {productList.map((prod) => (
            <div
              key={prod.id}
              style={{
                padding: "6px 8px",
                background: "var(--cth-paper-200)",
                border: "1px solid var(--cth-ink-300)",
                borderRadius: 4,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: "bold", color: "var(--cth-ink-900)" }}>{prod.name}</span>
                <CheckCircle2 size={12} color="#10b981" />
              </div>
              <span style={{ fontSize: 9, color: "var(--cth-ink-600)", fontFamily: "monospace" }}>
                {prod.itemLabel || "Synced"}
              </span>
            </div>
          ))}
        </div>
      )}
    </PixelPanel>
  );
};
