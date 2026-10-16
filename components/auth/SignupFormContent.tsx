"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Terminal,
  User,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Code2,
  GitBranch,
  BookOpen,
  CalendarCheck,
  Zap,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AuthFormContainer } from "@/components/auth/AuthFormContainer";
import { AuthThemeSelector } from "@/components/auth/AuthThemeSelector";

export function SignupFormContent() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const passwordLength = password.length;
  const isPasswordTooShort = passwordLength > 0 && passwordLength < 4;
  const isPasswordTooLong = passwordLength > 10;
  const isPasswordValid = passwordLength >= 4 && passwordLength <= 10;

  return (
    <div className="min-h-screen w-full bg-[#0B0F17] text-white flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-hidden transition-colors duration-200">
      {/* Dynamic Ambient Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-emerald-500/10 blur-[140px] pointer-events-none" />
      <div
        className="absolute inset-0 blueprint-grid pointer-events-none"
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

        {/* Header Right: Theme Switcher */}
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
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold w-fit">
                <Sparkles size={13} />
                <span>Begin Your Daily Routine</span>
              </div>
              <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
                Build an Unbreakable <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                  Problem-Solving Habit.
                </span>
              </h1>
              <p className="text-zinc-400 text-base leading-relaxed max-w-lg mt-1">
                Stop scattered studying. Organize your daily practice sprints, time-block focus sessions, and master core computer science topics with systematic precision.
              </p>
            </div>

            {/* Interactive Feature Roadmap Showcase */}
            <div className="p-5 rounded-2xl bg-[#10141E]/80 border border-[#1E293B] shadow-xl backdrop-blur-md relative overflow-hidden flex flex-col gap-3.5">
              <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
                <span className="text-xs font-mono font-semibold text-zinc-300 flex items-center gap-1.5">
                  <GitBranch size={14} className="text-emerald-400" />
                  Structured Engineering Roadmap
                </span>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Ready to Track
                </span>
              </div>

              {/* Roadmap Milestones */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B0F17]/60 border border-[#1E293B]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                      ✓
                    </div>
                    <span className="text-zinc-200 font-medium">Sprint 1: Arrays, Two Pointers & Maps</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 font-semibold">100%</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B0F17]/80 border border-cyan-500/40 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px] animate-pulse">
                      ●
                    </div>
                    <span className="text-white font-semibold">Sprint 2: Binary Trees & Graph Traversal</span>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-400 font-bold">Active Sprint</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B0F17]/60 border border-[#1E293B] opacity-80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center font-mono text-[10px]">
                      3
                    </div>
                    <span className="text-zinc-400">Sprint 3: System Design & Caching Patterns</span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500">Upcoming</span>
                </div>
              </div>

              {/* Bottom Micro Features */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#1E293B]">
                <div className="flex items-center gap-2 text-zinc-400 text-xs">
                  <BookOpen size={13} className="text-cyan-400" />
                  <span>Integrated markdown notes</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-400 text-xs">
                  <CalendarCheck size={13} className="text-emerald-400" />
                  <span>Time-blocked daily schedule</span>
                </div>
              </div>
            </div>

            {/* Checkpoints */}
            <div className="flex items-center gap-6 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" /> Free local workspace
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-cyan-400" /> Curated Dark & light themes
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-amber-400" /> Zero tracking cookies
              </span>
            </div>
          </div>

          {/* Right Column: Centered Glassmorphic Auth Card */}
          <div className="w-full lg:col-span-6 flex justify-center">
            <div className="auth-glass-card w-full max-w-[440px] p-6 sm:p-9 rounded-2xl sm:rounded-3xl bg-[#10141E]/90 border border-[#1E293B] shadow-2xl backdrop-blur-2xl transition-all duration-300 relative">
              
              {/* Card Header */}
              <div className="flex flex-col gap-2 mb-6">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono font-medium">
                    <Sparkles size={12} />
                    <span>NEW WORKSPACE</span>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono">AlgoCraft Auth</span>
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
                  Create your account
                </h2>
                <p className="text-zinc-400 text-xs sm:text-sm">
                  Enter your details to initialize your daily habit tracker.
                </p>
              </div>

              {/* Form Container */}
              <AuthFormContainer actionType="signup">
                <Input
                  id="name"
                  name="name"
                  label="Full Name"
                  type="text"
                  placeholder="Alex Rivera"
                  helperText="Min. 3 characters"
                  icon={<User size={16} />}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />

                <Input
                  id="email"
                  name="email"
                  label="Email address"
                  type="email"
                  placeholder="engineer@algocraft.dev"
                  icon={<Mail size={16} />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />

                <div>
                  <Input
                    id="password"
                    name="password"
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    helperText="4 - 10 characters"
                    icon={<Lock size={16} />}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    maxLength={10}
                    required
                  />

                  {/* Dynamic Password Length / Strength Indicator */}
                  {passwordLength > 0 && (
                    <div className="mt-2 flex items-center justify-between text-[11px] px-1 animate-in fade-in duration-150">
                      <div className="flex items-center gap-1.5">
                        <div className="flex gap-1">
                          <span
                            className={`w-4 h-1 rounded-full transition-colors ${
                              passwordLength >= 4 ? "bg-emerald-400" : "bg-red-400"
                            }`}
                          />
                          <span
                            className={`w-4 h-1 rounded-full transition-colors ${
                              passwordLength >= 6 ? "bg-emerald-400" : "bg-zinc-700"
                            }`}
                          />
                          <span
                            className={`w-4 h-1 rounded-full transition-colors ${
                              passwordLength >= 8 ? "bg-emerald-400" : "bg-zinc-700"
                            }`}
                          />
                        </div>
                        <span
                          className={
                            isPasswordValid
                              ? "text-emerald-400 font-medium"
                              : "text-amber-400 font-medium"
                          }
                        >
                          {isPasswordTooShort
                            ? "Too short (min 4)"
                            : isPasswordTooLong
                            ? "Max 10 chars"
                            : "Valid length"}
                        </span>
                      </div>
                      <span className="font-mono text-zinc-500">
                        {passwordLength}/10 chars
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full py-3.5 text-sm sm:text-base font-bold uppercase tracking-wider"
                  >
                    <span>Create Workspace</span>
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </AuthFormContainer>

              {/* Security info pill */}
              <div className="mt-5 p-2.5 rounded-xl bg-[#0B0F17]/50 border border-[#1E293B] flex items-center gap-2 text-[11px] text-zinc-400">
                <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                <span>Protected by SHA-256 password hashing & secure session tokens</span>
              </div>

              {/* Card Footer: Switch to Login */}
              <div className="mt-6 pt-5 border-t border-[#1E293B] text-center">
                <p className="text-zinc-400 text-xs sm:text-sm">
                  Already have an account?{" "}
                  <Link
                    href="/Login"
                    className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4 ml-1 transition-colors"
                  >
                    Sign In
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
          <span>All workspace themes synchronized</span>
        </div>
        <p className="text-center font-mono text-[11px]">
          AlgoCraft Workspace • High-velocity algorithmic sprint tracking
        </p>
      </footer>
    </div>
  );
}
