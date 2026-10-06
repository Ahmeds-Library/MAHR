import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * Official Google Slides SVG Logo
 */
export const GoogleSlidesLogo: React.FC<LogoProps> = ({ className = "", size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
  >
    <path
      d="M37 6H11C9.34315 6 8 7.34315 8 9V39C8 40.6569 9.34315 42 11 42H37C38.6569 42 40 40.6569 40 39V9C40 7.34315 38.6569 6 37 6Z"
      fill="#FFBA00"
    />
    <path
      d="M37 6H31V15H40V9C40 7.34315 38.6569 6 37 6Z"
      fill="#F57C00"
    />
    <rect x="14" y="15" width="20" height="15" rx="2" fill="white" />
    <rect x="17" y="18" width="14" height="9" rx="1" fill="#FFE082" />
    <path
      d="M22 34H26V37H22V34Z"
      fill="white"
    />
    <path
      d="M19 37H29V39H19V37Z"
      fill="white"
    />
  </svg>
);

/**
 * Official Google Drive SVG Logo
 */
export const GoogleDriveLogo: React.FC<LogoProps> = ({ className = "", size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
  >
    <path
      d="M17.07 7.5L5.75 27.11L11.41 36.92L22.73 17.31L17.07 7.5Z"
      fill="#0066DA"
    />
    <path
      d="M30.93 7.5H17.07L22.73 17.31H36.59L30.93 7.5Z"
      fill="#00AC47"
    />
    <path
      d="M42.25 27.11L36.59 17.31H22.73L28.39 27.11H42.25Z"
      fill="#EA4335"
    />
    <path
      d="M28.39 27.11L22.73 36.92H8.87L14.53 27.11H28.39Z"
      fill="#FFBA00"
    />
    <path
      d="M36.59 36.92H11.41L5.75 27.11L30.93 27.11L36.59 36.92Z"
      fill="#FFBA00"
    />
    <path
      d="M30.93 7.5L42.25 27.11L36.59 36.92L25.27 17.31L30.93 7.5Z"
      fill="#2684FC"
    />
  </svg>
);

/**
 * Official Google Docs SVG Logo
 */
export const GoogleDocsLogo: React.FC<LogoProps> = ({ className = "", size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
  >
    <path
      d="M37 6H11C9.34315 6 8 7.34315 8 9V39C8 40.6569 9.34315 42 11 42H37C38.6569 42 40 40.6569 40 39V9C40 7.34315 38.6569 6 37 6Z"
      fill="#2684FC"
    />
    <path
      d="M37 6H30V16H40V9C40 7.34315 38.6569 6 37 6Z"
      fill="#0066DA"
    />
    <rect x="14" y="20" width="20" height="3" rx="1.5" fill="white" />
    <rect x="14" y="26" width="20" height="3" rx="1.5" fill="white" />
    <rect x="14" y="32" width="13" height="3" rx="1.5" fill="white" />
  </svg>
);

/**
 * Official Google Sheets SVG Logo
 */
export const GoogleSheetsLogo: React.FC<LogoProps> = ({ className = "", size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
  >
    <path
      d="M37 6H11C9.34315 6 8 7.34315 8 9V39C8 40.6569 9.34315 42 11 42H37C38.6569 42 40 40.6569 40 39V9C40 7.34315 38.6569 6 37 6Z"
      fill="#00AC47"
    />
    <path
      d="M37 6H30V16H40V9C40 7.34315 38.6569 6 37 6Z"
      fill="#00832D"
    />
    {/* Spreadsheet grid */}
    <rect x="14" y="19" width="20" height="17" rx="2" fill="white" />
    <path d="M14 24H34" stroke="#00AC47" strokeWidth="2" />
    <path d="M14 30H34" stroke="#00AC47" strokeWidth="2" />
    <path d="M22 19V36" stroke="#00AC47" strokeWidth="2" />
  </svg>
);

/**
 * Official Google Calendar SVG Logo
 */
export const GoogleCalendarLogo: React.FC<LogoProps> = ({ className = "", size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
  >
    <rect x="8" y="8" width="32" height="32" rx="6" fill="white" />
    <path d="M8 14C8 10.6863 10.6863 8 14 8H34C37.3137 8 40 10.6863 40 14V17H8V14Z" fill="#1A73E8" />
    <path d="M37 40H40V17H37V40Z" fill="#EA4335" />
    <path d="M11 40H37V37H11V40Z" fill="#34A853" />
    <path d="M8 17H11V40H8V17Z" fill="#FBBC04" />
    {/* "31" Text */}
    <text
      x="24"
      y="32"
      fill="#1A73E8"
      fontSize="15"
      fontFamily="sans-serif"
      fontWeight="900"
      textAnchor="middle"
      dominantBaseline="central"
    >
      31
    </text>
  </svg>
);

/**
 * Official Gmail SVG Logo
 */
export const GoogleGmailLogo: React.FC<LogoProps> = ({ className = "", size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
  >
    <path
      d="M10 38V18L24 28L38 18V38C38 39.1 37.1 40 36 40H12C10.9 40 10 39.1 10 38Z"
      fill="#EA4335"
    />
    <path
      d="M38 14V18L24 28L10 18V14C10 12.9 10.9 12 12 12H36C37.1 12 38 12.9 38 14Z"
      fill="#C5221F"
    />
    <path
      d="M10 14L24 24L38 14"
      stroke="#B31412"
      strokeWidth="1.5"
    />
    <path
      d="M10 14V38C10 39.1 10.9 40 12 40H14V20L10 17V14Z"
      fill="#4285F4"
    />
    <path
      d="M38 14V38C38 39.1 37.1 40 36 40H34V20L38 17V14Z"
      fill="#34A853"
    />
    <path
      d="M10 14C10 12.9 10.9 12 12 12H16L10 17V14Z"
      fill="#FBBC04"
    />
  </svg>
);

/**
 * Official Google Tasks SVG Logo
 */
export const GoogleTasksLogo: React.FC<LogoProps> = ({ className = "", size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
  >
    {/* Blue circle */}
    <circle cx="24" cy="24" r="16" fill="#1A73E8" />
    {/* White checkmark */}
    <path
      d="M18 24.5L22 28.5L30 19.5"
      stroke="white"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Yellow dot indicator */}
    <circle cx="33" cy="15" r="4.5" fill="#FBBC04" stroke="white" strokeWidth="1.5" />
  </svg>
);

/**
 * Official Google "G" 4-color Logo
 */
export const GoogleGLogo: React.FC<LogoProps> = ({ className = "", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
  >
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

export const PRODUCT_BRAND_LOGOS: Record<string, React.FC<LogoProps>> = {
  slides: GoogleSlidesLogo,
  drive: GoogleDriveLogo,
  docs: GoogleDocsLogo,
  sheets: GoogleSheetsLogo,
  calendar: GoogleCalendarLogo,
  gmail: GoogleGmailLogo,
  tasks: GoogleTasksLogo,
};
