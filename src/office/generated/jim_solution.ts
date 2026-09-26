import React from 'react';

const GlowingButton = ({ children, onClick, className = "" }) => {
  return (
    <button
      onClick={onClick}
      className={`relative px-6 py-2 font-medium text-white transition-all duration-300 rounded-lg bg-slate-900 overflow-hidden group ${className}`}
    >
      {/* The Glow Layer */}
      <div className="absolute inset-0 transition-opacity duration-500 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 blur-lg -z-10"></div>
      
      {/* Button Content */}
      <span className="relative z-10">{children}</span>
    </button>
  );
};

export default GlowingButton;