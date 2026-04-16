import React from "react";

export const Header: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => {
  return (
    <div className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#050505]/90 px-6 py-4 backdrop-blur-md">
      <div className="flex items-baseline gap-3">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {subtitle && <span className="text-xs text-[#555]">{subtitle}</span>}
      </div>
    </div>
  );
};
