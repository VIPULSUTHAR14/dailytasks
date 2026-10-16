"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

import type { Variants } from "framer-motion";

export interface ButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  isLoading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  isLoading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const { pending } = useFormStatus();
  const isBusy = isLoading || pending;

  const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  };

  const variantStyles = {
    primary:
      "btn-haptic text-zinc-950 font-bold",
    secondary:
      "btn-quiet text-white",
    outline:
      "btn-quiet text-white",
    ghost: "bg-transparent hover:bg-white/5 text-zinc-400 hover:text-white",
  };

  return (
    <motion.button
      variants={itemVariants}
      whileHover={isBusy || disabled ? undefined : { scale: 1.015, transition: { type: "spring", stiffness: 400, damping: 15 } }}
      whileTap={isBusy || disabled ? undefined : { scale: 0.985 }}
      disabled={isBusy || disabled}
      className={`relative flex items-center justify-center gap-2 rounded-xl transition-all cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed select-none ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isBusy ? (
        <span className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Processing...</span>
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
}
