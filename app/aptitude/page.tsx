"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  CheckCircle,
  Circle,
  Clock,
  Briefcase,
  TrendingUp,
  Award,
  ChevronRight,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { useRouter, usePathname } from "next/navigation";

// Types
type Status = 'Not Started' | 'In Progress' | 'Mastered';

interface Topic {
  name: string;
  subtopics: string[];
}

interface Category {
  category: string;
  weightage: string;
  topics: Topic[];
}

interface Plan {
  duration: string;
  role_target: string;
  focus_areas: Category[];
  milestones: { month_1: string; month_2: string };
}

const rawData: Plan = {
  "duration": "2 months",
  "role_target": "Backend Developer",
  "focus_areas": [
    {
      "category": "Quantitative Aptitude",
      "weightage": "High",
      "topics": [
        { "name": "Arithmetic", "subtopics": ["Percentages", "Profit & Loss", "Simple/Compound Interest", "Averages"] },
        { "name": "Algebraic Logic", "subtopics": ["Number System", "HCF & LCM", "Divisibility Rules"] },
        { "name": "Time & Motion", "subtopics": ["Time and Work", "Pipes and Cisterns", "Time, Speed, and Distance", "Relative Speed"] },
        { "name": "Modern Math", "subtopics": ["Permutation and Combination", "Probability"] },
        { "name": "Data Interpretation", "subtopics": ["Bar Graphs", "Pie Charts", "Tabular Data"] }
      ]
    },
    {
      "category": "Logical Reasoning",
      "weightage": "High",
      "topics": [
        { "name": "Arrangements", "subtopics": ["Linear Seating", "Circular Seating", "Matrix Match"] },
        { "name": "Syllogism", "subtopics": ["Venn Diagram Logic", "Statement-Conclusion"] },
        { "name": "Pattern Recognition", "subtopics": ["Coding-Decoding", "Number Series", "Analogies"] },
        { "name": "Relational Logic", "subtopics": ["Blood Relations", "Direction Sense"] },
        { "name": "Critical Thinking", "subtopics": ["Data Sufficiency", "Assumptions and Arguments"] }
      ]
    },
    {
      "category": "Verbal Ability",
      "weightage": "Medium",
      "topics": [
        { "name": "Comprehension", "subtopics": ["Reading Passages", "Theme Detection"] },
        { "name": "Grammar", "subtopics": ["Sentence Correction", "Subject-Verb Agreement", "Tenses"] },
        { "name": "Vocabulary", "subtopics": ["Synonyms/Antonyms", "Cloze Test", "Contextual Usage"] }
      ]
    },
    {
      "category": "Programming Logic (Technical Aptitude)",
      "weightage": "Very High",
      "topics": [
        { "name": "Pseudocode", "subtopics": ["Dry Running Loops", "Conditionals", "Recursion Depth"] },
        { "name": "Bitwise Operations", "subtopics": ["AND/OR/XOR Logic", "Left/Right Shifts"] },
        { "name": "Complexity Analysis", "subtopics": ["Big O Notation", "Space Complexity"] }
      ]
    }
  ],
  "milestones": {
    "month_1": "Concept mastery and formula memorization",
    "month_2": "Speed optimization, mock tests, and company-specific pyqs"
  }
};

export default function AptitudePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterWeight, setFilterWeight] = useState("All");
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function fetchStatuses() {
      try {
        const res = await fetch('/api/aptitude');
        if (res.ok) {
          const data = await res.json();
          if (data.statuses) {
            setStatuses(data.statuses);
          }
        }
      } catch (error) {
        console.error("Failed to fetch statuses:", error);
      }
    }
    fetchStatuses();
  }, []);

  const handelSignOut = async () => {
    try {
      const res = await fetch("/api/auth/Logout", {
        method: "POST",
      });
      if (res.ok) {
        router.push("/Login");
      }
    } catch (error) {
      console.error("Failed to sign out", error);
    }
  };

  const toggleStatus = async (id: string) => {
    const current = statuses[id] || 'Not Started';
    const next: Status = current === 'Not Started' ? 'In Progress'
      : current === 'In Progress' ? 'Mastered'
        : 'Not Started';

    // Optimistic UI update
    setStatuses(prev => ({ ...prev, [id]: next }));

    // Send update to the backend
    try {
      await fetch('/api/aptitude', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statuses: { [id]: next } })
      });
    } catch (error) {
      console.error("Failed to update status on server:", error);
    }
  };

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case 'Mastered': return <CheckCircle className="w-4 h-4 text-white" />;
      case 'In Progress': return <Clock className="w-4 h-4 text-zinc-500" />;
      default: return <Circle className="w-4 h-4 text-zinc-700" />;
    }
  };

  const totalSubtopics = useMemo(() => {
    let count = 0;
    rawData.focus_areas.forEach(cat =>
      cat.topics.forEach(top => count += top.subtopics.length)
    );
    return count;
  }, []);

  const masteredCount = Object.values(statuses).filter(s => s === 'Mastered').length;
  const progressPercentage = totalSubtopics === 0 ? 0 : Math.round((masteredCount / totalSubtopics) * 100);

  const filteredAreas = useMemo(() => {
    return rawData.focus_areas.map(area => {
      if (filterWeight !== "All" && area.weightage !== filterWeight) return null;

      const filteredTopics = area.topics.map(topic => {
        const topicMatches = topic.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchedSubtopics = topic.subtopics.filter(sub =>
          sub.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (topicMatches || matchedSubtopics.length > 0) {
          return {
            ...topic,
            subtopics: topicMatches ? topic.subtopics : matchedSubtopics
          };
        }
        return null;
      }).filter(Boolean) as Topic[];

      if (filteredTopics.length > 0) {
        return {
          ...area,
          topics: filteredTopics
        };
      }
      return null;
    }).filter(Boolean) as Category[];
  }, [searchTerm, filterWeight]);

  const weightages = ["All", "Medium", "High", "Very High"];

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-5 border-b border-white/10 relative z-20 bg-zinc-950">
        <h1 className="text-xl font-bold tracking-tight">Task Manager</h1>
        <button onClick={() => setSidebarOpen(true)} className="p-2 text-white hover:bg-zinc-900">
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 h-screen w-64 bg-zinc-950 border-r border-white/10 z-50 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          } flex flex-col`}
      >
        <div className="p-6 flex items-center justify-between md:justify-start gap-4 border-b border-white/10">
          <div className="w-8 h-8 bg-white flex items-center justify-center">
            <span className="text-zinc-950 font-bold text-lg">E</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">Dashboard.</h2>
          <button className="md:hidden p-2 text-zinc-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 p-6 flex flex-col gap-2">
          <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Navigation</div>
          <button
            onClick={() => { router.push("/tasks"); setSidebarOpen(false); }}
            className={`flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors ${pathname === "/tasks" ? "bg-white text-black font-bold" : "text-zinc-400 hover:bg-white/10 hover:text-white"
              }`}
          >
            Tasks
          </button>
          <button
            onClick={() => { router.push("/aptitude"); setSidebarOpen(false); }}
            className={`flex items-center justify-between px-4 py-3 text-sm font-bold bg-white text-black`}
          >
            Aptitude
          </button>
          <button
            onClick={() => { router.push("/dsapattern"); setSidebarOpen(false); }}
            className={`flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors ${pathname === "/dsapattern" ? "bg-white text-black font-bold" : "text-zinc-400 hover:bg-white/10 hover:text-white"
              }`}
          >
            DSA Patterns
          </button>
          <button
            onClick={() => { router.push("/dsatopics"); setSidebarOpen(false); }}
            className={`flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors ${pathname === "/dsatopics" ? "bg-white text-black font-bold" : "text-zinc-400 hover:bg-white/10 hover:text-white"
              }`}
          >
            DSA Topics
          </button>
          <button
            onClick={() => { router.push("/dsaquestions"); setSidebarOpen(false); }}
            className={`flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors ${pathname === "/dsaquestions" ? "bg-white text-black font-bold" : "text-zinc-400 hover:bg-white/10 hover:text-white"
              }`}
          >
            DSA Questions
          </button>
          <button
            onClick={() => { router.push("/timetable"); setSidebarOpen(false); }}
            className={`flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors ${pathname === "/timetable" ? "bg-white text-black font-bold" : "text-zinc-400 hover:bg-white/10 hover:text-white"
              }`}
          >
            Time Table
          </button>
        </div>

        <div className="p-6 border-t border-white/10">
          <button className="flex items-center gap-3 px-4 py-3 w-full text-zinc-400 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors" onClick={handelSignOut}>
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 w-full max-w-[1400px] relative min-h-screen mt-0 overflow-y-auto">
        {/* Header Section */}
        <header className="mb-10 hidden md:block">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tight text-white focus:outline-none">
                Aptitude Prep
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 bg-white text-zinc-950 px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-none shadow-sm">
                  <Briefcase className="w-3.5 h-3.5" />
                  {rawData.role_target}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-zinc-900 border border-white/10 text-zinc-400 px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-none shadow-sm">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  {rawData.duration} Timeline
                </span>
              </div>
            </div>

            <div className="hidden md:flex flex-col items-end shrink-0">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black tabular-nums tracking-tighter text-white">
                  {progressPercentage}
                </span>
                <span className="text-xl font-bold text-zinc-500">%</span>
              </div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                Overall Mastery
              </span>
            </div>
          </div>
        </header>

        {/* Overall Progress Section */}
        <div className="mb-10 bg-zinc-900/40 border border-white/5 p-6 rounded-none">
          <div className="flex justify-between items-end mb-3">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Prep Progress</h2>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest mt-1">
                {masteredCount} / {totalSubtopics} Subtopics Mastered
              </p>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">{progressPercentage}%</span>
          </div>
          <div className="h-[2px] w-full bg-zinc-800 rounded-none overflow-hidden">
            <motion.div
              className="h-full bg-white"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center mb-12 bg-zinc-900 border border-white/5 p-4 rounded-none">
          <div className="relative w-full lg:max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search topics or subtopics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-white/10 text-white text-sm font-medium placeholder-zinc-500 focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto p-2 overflow-x-auto">
            <Filter className="w-4 h-4 text-zinc-500 shrink-0 ml-2" />
            <div className="flex gap-2">
              {weightages.map(w => (
                <button
                  key={w}
                  onClick={() => setFilterWeight(w)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border ${filterWeight === w
                      ? "bg-white text-zinc-950 border-white"
                      : "bg-zinc-950 text-zinc-400 border-white/10 hover:text-white hover:border-white/35"
                    }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Grid Content */}
        {filteredAreas.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 p-12">
            <p className="text-zinc-500 font-medium">No results found for your search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredAreas.map((area, i) => (
                <motion.div
                  key={area.category}
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="flex flex-col gap-5 h-full"
                >
                  <div className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur-md pt-2 pb-4 border-b-2 border-white/20">
                    <h2 className="text-lg font-bold text-white mb-3 leading-tight min-h-[56px] flex items-center">
                      {area.category}
                    </h2>
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 border rounded-none uppercase tracking-wider ${area.weightage === 'Very High' ? 'bg-rose-400/10 text-rose-400 border-rose-400/20' :
                        area.weightage === 'High' ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' :
                          'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                      }`}>
                      <TrendingUp className="w-3.5 h-3.5" />
                      {area.weightage} priority
                    </span>
                  </div>

                  <div className="flex-1 space-y-4">
                    {area.topics.map((topic) => {
                      const topicProgress = topic.subtopics.filter(sub =>
                        statuses[`${area.category}-${topic.name}-${sub}`] === 'Mastered'
                      ).length;
                      const isTopicComplete = topicProgress === topic.subtopics.length && topic.subtopics.length > 0;

                      return (
                        <div
                          key={topic.name}
                          className={`bg-zinc-900 border rounded-none overflow-hidden transition-all duration-300 group ${isTopicComplete ? 'border-white/25 shadow-sm' : 'border-white/5 hover:border-white/20'
                            }`}
                        >
                          <div className={`px-4 py-3.5 flex justify-between items-center bg-zinc-900 border-b ${isTopicComplete ? 'border-white/10' : 'border-white/5'
                            }`}>
                            <h3 className="font-bold text-zinc-100 text-xs leading-tight flex items-center gap-2">
                              {topic.name}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold font-mono text-zinc-400 bg-zinc-950 px-2 py-0.5 border border-white/5">
                                {topicProgress}/{topic.subtopics.length}
                              </span>
                              {isTopicComplete && <Award className="w-4 h-4 text-white" />}
                            </div>
                          </div>

                          <div className="p-2">
                            {topic.subtopics.map(subtopic => {
                              const id = `${area.category}-${topic.name}-${subtopic}`;
                              const status = statuses[id] || 'Not Started';

                              return (
                                <button
                                  key={subtopic}
                                  onClick={() => toggleStatus(id)}
                                  className="w-full text-left p-2.5 rounded-none hover:bg-white/[0.02] flex items-start gap-3.5 transition-all duration-150 group/btn"
                                >
                                  <div className="mt-0.5 shrink-0 transition-transform duration-150 group-hover/btn:scale-110">
                                    {getStatusIcon(status)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-semibold truncate transition-colors duration-150 ${status === 'Mastered' ? 'text-zinc-500 line-through' : 'text-zinc-200'
                                      }`}>
                                      {subtopic}
                                    </p>
                                    <p className={`text-[9px] font-bold mt-1 uppercase tracking-widest transition-colors duration-150 ${status === 'Mastered' ? 'text-zinc-600' :
                                        status === 'In Progress' ? 'text-zinc-400' : 'text-zinc-700'
                                      }`}>
                                      {status}
                                    </p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
