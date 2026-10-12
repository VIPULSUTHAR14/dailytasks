"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Terminal,
  Mail,
  Lock,
  ArrowRight,
  Shield,
  Flame,
  Zap,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  Code2,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AuthFormContainer } from "@/components/auth/AuthFormContainer";
import { AuthThemeSelector } from "@/components/auth/AuthThemeSelector";

export function LoginFormContent() {
  const [emailValue, setEmailValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");

  const handleFillDemo = () => {
    setEmailValue("alex@algocraft.dev");
    setPasswordValue("code2024");
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0F17] text-white flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-hidden transition-colors duration-200">
      {/* Dynamic Ambient Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-emerald-500/10 blur-[130px] pointer-events-none" />
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"
        aria-hidden="true"
      />

      {/* Top Navigation Bar */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus:outline-none"
          title="Back to Home"
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

        {/* Header Right: Theme Switcher & Links */}
        <div className="flex items-center gap-3">
          <AuthThemeSelector />
        </div>
      </header>

      {/* Main Split Section */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 flex-1 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Visual Showcase (Visible on lg+) */}
          <div className="hidden lg:flex lg:col-span-6 flex-col gap-8 pr-4">
            <div className="flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-xs font-semibold w-fit">
                <Sparkles size={13} />
                <span>Engineered for Tier-1 Prep</span>
              </div>
              <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
                Master Your Daily <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
                  Algorithmic Flow.
                </span>
              </h1>
              <p className="text-zinc-400 text-base leading-relaxed max-w-lg mt-1">
                Execute structured problem-solving sprints, block out deep-focus intervals, and document system design patterns in one synchronized workspace.
              </p>
            </div>

            {/* Live Interactive Simulation Widget */}
            <div className="p-5 rounded-2xl bg-[#10141E]/80 border border-[#1E293B] shadow-xl backdrop-blur-md relative overflow-hidden flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-semibold text-zinc-300">
                    Active Sprint: Two Pointers & Sliding Window
                  </span>
                </div>
                <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  Sprint #04
                </span>
              </div>

              {/* Progress metrics */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Clock size={13} className="text-cyan-400" />
                    Target Completion
                  </span>
                  <span className="text-white font-mono font-bold">4 / 5 Solved (80%)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#0B0F17] overflow-hidden border border-[#1E293B]">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full w-[80%]" />
                </div>
              </div>

              {/* Quick stats pills */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div className="p-2.5 rounded-xl bg-[#0B0F17]/70 border border-[#1E293B] flex flex-col gap-0.5">
                  <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                    <Flame size={11} className="text-amber-400" /> STREAK
                  </span>
                  <span className="text-sm font-bold text-white font-mono">14 Days</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#0B0F17]/70 border border-[#1E293B] flex flex-col gap-0.5">
                  <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                    <Zap size={11} className="text-cyan-400" /> FOCUS
                  </span>
                  <span className="text-sm font-bold text-white font-mono">3h 40m</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#0B0F17]/70 border border-[#1E293B] flex flex-col gap-0.5">
                  <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                    <Layers size={11} className="text-emerald-400" /> THEMES
                  </span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">11 Synced</span>
                </div>
              </div>
            </div>

            {/* Feature points */}
            <div className="flex items-center gap-6 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-cyan-400" /> Instant theme reactivity
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" /> Zero data loss guarantee
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-amber-400" /> Keyboard-first navigation
              </span>
            </div>
          </div>

          {/* Right Column: Centered Glassmorphic Auth Card */}
          <div className="w-full lg:col-span-6 flex justify-center">
            <div className="auth-glass-card w-full max-w-[440px] p-6 sm:p-9 rounded-2xl sm:rounded-3xl bg-[#10141E]/90 border border-[#1E293B] shadow-2xl backdrop-blur-2xl transition-all duration-300 relative">
              
              {/* Card Header */}
              <div className="flex flex-col gap-2 mb-6">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-mono font-medium">
                    <Shield size={12} />
                    <span>SECURE ACCESS</span>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono">AlgoCraft Auth</span>
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
                  Welcome back
                </h2>
                <p className="text-zinc-400 text-xs sm:text-sm">
                  Sign in to resume your active sprints and schedule.
                </p>
              </div>

              {/* Form Container */}
              <AuthFormContainer actionType="login">
                <Input
                  id="email"
                  name="email"
                  label="Email address"
                  type="email"
                  placeholder="engineer@algocraft.dev"
                  icon={<Mail size={16} />}
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  autoComplete="email"
                  required
                />

                <Input
                  id="password"
                  name="password"
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  icon={<Lock size={16} />}
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-zinc-400 hover:text-zinc-300 select-none">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-[#1E293B] bg-[#0B0F17] text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
                    />
                    <span>Keep me signed in</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      alert(
                        "Password reset: In development mode, you can sign in directly or register a new workspace test account."
                      )
                    }
                    className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full py-3.5 text-sm sm:text-base font-bold uppercase tracking-wider"
                  >
                    <span>Sign In to Workspace</span>
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </AuthFormContainer>

              {/* Quick Demo Credentials Helper */}
              <div className="mt-5 p-3 rounded-xl bg-[#0B0F17]/60 border border-[#1E293B] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Code2 size={15} className="text-cyan-400 shrink-0" />
                  <span className="text-[11px] font-mono">Test account?</span>
                </div>
                <button
                  type="button"
                  onClick={handleFillDemo}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-mono text-[11px] font-semibold border border-cyan-500/25 transition-all cursor-pointer"
                >
                  Fill Demo Details
                </button>
              </div>

              {/* Card Footer: Switch to Signup */}
              <div className="mt-6 pt-5 border-t border-[#1E293B] text-center">
                <p className="text-zinc-400 text-xs sm:text-sm">
                  Don&apos;t have an account yet?{" "}
                  <Link
                    href="/signup"
                    className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4 ml-1 transition-colors"
                  >
                    Create Workspace
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 border-t border-[#1E293B]/60">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>All 11 AlgoCraft themes synchronized</span>
        </div>
        <p className="text-center font-mono text-[11px]">
          AlgoCraft Workspace • High-velocity algorithmic sprint tracking
        </p>
      </footer>
    </div>
  );
}
