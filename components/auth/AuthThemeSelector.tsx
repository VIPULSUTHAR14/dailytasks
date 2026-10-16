"use client";

import React, { useState, useEffect, useRef } from "react";
import { Palette, Check, Sparkles, ChevronDown } from "lucide-react";
import { THEMES, ThemeMode, getStoredTheme, setStoredTheme } from "@/lib/theme";

interface AuthThemeSelectorProps {
  className?: string;
  compact?: boolean;
}

export function AuthThemeSelector({ className = "", compact = false }: AuthThemeSelectorProps) {
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>("striking-simple");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentTheme(getStoredTheme());

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<ThemeMode>;
      if (customEvent.detail) {
        setCurrentTheme(customEvent.detail);
      }
    };

    window.addEventListener("algocraft-theme-change", handleThemeChange);

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("algocraft-theme-change", handleThemeChange);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSelectTheme = (themeId: ThemeMode) => {
    setCurrentTheme(themeId);
    setStoredTheme(themeId);
    setIsOpen(false);
  };

  const activeThemeObj = THEMES.find((t) => t.id === currentTheme) || THEMES[0];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#10141E]/80 hover:bg-[#141923] border border-[#1E293B] hover:border-cyan-500/40 text-xs font-medium text-white transition-all shadow-sm cursor-pointer select-none backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
        title="Change workspace theme"
        aria-label="Theme selector"
        aria-expanded={isOpen}
      >
        {/* Active Theme Color Dot */}
        <span
          className="w-3.5 h-3.5 rounded-full border border-white/20 flex items-center justify-center shrink-0 shadow-sm"
          style={{ backgroundColor: activeThemeObj.preview.bg }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: activeThemeObj.preview.accent }}
          />
        </span>

        {!compact && (
          <span className="hidden sm:inline text-zinc-300 font-medium">
            {activeThemeObj.name}
          </span>
        )}

        <Palette size={13} className="text-cyan-400 shrink-0" />
        <ChevronDown
          size={12}
          className={`text-zinc-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="glass surface-3 absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-[#1E293B] px-1">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles size={13} className="text-cyan-400" />
              Workspace Themes
            </span>
            <span className="text-[10px] font-mono text-zinc-400">{THEMES.length} Themes Synced</span>
          </div>

          <div className="space-y-1 max-h-[320px] overflow-y-auto pr-1 select-none">
            {THEMES.map((theme) => {
              const isSelected = currentTheme === theme.id;
              return (
                <button
                  type="button"
                  key={theme.id}
                  onClick={() => handleSelectTheme(theme.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#141923] border-cyan-500/60 shadow-sm ring-1 ring-cyan-500/30"
                      : "bg-[#0B0F17]/40 border-transparent hover:border-[#1E293B] hover:bg-[#141923]/70"
                  }`}
                >
                  <div className="flex flex-col gap-1.5 min-w-0 flex-1 pr-2">
                    <div className="flex items-center justify-between gap-1.5">
                      <p
                        className={`text-xs font-medium truncate ${
                          isSelected ? "text-white font-semibold" : "text-zinc-300"
                        }`}
                      >
                        {theme.name}
                      </p>
                      <span
                        className={`text-[9px] font-mono uppercase px-1 py-0.2 rounded border ${
                          theme.mode === "dark"
                            ? "bg-zinc-800/80 text-zinc-400 border-zinc-700/50"
                            : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                        }`}
                      >
                        {theme.mode}
                      </span>
                    </div>

                    {/* 5-Color Palette Strip wrapped in .surface-well */}
                    <div className="surface-well p-1 flex items-center gap-1 w-full rounded-md">
                      {theme.palette.map((color, idx) => (
                        <span
                          key={idx}
                          className="h-1.5 flex-1 rounded-xs border border-white/10"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                      <Check size={11} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-2.5 pt-2 border-t border-[#1E293B] flex items-center justify-between text-[10px] text-zinc-500 font-mono px-1">
            <span>Instant preview</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Persists on login
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
