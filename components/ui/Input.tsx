"use client";

import React, { useState } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { motion, type Variants } from "framer-motion";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export function Input({
  label,
  error,
  helperText,
  icon,
  rightElement,
  type,
  id,
  className = "",
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  };

  return (
    <motion.div variants={itemVariants} className="flex flex-col w-full gap-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-xs font-semibold uppercase tracking-wider text-zinc-300 select-none"
        >
          {label}
        </label>
        {helperText && !error && (
          <span className="text-[11px] text-zinc-500 font-normal">{helperText}</span>
        )}
      </div>

      <div
        className={`relative flex items-center w-full input-tactile transition-all duration-200 ${
          error
            ? "border-red-500/60 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20"
            : "focus-within:border-cyan-500/70 focus-within:ring-2 focus-within:ring-cyan-500/20"
        }`}
      >
        {/* Left Icon */}
        {icon && (
          <div className="pl-3.5 pr-1 text-zinc-400 flex items-center justify-center shrink-0 pointer-events-none">
            {icon}
          </div>
        )}

        <input
          id={id}
          type={isPassword && showPassword ? "text" : type}
          className={`flex-1 w-full bg-transparent py-3 text-sm md:text-base text-white placeholder:text-zinc-500 focus:outline-none transition-colors ${
            icon ? "pl-2" : "pl-3.5"
          } ${isPassword || rightElement ? "pr-11" : "pr-3.5"} ${className}`}
          {...props}
        />

        {/* Right Element or Password Toggle */}
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 p-1 rounded-md text-zinc-400 hover:text-white transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-500"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        ) : rightElement ? (
          <div className="absolute right-3 flex items-center">{rightElement}</div>
        ) : null}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 mt-0.5 text-red-400 text-xs font-medium animate-in fade-in slide-in-from-top-1 duration-150">
          <AlertCircle size={13} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </motion.div>
  );
}
