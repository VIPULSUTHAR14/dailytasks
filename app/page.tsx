"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckSquare, BarChart3, Smartphone, Database, RefreshCw, Layers } from "lucide-react";

export default function HomePage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-white selection:text-zinc-950 flex flex-col items-center justify-center">
      <main className="container mx-auto max-w-7xl px-4 sm:px-6 md:px-8 py-16 md:py-24">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center justify-center text-center space-y-16"
        >
          {/* Hero Section */}
          <motion.div variants={itemVariants} className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-tight text-white">
              Absolute Clarity.
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 font-medium max-w-2xl mx-auto">
              A minimalist, ultra-responsive task manager designed for extreme focus. Experience pure productivity in black and white.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="w-full sm:w-auto">
            <Link href="/signup">
              <motion.button
                whileHover={{ scale: 1.02, transition: { type: "spring", stiffness: 400, damping: 10 } }}
                whileTap={{ scale: 0.98 }}
                className="w-full md:w-auto px-10 py-4 bg-white text-zinc-950 font-bold rounded-none hover:bg-zinc-200 transition-colors text-lg"
              >
                Get Started
              </motion.button>
            </Link>
          </motion.div>

          {/* Features Grid */}
          <motion.div variants={itemVariants} className="w-full pt-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {/* Feature 1 */}
              <div className="flex flex-col items-center md:items-start text-center md:text-left p-8 border border-white/10 bg-zinc-900/50">
                <CheckSquare className="w-8 h-8 mb-6 text-white" />
                <h3 className="text-2xl font-bold mb-3 tracking-tight">Task Organization</h3>
                <p className="text-base text-zinc-400 leading-relaxed">
                  Keep everything structured. Create, read, update, and delete tasks instantly with a frictionless interface.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col items-center md:items-start text-center md:text-left p-8 border border-white/10 bg-zinc-900/50">
                <BarChart3 className="w-8 h-8 mb-6 text-white" />
                <h3 className="text-2xl font-bold mb-3 tracking-tight">Real-time Progress</h3>
                <p className="text-base text-zinc-400 leading-relaxed">
                  Track your momentum. A sleek dashboard progress bar automatically calculates your completion percentage.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col items-center md:items-start text-center md:text-left p-8 border border-white/10 bg-zinc-900/50">
                <Smartphone className="w-8 h-8 mb-6 text-white" />
                <h3 className="text-2xl font-bold mb-3 tracking-tight">Responsive Design</h3>
                <p className="text-base text-zinc-400 leading-relaxed">
                  Built to scale. Enjoy a flawless experience with a 1-column layout on mobile expanding to 3-columns on desktop.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Functionality Deep Dive */}
          <motion.div variants={itemVariants} className="w-full pt-16 mt-8 border-t border-white/10 text-left">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 tracking-tight text-center md:text-left text-white">
              Under the Hood Functions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="space-y-4">
                <RefreshCw className="w-6 h-6 text-zinc-400" />
                <h4 className="font-bold text-xl text-white">CRUD Operations</h4>
                <p className="text-zinc-500 text-base leading-relaxed">
                  Full control over your data. Add new tasks, edit descriptions, and securely delete completed items in milliseconds.
                </p>
              </div>
              <div className="space-y-4">
                <Layers className="w-6 h-6 text-zinc-400" />
                <h4 className="font-bold text-xl text-white">Status Tracking</h4>
                <p className="text-zinc-500 text-base leading-relaxed">
                  Toggle tasks between pending and completed states directly from the dashboard card. Never lose track of progress.
                </p>
              </div>
              <div className="space-y-4">
                <Database className="w-6 h-6 text-zinc-400" />
                <h4 className="font-bold text-xl text-white">Database Persistence</h4>
                <p className="text-zinc-500 text-base leading-relaxed">
                  Your data is robustly stored and automatically synced with PostgreSQL, guaranteeing secure retrieval across sessions.
                </p>
              </div>
            </div>
          </motion.div>

        </motion.div>
      </main>
    </div>
  );
}
