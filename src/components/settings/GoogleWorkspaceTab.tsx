import React, { useState } from "react";
import {
  ShieldCheck,
  RefreshCw,
  LogOut,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useGoogleWorkspace } from "../../hooks/google/useGoogleWorkspace";
import { GoogleSignInOfficialButton } from "../google/GoogleSignInOfficialButton";
import { GoogleProductCard } from "../google/GoogleProductCard";
import { GoogleProductInfo } from "../../services/google/googleWorkspaceTypes";
import { GoogleLiveProductInspector } from "../google/GoogleLiveProductInspector";
import { GoogleGLogo } from "../google/GoogleBrandLogos";

interface GoogleWorkspaceTabProps {
  onStatusAlert?: (msg: string) => void;
}

export const GoogleWorkspaceTab: React.FC<GoogleWorkspaceTabProps> = ({ onStatusAlert }) => {
  const {
    user,
    token,
    isAuthenticated,
    isLoggingIn,
    isSyncing,
    error,
    products,
    signIn,
    signOut,
    refreshSync,
  } = useGoogleWorkspace();

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<GoogleProductInfo | null>(null);

  const productList = Object.values(products);

  const filteredProducts = productList.filter((p) => {
    if (activeCategory === "all") return true;
    if (activeCategory === "office") return p.category === "Office & Documents";
    if (activeCategory === "comms") return p.category === "Communication & Schedule";
    if (activeCategory === "storage") return p.category === "Storage & Tasks";
    return true;
  });

  const handleSignIn = async () => {
    const res = await signIn();
    if (res) {
      onStatusAlert?.("✨ Google Workspace connected! All Google products linked.");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onStatusAlert?.("Signed out of Google Workspace. Zero-default mode enforced.");
  };

  const handleProductCardAction = (product: GoogleProductInfo) => {
    if (product.status === "connected") {
      setSelectedProduct(product);
    } else {
      handleSignIn();
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* 1. Account Connectivity Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-zinc-950 to-slate-950 p-5 sm:p-6 shadow-2xl">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            {/* User Avatar or Google 'G' Logo Box */}
            <div className="relative flex-shrink-0">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "Google User"}
                  className="w-14 h-14 rounded-2xl border-2 border-emerald-400/60 object-cover shadow-lg"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl border border-white/15 bg-white/10 flex items-center justify-center p-2.5 shadow-lg backdrop-blur-md">
                  <GoogleGLogo size={32} />
                </div>
              )}
              {isAuthenticated && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-900 flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  {isAuthenticated ? user?.displayName : "Google Workspace Suite"}
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold">
                  Official APIs
                </span>
              </div>

              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                {isAuthenticated
                  ? user?.email
                  : "Connect your official Google account to activate live Google Slides, Drive, Docs, Sheets, Calendar, Gmail & Tasks."}
              </p>

              {/* Data Isolation & Security Badge */}
              <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                  <ShieldCheck size={12} className="text-emerald-400" />
                  <span className="text-slate-300 font-mono">Isolated User Data</span>
                </div>
                <span className="text-slate-500 hidden sm:inline">•</span>
                <span className="text-slate-400 hidden sm:inline">
                  Each user account is securely scoped with zero cross-sharing.
                </span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-3 shrink-0">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="workspace-sync-all-btn"
                  data-testid="workspace-sync-all-btn"
                  onClick={refreshSync}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-zinc-200 hover:text-white transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                  title="Verify live connection for all 7 Google products"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-cyan-400" : ""}`} />
                  <span>{isSyncing ? "Syncing Suite..." : "Sync All (7)"}</span>
                </button>
                <button
                  type="button"
                  id="workspace-disconnect-btn"
                  data-testid="workspace-disconnect-btn"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-semibold text-rose-300 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              </div>
            ) : (
              <GoogleSignInOfficialButton
                onClick={handleSignIn}
                isLoading={isLoggingIn}
                text="Connect Google Account"
              />
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* 2. Category Filters & Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/70 rounded-xl border border-white/10 w-fit">
          {[
            { id: "all", label: "All Products (7)" },
            { id: "office", label: "Office & Docs" },
            { id: "comms", label: "Schedule & Mail" },
            { id: "storage", label: "Storage & Tasks" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          {isAuthenticated ? (
            <span className="flex items-center gap-1.5 text-emerald-300 font-semibold">
              <Sparkles size={13} className="text-emerald-400" />
              7 Google Products Active
            </span>
          ) : (
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              Click "Connect Google Account" to sync
            </span>
          )}
        </div>
      </div>

      {/* 3. Products Grid with Official Logos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <GoogleProductCard
            key={product.id}
            product={product}
            isLoading={isSyncing}
            onAction={handleProductCardAction}
          />
        ))}
      </div>

      {/* 4. Live Inspector Modal */}
      {selectedProduct && (
        <GoogleLiveProductInspector
          product={selectedProduct}
          accessToken={token}
          onClose={() => setSelectedProduct(null)}
          onToast={onStatusAlert}
        />
      )}
    </div>
  );
};
