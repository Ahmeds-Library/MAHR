import React from "react";
import { Loader2 } from "lucide-react";

interface GoogleSignInOfficialButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  text?: string;
  className?: string;
}

/**
 * Official Google Sign-In button conforming to Google Brand Guidelines.
 */
export const GoogleSignInOfficialButton: React.FC<GoogleSignInOfficialButtonProps> = ({
  onClick,
  isLoading = false,
  disabled = false,
  text = "Sign in with Google",
  className = "",
}) => {
  return (
    <button
      type="button"
      id="google-signin-official-btn"
      data-testid="google-signin-official-btn"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`group relative inline-flex items-center justify-center gap-3 px-5 py-3 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 active:bg-white/20 text-white font-medium text-sm transition-all duration-200 shadow-lg hover:shadow-cyan-500/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {/* Official Google 'G' SVG Logo */}
      <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center bg-white rounded-full p-0.5 shadow-sm">
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 text-cyan-600 animate-spin" />
        ) : (
          <svg
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            className="w-full h-full block"
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
            <path fill="none" d="M0 0h48v48H0z" />
          </svg>
        )}
      </div>

      <span className="font-semibold tracking-wide text-zinc-100 group-hover:text-white">
        {isLoading ? "Connecting Account..." : text}
      </span>
    </button>
  );
};
