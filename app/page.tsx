"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  CheckSquare,
  BarChart3,
  Smartphone,
  Database,
  RefreshCw,
  Layers,
  Terminal,
  ArrowRight,
  Sparkles,
  Code2,
  Zap,
  CheckCircle2,
  Flame,
  Shield,
} from "lucide-react";
import { AuthThemeSelector } from "@/components/auth/AuthThemeSelector";

export default function HomePage() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0F17] text-white flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-hidden font-sans transition-colors duration-200">
      {/* Dynamic Ambient Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-emerald-500/10 blur-[140px] pointer-events-none" />
      
      {/* High-tech Blueprint Grid Pattern */}
      <div
        className="absolute inset-0 blueprint-grid pointer-events-none"
        aria-hidden="true"
      />

      {/* Top Navigation Bar */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus:outline-none"
          title="AlgoCraft"
        >
          <div className="w-9 h-9 rounded-xl bg-[#10141E] border border-[#1E293B] group-hover:border-cyan-500/60 flex items-center justify-center text-cyan-400 shadow-md transition-all group-hover:scale-105">
            <Terminal size={18} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base sm:text-lg tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                AlgoCraft
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/25">
                v2.4
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
              Algorithmic Workspace OS
            </span>
          </div>
        </Link>

        {/* Right Nav Actions */}
        <div className="flex items-center gap-3">
          <AuthThemeSelector />
          <Link
            href="/Login"
            className="text-xs sm:text-sm font-medium text-zinc-300 hover:text-white px-3.5 py-2 rounded-xl hover:bg-[#141923] border border-transparent hover:border-[#1E293B] transition-all"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="text-xs sm:text-sm font-semibold text-zinc-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:opacity-95 px-4 py-2 rounded-xl shadow-md shadow-cyan-500/20 transition-all flex items-center gap-1.5 group"
          >
            <span>Get Started</span>
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto max-w-7xl px-4 sm:px-6 md:px-8 py-10 sm:py-16 md:py-20 flex-1 flex flex-col justify-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center justify-center text-center space-y-16"
        >
          {/* Hero Section */}
          <motion.div variants={itemVariants} className="space-y-6 max-w-4xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-xs font-semibold shadow-sm backdrop-blur-md">
              <Sparkles size={14} className="animate-pulse" />
              <span>Engineered for Tier-1 Algorithmic Mastery</span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.08] text-white">
              Absolute Clarity. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
                Pure Execution.
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-zinc-400 font-normal max-w-2xl mx-auto leading-relaxed">
              A minimalist, high-density algorithmic workspace designed for extreme focus. Execute structured sprints, master data structures, and track daily habits in one synchronized OS.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link href="/signup" className="w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.02, transition: { type: "spring", stiffness: 400, damping: 10 } }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 text-zinc-950 font-bold rounded-xl hover:opacity-95 transition-all text-base shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2"
              >
                <span>Launch Workspace</span>
                <ArrowRight size={18} />
              </motion.button>
            </Link>

            <Link href="/Login" className="w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#10141E]/90 hover:bg-[#141923] text-zinc-200 font-semibold rounded-xl border border-[#1E293B] hover:border-cyan-500/40 transition-all text-base shadow-lg backdrop-blur-md flex items-center justify-center gap-2"
              >
                <Code2 size={18} className="text-cyan-400" />
                <span>Sign In Demo</span>
              </motion.button>
            </Link>
          </motion.div>

          {/* Features Grid */}
          <motion.div variants={itemVariants} className="w-full pt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {/* Feature 1 */}
              <div className="flex flex-col items-start text-left p-7 sm:p-8 rounded-2xl border border-[#1E293B] bg-[#10141E]/80 backdrop-blur-md shadow-xl hover:border-cyan-500/40 transition-all group hover:scale-[1.01]">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-105 transition-transform shadow-md">
                  <CheckSquare size={22} />
                </div>
                <h3 className="text-xl font-bold mb-2.5 tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                  Habit Matrix
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Execute daily consistency. Log algorithmic reps, engineering readings, and system discipline with deterministic weekly habit matrices.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col items-start text-left p-7 sm:p-8 rounded-2xl border border-[#1E293B] bg-[#10141E]/80 backdrop-blur-md shadow-xl hover:border-emerald-500/40 transition-all group hover:scale-[1.01]">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-105 transition-transform shadow-md">
                  <BarChart3 size={22} />
                </div>
                <h3 className="text-xl font-bold mb-2.5 tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                  Planly AI Sprints
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Curated algorithmic roadmaps with intelligent spaced repetition, target company pools, and automatic daily progression.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col items-start text-left p-7 sm:p-8 rounded-2xl border border-[#1E293B] bg-[#10141E]/80 backdrop-blur-md shadow-xl hover:border-amber-500/40 transition-all group hover:scale-[1.01]">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-105 transition-transform shadow-md">
                  <Zap size={22} />
                </div>
                <h3 className="text-xl font-bold mb-2.5 tracking-tight text-white group-hover:text-amber-300 transition-colors">
                  Synchronized Themes
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Tailored color physics with 17 curated themes, zero data loss guarantee, and lightning-fast keyboard-first navigation.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Functionality Deep Dive */}
          <motion.div variants={itemVariants} className="w-full pt-12 border-t border-[#1E293B]/70 text-left">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 border border-cyan-500/25 px-2.5 py-0.5 rounded-full">
                ARCHITECTURE
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 tracking-tight text-white">
              Under the Hood Functions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <div className="p-6 rounded-xl bg-[#10141E]/60 border border-[#1E293B] flex flex-col gap-3">
                <div className="flex items-center gap-2 text-cyan-400">
                  <RefreshCw size={18} />
                  <h4 className="font-bold text-base text-white">Real-time Persistence</h4>
                </div>
                <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                  Optimistic client updates with background database synchronization. Add notes, edit pseudocode, and toggle status in milliseconds.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-[#10141E]/60 border border-[#1E293B] flex flex-col gap-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Layers size={18} />
                  <h4 className="font-bold text-base text-white">Status Tracking</h4>
                </div>
                <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                  Toggle tasks between pending and completed states directly across views. Progress bars automatically reflect live completion velocity.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-[#10141E]/60 border border-[#1E293B] flex flex-col gap-3">
                <div className="flex items-center gap-2 text-amber-400">
                  <Database size={18} />
                  <h4 className="font-bold text-base text-white">PostgreSQL Storage</h4>
                </div>
                <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                  Robust relational schema guarantees your habit history, DSA solutions, and practice timestamps are preserved across sessions.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 w-full border-t border-[#1E293B] bg-[#0B0F17]/80 backdrop-blur-md py-6 px-4 sm:px-6 md:px-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AlgoCraft Algorithmic Workspace OS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/Login" className="hover:text-cyan-400 transition-colors">Sign In</Link>
            <span>•</span>
            <Link href="/signup" className="hover:text-cyan-400 transition-colors">Create Account</Link>
            <span>•</span>
            <Link href="/dashboard" className="hover:text-cyan-400 transition-colors">Workspace</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
