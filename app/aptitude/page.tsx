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
  ChevronRight
} from 'lucide-react';

// Types
type Status = 'Not Started' | 'In Progress' | 'Mastered';

interface SubTopic {
  name: string;
}

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
      case 'Mastered': return <CheckCircle className="w-5 h-5 text-black" />;
      case 'In Progress': return <Clock className="w-5 h-5 text-zinc-500" />;
      default: return <Circle className="w-5 h-5 text-zinc-300" />;
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
    <div className="min-h-screen bg-white text-zinc-900 font-sans pb-24 selection:bg-zinc-200">
      {/* Global Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-zinc-100 z-50">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          className="h-full bg-black shadow-[0_0_10px_rgba(0,0,0,0.5)]"
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        {/* Header Section */}
        <header className="mb-14 border-b border-zinc-100 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8"
          >
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-black">
                Aptitude Prep
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-full text-sm font-semibold shadow-sm">
                  <Briefcase className="w-4 h-4" />
                  {rawData.role_target}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white border border-zinc-200 text-zinc-800 px-4 py-2 rounded-full text-sm font-semibold shadow-sm">
                  <Clock className="w-4 h-4 text-zinc-500" />
                  {rawData.duration} Timeline
                </span>
              </div>
            </div>

            <div className="hidden md:flex flex-col items-end shrink-0">
              <div className="flex items-baseline gap-1">
                <span className="text-6xl font-black tabular-nums tracking-tighter text-black">
                  {progressPercentage}
                </span>
                <span className="text-2xl font-bold text-zinc-400">%</span>
              </div>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">
                Overall Mastery
              </span>
            </div>
          </motion.div>
        </header>

        {/* Filters and Controls */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="flex flex-col lg:flex-row gap-4 justify-between items-center mb-12 bg-zinc-50/50 p-2 rounded-2xl border border-zinc-100 shadow-sm"
        >
          <div className="relative w-full lg:max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search topics or subtopics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all shadow-sm placeholder:text-zinc-400 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto p-2">
            <Filter className="w-4 h-4 text-zinc-400 shrink-0 ml-2" />
            <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x">
              {weightages.map(w => (
                <button
                  key={w}
                  onClick={() => setFilterWeight(w)}
                  className={`snap-center px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 shrink-0 border ${filterWeight === w
                      ? "bg-black text-white border-black shadow-md scale-105"
                      : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300 hover:text-black"
                    }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Main Grid Content */}
        {filteredAreas.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-500 font-medium">No results found for your search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
            <AnimatePresence>
              {filteredAreas.map((area, i) => (
                <motion.div
                  key={area.category}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col gap-5 h-full"
                >
                  <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md pt-2 pb-4 border-b-2 border-black">
                    <h2 className="text-xl font-bold text-black mb-3 leading-tight">
                      {area.category}
                    </h2>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded bg-zinc-100 text-black border border-zinc-200 uppercase tracking-wider">
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
                          className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 group ${isTopicComplete ? 'border-zinc-300 shadow-sm' : 'border-zinc-200 hover:border-zinc-300 hover:shadow-md'
                            }`}
                        >
                          <div className={`px-4 py-3.5 flex justify-between items-center bg-zinc-50/50 border-b ${isTopicComplete ? 'border-zinc-200' : 'border-zinc-100'
                            }`}>
                            <h3 className="font-bold text-zinc-900 text-sm leading-tight flex items-center gap-2">
                              {topic.name}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold font-mono text-zinc-500 bg-zinc-200 px-2 py-0.5 rounded-full">
                                {topicProgress}/{topic.subtopics.length}
                              </span>
                              {isTopicComplete && <Award className="w-4 h-4 text-black" />}
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
                                  className="w-full text-left p-2.5 rounded-xl hover:bg-zinc-100 flex items-start gap-3.5 transition-all duration-200 group/btn"
                                >
                                  <div className="mt-0.5 shrink-0 transition-transform duration-300 group-hover/btn:scale-110">
                                    {getStatusIcon(status)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-semibold truncate transition-colors duration-200 ${status === 'Mastered' ? 'text-zinc-400 line-through' : 'text-zinc-900'
                                      }`}>
                                      {subtopic}
                                    </p>
                                    <p className={`text-[10px] font-bold mt-1 uppercase tracking-widest transition-colors duration-200 ${status === 'Mastered' ? 'text-zinc-300' :
                                        status === 'In Progress' ? 'text-zinc-500' : 'text-zinc-300'
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
      </div>

      {/* Global CSS for hiding scrollbar if needed */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
