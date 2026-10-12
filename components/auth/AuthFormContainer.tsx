"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { AlertCircle, X, CheckCircle2 } from "lucide-react";

interface AuthFormContainerProps {
  children: React.ReactNode;
  actionType: "login" | "signup";
  className?: string;
}

export function AuthFormContainer({
  children,
  actionType,
  className,
}: AuthFormContainerProps) {
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGlobalError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    const endpoint = actionType === "login" ? "/api/auth/Login" : "/api/auth/Signup";

    // Client-side quick validation
    if (actionType === "signup") {
      const name = String(data.name || "").trim();
      const password = String(data.password || "");
      if (name.length < 3) {
        setGlobalError("Name must be at least 3 characters long");
        setIsLoading(false);
        return;
      }
      if (password.length < 4 || password.length > 10) {
        setGlobalError("Password must be between 4 and 10 characters");
        setIsLoading(false);
        return;
      }
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (!res.ok) {
        setGlobalError(result.message || "Authentication failed. Please check your credentials.");
        setIsLoading(false);
        return;
      }

      if (actionType === "signup") {
        setSuccessMessage("Account created successfully! Redirecting to workspace...");
      } else {
        setSuccessMessage("Authentication verified. Loading your workspace...");
      }

      // Success redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 500);
    } catch (err: unknown) {
      setGlobalError("Network connection issue. Please verify your connection and try again.");
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      onChange={() => {
        if (globalError) setGlobalError(null);
      }}
      className={className || "flex flex-col gap-5"}
    >
      <AnimatePresence mode="wait">
        {globalError && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs sm:text-sm font-medium flex items-start justify-between gap-3 shadow-sm backdrop-blur-md"
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-red-400" />
              <span>{globalError}</span>
            </div>
            <button
              type="button"
              onClick={() => setGlobalError(null)}
              className="text-red-400/70 hover:text-red-400 p-0.5 rounded transition-colors"
              aria-label="Dismiss error"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs sm:text-sm font-medium flex items-center gap-2.5 shadow-sm backdrop-blur-md"
          >
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`w-full flex flex-col gap-4 ${
          isLoading ? "opacity-60 pointer-events-none" : ""
        }`}
      >
        {children}
      </motion.div>
    </form>
  );
}
