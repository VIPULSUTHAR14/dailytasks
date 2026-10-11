import React, { useState, useMemo, useEffect } from "react";
import {
  Calendar,
  Clock,
  Code2,
  Database,
  Cpu,
  Globe,
  Layers,
  Sparkles,
  Download,
  Upload,
  Copy,
  CheckCircle2,
  Circle,
  AlertTriangle,
  RotateCcw,
  Zap,
  ChevronRight,
  ChevronLeft,
  Filter,
  Check,
  Flame,
  BarChart3,
  Terminal,
  Settings,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  FileJson,
  Building2,
  BrainCircuit,
  Trophy,
  History,
  TrendingDown,
  Info,
  Sliders,
  BookmarkCheck
} from "lucide-react";

const DSA_TOPICS_POOL = [
  { topic: "Arrays & Two Pointers", tag: "arrays", questions: ["Two Sum", "3Sum", "Trapping Rain Water", "Container With Most Water", "Merge Intervals"] },
  { topic: "Sliding Window & Hashing", tag: "window", questions: ["Longest Substring Without Repeating Characters", "Minimum Window Substring", "Subarray Sum Equals K", "Max Consecutive Ones III"] },
  { topic: "Binary Search & Search Space", tag: "bs", questions: ["Binary Search in Rotated Sorted Array", "Koko Eating Bananas", "Book Allocation Problem", "Median of Two Sorted Arrays"] },
  { topic: "Linked List & Fast/Slow Pointer", tag: "ll", questions: ["Reverse Linked List", "Detect Cycle & Entry Point", "Merge K Sorted Lists", "LRU Cache Design"] },
  { topic: "Recursion & Backtracking", tag: "backtracking", questions: ["Subsets & Combinations", "N-Queens Problem", "Sudoku Solver", "Word Search II"] },
  { topic: "Stacks, Queues & Monotonic Tricks", tag: "stack", questions: ["Next Greater Element I & II", "Largest Rectangle in Histogram", "Sliding Window Maximum", "Min Stack"] },
  { topic: "Binary Trees & BST", tag: "trees", questions: ["Lowest Common Ancestor", "Binary Tree Maximum Path Sum", "Diameter of Binary Tree", "Validate BST", "Construct Tree from Pre/Inorder"] },
  { topic: "Heaps & Priority Queues", tag: "heaps", questions: ["Top K Frequent Elements", "Kth Largest in Stream", "Find Median from Data Stream", "Task Scheduler"] },
  { topic: "Graphs & Disjoint Set", tag: "graphs", questions: ["Topological Sort (Kahn's)", "Dijkstra's Shortest Path", "Number of Islands & Connected Components", "Word Ladder I", "Alien Dictionary"] },
  { topic: "Dynamic Programming (1D & 2D)", tag: "dp", questions: ["Longest Increasing Subsequence", "0/1 Knapsack & Subset Sum", "Longest Common Subsequence", "Edit Distance", "Coin Change"] }
];

const CORE_SUBJECTS_POOL = {
  dbms: [
    { title: "ACID & Transactions", items: ["Dirty Read & Non-repeatable Read", "Serializability & Conflict Equivalence"] },
    { title: "Normalization & Functional Dependencies", items: ["1NF, 2NF, 3NF vs BCNF decompositions", "Lossless-Join & Dependency Preservation"] },
    { title: "Indexing & SQL Query Optimization", items: ["B-Tree vs B+ Tree internals", "Clustered vs Non-clustered indexing", "Explain Plan query analysis"] }
  ],
  os: [
    { title: "Process Scheduling & Concurrency", items: ["Round Robin & Multilevel Queue", "Race Conditions & Mutex vs Semaphores"] },
    { title: "Deadlocks & Peterson's Solution", items: ["Banker's Algorithm & Resource Request", "Deadlock Prevention vs Avoidance"] },
    { title: "Virtual Memory & Paging", items: ["Page Faults & TLB Miss Latency", "LRU Page Replacement Algorithm", "Inverted Page Tables"] }
  ],
  cn: [
    { title: "Transport Layer Primitives", items: ["3-Way TCP Handshake & 4-Way Teardown", "TCP Congestion Control (Tahoe vs Reno)", "UDP vs TCP for Realtime Streaming"] },
    { title: "Network Routing & Addressing", items: ["IPv4 CIDR Subnetting Drills", "NAT & ARP Resolution Cycle", "BGP & OSPF Link State basics"] },
    { title: "Application Layer & Security", items: ["DNS Recursive vs Iterative resolution", "HTTP/2 Multiplexing vs HTTP/3 QUIC", "TLS 1.3 Handshake Protocol"] }
  ],
  lld: [
    { title: "Design Principles & Patterns", items: ["SOLID Principles Real World Violations", "Observer & Strategy Pattern Implementation", "Thread-Safe Singleton Drill"] },
    { title: "Machine Coding Exercises", items: ["Design Parking Lot System", "Design Rate Limiter (Token Bucket)", "Design Splitwise Expense Engine"] }
  ]
};

const COMPANY_PRESETS = {
  general: { name: "General SDE (FAANG / PBC)", dsaWeight: 1.0, treesGraphsBoost: false, lldBoost: false },
  amazon: { name: "Amazon", dsaWeight: 1.2, treesGraphsBoost: true, lldBoost: true, notes: "Heavily tests Trees, Graphs, and LLD / Leadership Principles" },
  microsoft: { name: "Microsoft", dsaWeight: 1.1, treesGraphsBoost: true, lldBoost: false, notes: "Emphasizes Strings, Arrays, Trees & OS fundamentals" },
  google: { name: "Google", dsaWeight: 1.4, treesGraphsBoost: true, lldBoost: false, notes: "High weight on Graphs, Complex DP, and Math optimizations" },
  startups: { name: "High-Growth Startups", dsaWeight: 0.9, treesGraphsBoost: false, lldBoost: true, notes: "Values Machine Coding, Schema Design, and Fast Problem Solving" }
};

function generateSchedule(settings: any): any {
  const {
    weeks = 8,
    dailyHours = 4,
    coreScheduleMode = "weekends", // "weekends" | "daily" | "alternate"
    selectedCores = ["os", "dbms", "cn"],
    targetCompany = "general",
    language = "Java",
    includeMockContests = true
  } = settings;

  const totalDays = weeks * 7;
  const companyPreset = (COMPANY_PRESETS as any)[targetCompany] || COMPANY_PRESETS.general;

  // Flatten available core subjects
  const coreTasksList: any[] = [];
  selectedCores.forEach((cKey: any) => {
    const list = (CORE_SUBJECTS_POOL as any)[cKey] || [];
    list.forEach((entry: any) => {
      coreTasksList.push({
        subject: cKey.toUpperCase(),
        title: entry.title,
        items: entry.items
      });
    });
  });

  const generatedWeeks: any[] = [];
  let dsaTopicIndex = 0;
  let coreTopicIndex = 0;
  let dayCounter = 1;

  for (let w = 1; w <= weeks; w++) {
    const weekDays = [];
    const currentDsaTopic = DSA_TOPICS_POOL[dsaTopicIndex % DSA_TOPICS_POOL.length];

    for (let d = 1; d <= 7; d++) {
      const isSaturday = (d === 6);
      const isSunday = (d === 7);
      const isBufferDay = isSunday;
      const dayTasks = [];

      // Determine Core CS presence based on mode
      let shouldIncludeCore = false;
      if (coreScheduleMode === "weekends") {
        shouldIncludeCore = isSaturday || isSunday;
      } else if (coreScheduleMode === "daily") {
        shouldIncludeCore = !isBufferDay;
      } else if (coreScheduleMode === "alternate") {
        shouldIncludeCore = (d % 2 === 0);
      }

      const totalMins = dailyHours * 60;

      // 1. Buffer & Spaced Revision Day (Sunday)
      if (isBufferDay) {
        dayTasks.push({
          id: `task-${dayCounter}-buffer`,
          track: "Buffer & Consolidation",
          title: "Weekly Backlog Clearance & Spaced Review",
          subject: "Retention Engine",
          details: ["Clear flagged 'Struggled' problems", "Deep dive into week's missed concept notes", "Re-solve weak spot bookmarks"],
          timeMins: shouldIncludeCore ? Math.round(totalMins * 0.6) : totalMins,
          confidence: null,
          completed: false,
          isBacklogEligible: false
        });

        if (shouldIncludeCore && coreTasksList.length > 0) {
          const coreItem = coreTasksList[coreTopicIndex % coreTasksList.length];
          coreTopicIndex++;
          dayTasks.push({
            id: `task-${dayCounter}-core-weekend`,
            track: "Core CS",
            title: `${coreItem.subject}: ${coreItem.title}`,
            subject: coreItem.subject,
            details: coreItem.items,
            timeMins: Math.round(totalMins * 0.4),
            confidence: null,
            completed: false,
            isBacklogEligible: true
          });
        }
      }
      // 2. Saturday - Timed Contest or Deep Core Sprint
      else if (isSaturday && includeMockContests) {
        dayTasks.push({
          id: `task-${dayCounter}-contest`,
          track: "Mock Contest",
          title: `Timed 90-Min Sprint (${companyPreset.name} Style)`,
          subject: "Pressure Simulation",
          details: ["1 Easy warmup (15 mins)", "1 Medium Core question (35 mins)", "1 Hard Pattern / Graph / DP (40 mins)"],
          timeMins: 90,
          confidence: null,
          completed: false,
          isBacklogEligible: true
        });

        if (shouldIncludeCore && coreTasksList.length > 0) {
          const coreItem = coreTasksList[coreTopicIndex % coreTasksList.length];
          coreTopicIndex++;
          dayTasks.push({
            id: `task-${dayCounter}-core-sat`,
            track: "Core CS",
            title: `${coreItem.subject}: ${coreItem.title}`,
            subject: coreItem.subject,
            details: coreItem.items,
            timeMins: Math.max(60, totalMins - 90),
            confidence: null,
            completed: false,
            isBacklogEligible: true
          });
        } else {
          // If not core, additional DSA review
          dayTasks.push({
            id: `task-${dayCounter}-dsa-sat`,
            track: "DSA",
            title: `${currentDsaTopic.topic} Advanced Edge Cases`,
            subject: `Striver Sheet (${language})`,
            details: ["Contest post-mortem & editorial analysis", "Analyze edge-case memory bounds"],
            timeMins: Math.max(60, totalMins - 90),
            confidence: null,
            completed: false,
            isBacklogEligible: true
          });
        }
      }
      // 3. Regular Weekdays
      else {
        let dsaMins = totalMins;
        let coreMins = 0;

        if (shouldIncludeCore && coreTasksList.length > 0) {
          coreMins = Math.round(totalMins * 0.35);
          dsaMins = totalMins - coreMins;
        }

        // Questions from current pool
        const qOffset = (d - 1) % currentDsaTopic.questions.length;
        const qSubset = [
          currentDsaTopic.questions[qOffset],
          currentDsaTopic.questions[(qOffset + 1) % currentDsaTopic.questions.length]
        ];

        dayTasks.push({
          id: `task-${dayCounter}-dsa`,
          track: "DSA",
          title: `${currentDsaTopic.topic} Problem Set`,
          subject: `Striver A2Z (${language})`,
          details: qSubset,
          timeMins: dsaMins,
          confidence: null,
          completed: false,
          isBacklogEligible: true
        });

        if (shouldIncludeCore && coreTasksList.length > 0) {
          const coreItem = coreTasksList[coreTopicIndex % coreTasksList.length];
          coreTopicIndex++;
          dayTasks.push({
            id: `task-${dayCounter}-core`,
            track: "Core CS",
            title: `${coreItem.subject}: ${coreItem.title}`,
            subject: coreItem.subject,
            details: coreItem.items,
            timeMins: coreMins,
            confidence: null,
            completed: false,
            isBacklogEligible: true
          });
        }
      }

      weekDays.push({
        dayNumber: dayCounter,
        dayOfWeek: d,
        isBufferDay,
        isSaturday,
        allocatedMins: totalMins,
        tasks: dayTasks
      });

      dayCounter++;
    }

    generatedWeeks.push({
      weekNumber: w,
      weekFocus: `${currentDsaTopic.topic} + ${coreScheduleMode === "weekends" ? "Weekend Core CS" : "Parallel Core CS"}`,
      days: weekDays
    });

    dsaTopicIndex++;
  }

  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      targetCompany: companyPreset.name,
      language,
      totalWeeks: weeks,
      totalDays,
      dailyHours,
      coreScheduleMode,
      selectedCores
    },
    weeks: generatedWeeks
  };
}

export default function App() {
  const [settings, setSettings] = useState({
    weeks: 8,
    dailyHours: 4,
    coreScheduleMode: "weekends", // "weekends" | "daily" | "alternate"
    selectedCores: ["os", "dbms", "cn"],
    targetCompany: "general",
    language: "Java",
    includeMockContests: true
  });

  const [plan, setPlan] = useState<any>(null);
  const [activeWeek, setActiveWeek] = useState(1);
  const [activeTab, setActiveTab] = useState("timeline"); // timeline | analytics | backlog | json
  const [trackFilter, setTrackFilter] = useState("all");
  const [notification, setNotification] = useState("");
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Initialize schedule on component load
  useEffect(() => {
    const initial = generateSchedule(settings);
    setPlan(initial);
  }, []);

  const triggerNotification = (text: string) => {
    setNotification(text);
    setTimeout(() => setNotification(""), 4500);
  };

  const handleRegenerate = () => {
    const freshPlan = generateSchedule(settings);
    setPlan(freshPlan);
    setActiveWeek(1);
    triggerNotification(`Generated new ${settings.weeks}-week plan! Core subjects scheduled via '${settings.coreScheduleMode}' mode.`);
  };

  const updateTask = (taskId: string, updates: any) => {
    if (!plan) return;

    let flaggedForSpacedRepetition: any = null;

    const newWeeks = plan.weeks.map((w: any) => ({
      ...w,
      days: w.days.map((d: any) => ({
        ...d,
        tasks: d.tasks.map((t: any) => {
          if (t.id === taskId) {
            const nextTask = { ...t, ...updates };
            if (updates.confidence === "struggled") {
              flaggedForSpacedRepetition = {
                originDay: d.dayNumber,
                title: t.title,
                track: t.track
              };
            }
            return nextTask;
          }
          return t;
        })
      }))
    }));

    // If marked "struggled", schedule a spaced repetition reminder 3 days later
    if (flaggedForSpacedRepetition) {
      const targetDayNum = flaggedForSpacedRepetition.originDay + 3;
      newWeeks.forEach((w: any) => {
        w.days.forEach((d: any) => {
          if (d.dayNumber === targetDayNum) {
            d.tasks.push({
              id: `revisit-${Date.now()}`,
              track: "Spaced Repetition",
              title: `[Re-attempt Drill] ${flaggedForSpacedRepetition.title}`,
              subject: "Confidence Booster",
              details: ["Re-code solution with clean intuition", "No looking at hints/editorials this time"],
              timeMins: 30,
              confidence: null,
              completed: false,
              isBacklogEligible: true
            });
          }
        });
      });
      triggerNotification(`Flagged as 'Struggled'. Planly scheduled a spaced re-attempt on Day ${targetDayNum}!`);
    }

    setPlan({ ...plan, weeks: newWeeks });
  };

  const metrics = useMemo(() => {
    if (!plan) return { totalTasks: 0, completedTasks: 0, backlogList: [], completionPct: 0, debtHours: 0, struggledCount: 0, dsaCount: 0, coreCount: 0 };

    let total = 0;
    let completed = 0;
    let struggled = 0;
    let dsa = 0;
    let core = 0;
    const backlog: any[] = [];
    let backlogMins = 0;

    plan.weeks.forEach((w: any) => {
      w.days.forEach((d: any) => {
        d.tasks.forEach((t: any) => {
          total++;
          if (t.track === "DSA") dsa++;
          if (t.track === "Core CS") core++;

          if (t.completed) {
            completed++;
            if (t.confidence === "struggled") struggled++;
          } else if (t.isBacklogEligible && d.dayNumber <= 14) {
            // Unfinished tasks in early days treated as real backlog debt
            backlog.push({ ...t, dayNumber: d.dayNumber, weekNumber: w.weekNumber });
            backlogMins += t.timeMins;
          }
        });
      });
    });

    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const debtHours = (backlogMins / 60).toFixed(1);

    return {
      totalTasks: total,
      completedTasks: completed,
      backlogList: backlog,
      completionPct,
      debtHours,
      struggledCount: struggled,
      dsaCount: dsa,
      coreCount: core
    };
  }, [plan]);

  const handleIntelligentRebalance = () => {
    if (!plan || metrics.backlogList.length === 0) {
      triggerNotification("No overdue tasks detected in the backlog queue. Schedule is currently optimal!");
      return;
    }

    const pendingTasks = [...metrics.backlogList];
    const newWeeks = plan.weeks.map((w: any) => ({
      ...w,
      days: w.days.map((d: any) => ({
        ...d,
        tasks: [...d.tasks]
      }))
    }));

    let rebalancedCount = 0;

    // Distribute into future buffer days (Sundays) and Saturday slots
    newWeeks.forEach((w: any) => {
      w.days.forEach((d: any) => {
        if ((d.isBufferDay || d.isSaturday) && pendingTasks.length > 0 && d.dayNumber > 7) {
          const moveTask = pendingTasks.shift();
          d.tasks.push({
            id: `rebalanced-${Date.now()}-${rebalancedCount}`,
            track: moveTask.track,
            title: `[Rebalanced] ${moveTask.title}`,
            subject: `Backlog from Day ${moveTask.dayNumber}`,
            details: moveTask.details,
            timeMins: 45,
            confidence: null,
            completed: false,
            isBacklogEligible: false
          });
          rebalancedCount++;
        }
      });
    });

    setPlan({ ...plan, weeks: newWeeks });
    triggerNotification(`Intelligent Rebalance complete: ${rebalancedCount} tasks redistributed across upcoming weekend slots!`);
  };

  const handleDownloadJSON = () => {
    if (!plan) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(plan, null, 2));
    const dlNode = document.createElement("a");
    dlNode.setAttribute("href", dataStr);
    dlNode.setAttribute("download", `planly_${settings.coreScheduleMode}_${settings.targetCompany}.json`);
    document.body.appendChild(dlNode);
    dlNode.click();
    dlNode.remove();
  };

  const handleCopyJSON = () => {
    if (!plan) return;
    navigator.clipboard.writeText(JSON.stringify(plan, null, 2));
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2200);
  };

  const handleUploadJSON = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt: any) => {
      try {
        const loaded = JSON.parse(evt.target?.result as string);
        if (loaded.weeks && loaded.metadata) {
          setPlan(loaded);
          setSettings(prev => ({
            ...prev,
            weeks: loaded.metadata.totalWeeks || prev.weeks,
            dailyHours: loaded.metadata.dailyHours || prev.dailyHours,
            coreScheduleMode: loaded.metadata.coreScheduleMode || prev.coreScheduleMode,
            targetCompany: loaded.metadata.targetCompany || prev.targetCompany,
            language: loaded.metadata.language || prev.language
          }));
          triggerNotification("Successfully imported and loaded custom Planly JSON roadmap!");
        }
      } catch (err) {
        triggerNotification("Error: Invalid JSON roadmap format.");
      }
    };
    reader.readAsText(file);
  };

  const currentWeek = plan?.weeks.find((w: any) => w.weekNumber === activeWeek);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans flex flex-col antialiased selection:bg-emerald-500/30 selection:text-emerald-300">

      {/* Top Bar */}
      <header className="border-b border-slate-800/80 bg-[#0b101c]/90 backdrop-blur sticky top-0 z-30 px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-5 h-5 text-black font-extrabold" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base tracking-tight text-white">Planly AI</span>
              <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">
                Adaptive v2.4
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">DSA & Core CS Parallel SDE Sprint Engine</p>
          </div>
        </div>

        {/* Global Progress Metrics */}
        <div className="flex items-center space-x-3">
          <div className="hidden lg:flex items-center space-x-3 px-3 py-1.5 rounded-xl bg-[#0f172a] border border-slate-800 text-xs">
            <div className="flex items-center space-x-1.5 text-amber-400 font-mono">
              <TrendingDown className="w-4 h-4" />
              <span>Debt: {metrics.debtHours}h</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center space-x-1.5 text-emerald-400 font-mono">
              <CheckCircle2 className="w-4 h-4" />
              <span>{metrics.completedTasks}/{metrics.totalTasks} Done ({metrics.completionPct}%)</span>
            </div>
          </div>

          <button
            onClick={handleDownloadJSON}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
            title="Download Planly JSON"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Export JSON</span>
          </button>

          <label className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/80 text-xs font-medium cursor-pointer transition">
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Import</span>
            <input type="file" accept=".json" onChange={handleUploadJSON} className="hidden" />
          </label>
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div className="bg-emerald-950/90 border-b border-emerald-500/30 text-emerald-300 px-4 py-2 text-xs text-center flex items-center justify-center space-x-2 animate-fadeIn sticky top-[53px] z-20">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Engine Setup & Strategic Options (4 Cols) */}
        <aside className="lg:col-span-4 space-y-5">
          <div className="bg-[#0e1422] border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">Planly Preferences</h2>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Engine Active
              </span>
            </div>

            <div className="space-y-4 text-xs">

              {/* NEW REQUESTED FEATURE 1: Core Subject Scheduling Policy */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-300 font-medium">Core Subject Scheduling Mode</label>
                  <span className="text-[10px] text-cyan-400 font-mono">User Config</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "weekends", label: "Weekends Only", desc: "Mon-Fri: 100% DSA. Sat/Sun: Core CS" },
                    { id: "daily", label: "Daily Balanced", desc: "DSA + Core everyday" },
                    { id: "alternate", label: "Alternate Days", desc: "Mon/Wed/Fri DSA, Tue/Thu Core" }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setSettings({ ...settings, coreScheduleMode: mode.id })}
                      className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center ${settings.coreScheduleMode === mode.id
                          ? "bg-emerald-500/15 border-emerald-500 text-emerald-300 font-semibold shadow-sm"
                          : "bg-[#141b2d] border-slate-700/70 text-slate-400 hover:text-slate-200"
                        }`}
                    >
                      <span className="text-[11px]">{mode.label}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400 leading-tight">
                  {settings.coreScheduleMode === "weekends" && "✨ Weekdays are 100% dedicated to DSA problem-solving. Core CS is scheduled only on Saturday & Sunday."}
                  {settings.coreScheduleMode === "daily" && "✨ Everyday receives an even split between DSA problem drills and Core CS conceptual questions."}
                  {settings.coreScheduleMode === "alternate" && "✨ Focus rotates between deep algorithmic immersion days and Core CS theory days."}
                </p>
              </div>

              {/* Company Targeting Filter */}
              <div>
                <label className="text-slate-300 font-medium block mb-1.5">Target Company Profile</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(COMPANY_PRESETS).map(([key, data]) => (
                    <button
                      key={key}
                      onClick={() => setSettings({ ...settings, targetCompany: key })}
                      className={`px-2.5 py-2 rounded-lg border text-left transition flex items-center space-x-2 ${settings.targetCompany === key
                          ? "bg-cyan-500/15 border-cyan-500 text-cyan-200 font-semibold"
                          : "bg-[#141b2d] border-slate-700/60 text-slate-400 hover:border-slate-600"
                        }`}
                    >
                      <Building2 className={`w-3.5 h-3.5 ${settings.targetCompany === key ? "text-cyan-400" : "text-slate-500"}`} />
                      <span className="text-[11px] truncate">{data.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeline & Commitment */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1.5">Sprint Duration</label>
                  <div className="grid grid-cols-3 gap-1 bg-[#141b2d] p-1 rounded-lg border border-slate-700">
                    {[4, 8, 12].map((w) => (
                      <button
                        key={w}
                        onClick={() => setSettings({ ...settings, weeks: w })}
                        className={`py-1 text-center rounded font-mono text-xs transition ${settings.weeks === w ? "bg-emerald-500 text-black font-bold" : "text-slate-400 hover:text-white"
                          }`}
                      >
                        {w}w
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1.5">Daily Commitment</label>
                  <div className="grid grid-cols-3 gap-1 bg-[#141b2d] p-1 rounded-lg border border-slate-700">
                    {[2, 4, 6].map((hrs) => (
                      <button
                        key={hrs}
                        onClick={() => setSettings({ ...settings, dailyHours: hrs })}
                        className={`py-1 text-center rounded font-mono text-xs transition ${settings.dailyHours === hrs ? "bg-emerald-500 text-black font-bold" : "text-slate-400 hover:text-white"
                          }`}
                      >
                        {hrs}h
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Coding Language & Mock Contests Toggle */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1.5">DSA Language</label>
                  <select
                    value={settings.language}
                    onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                    className="w-full bg-[#141b2d] border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Java">Java (A2Z)</option>
                    <option value="C++">C++ (STL)</option>
                    <option value="Python">Python</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1.5">Sat Mock Contest</label>
                  <button
                    onClick={() => setSettings({ ...settings, includeMockContests: !settings.includeMockContests })}
                    className={`w-full py-1.5 px-2 rounded-lg border text-xs font-medium flex items-center justify-center space-x-1.5 transition ${settings.includeMockContests
                        ? "bg-purple-500/20 border-purple-500/60 text-purple-300"
                        : "bg-[#141b2d] border-slate-700 text-slate-500"
                      }`}
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>{settings.includeMockContests ? "Enabled (90m)" : "Disabled"}</span>
                  </button>
                </div>
              </div>

              {/* Core CS Inclusions */}
              <div>
                <label className="text-slate-300 font-medium block mb-1.5">Selected Core CS Tracks</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "os", label: "Operating Systems", icon: Cpu },
                    { id: "dbms", label: "DBMS & SQL", icon: Database },
                    { id: "cn", label: "Computer Networks", icon: Globe },
                    { id: "lld", label: "Low-Level Design", icon: Layers }
                  ].map((sub) => {
                    const isSelected = settings.selectedCores.includes(sub.id);
                    const SubIcon = sub.icon;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => {
                          if (isSelected) {
                            setSettings({ ...settings, selectedCores: settings.selectedCores.filter(x => x !== sub.id) });
                          } else {
                            setSettings({ ...settings, selectedCores: [...settings.selectedCores, sub.id] });
                          }
                        }}
                        className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border text-left transition ${isSelected ? "bg-slate-800 border-slate-600 text-slate-200" : "bg-[#141b2d]/60 border-slate-800 text-slate-500"
                          }`}
                      >
                        <SubIcon className={`w-3.5 h-3.5 ${isSelected ? "text-emerald-400" : "text-slate-500"}`} />
                        <span className="text-[11px] truncate">{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleRegenerate}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:opacity-95 text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/25 transition active:scale-[0.99]"
              >
                <Zap className="w-4 h-4 fill-black" />
                <span>Re-Simulate Planly Schedule</span>
              </button>
            </div>
          </div>

          {/* Strategic Addition: Backlog Velocity & Debt Meter */}
          <div className="bg-[#0e1422] border border-slate-800/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                <BrainCircuit className="w-4 h-4 text-amber-400" />
                <span>Backlog Debt Velocity</span>
              </h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${Number(metrics.debtHours) > 3 ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                }`}>
                {Number(metrics.debtHours) > 3 ? "Behind Pace" : "Sprint Healthy"}
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Total Accumulated Debt:</span>
                <span className="font-mono text-amber-400 font-bold">{metrics.debtHours} Hours</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Struggled Concepts Flagged:</span>
                <span className="font-mono text-purple-400 font-bold">{metrics.struggledCount} Items</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 h-2 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(5, (Number(metrics.debtHours) / (settings.dailyHours * 3)) * 100))}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                Planly warns you when debt exceeds 3 hours and suggests triggering the <span className="text-amber-300 font-medium">Intelligent Rebalancer</span>.
              </p>
            </div>
          </div>
        </aside>

        {/* RIGHT COLUMN: Interactive Views, Checklists, Analytics & Export (8 Cols) */}
        <main className="lg:col-span-8 flex flex-col space-y-5">

          {/* View Tab Navigators */}
          <div className="bg-[#0e1422] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-1 bg-[#141b2d] p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab("timeline")}
                className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${activeTab === "timeline" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                  }`}
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sprint Timeline</span>
              </button>

              <button
                onClick={() => setActiveTab("analytics")}
                className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${activeTab === "analytics" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                  }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Analytics & Split</span>
              </button>

              <button
                onClick={() => setActiveTab("backlog")}
                className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition relative ${activeTab === "backlog" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                  }`}
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Backlog ({metrics.backlogList.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("json")}
                className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${activeTab === "json" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                  }`}
              >
                <FileJson className="w-3.5 h-3.5 text-purple-400" />
                <span>JSON Export</span>
              </button>
            </div>

            {/* Filter by track in timeline mode */}
            {activeTab === "timeline" && (
              <div className="flex items-center space-x-2 self-end sm:self-auto">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs text-slate-400">Track:</span>
                <select
                  value={trackFilter}
                  onChange={(e) => setTrackFilter(e.target.value)}
                  className="bg-[#141b2d] border border-slate-700 text-slate-300 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  <option value="all">All Tracks</option>
                  <option value="dsa">DSA Problems Only</option>
                  <option value="core">Core CS Only</option>
                  <option value="contest">Mock Contests</option>
                </select>
              </div>
            )}
          </div>

          {/* TAB 1: SPRINT TIMELINE & INTERACTIVE CHECKLIST */}
          {activeTab === "timeline" && plan && (
            <div className="space-y-4">

              {/* Week Navigation Header */}
              <div className="bg-[#0e1422] border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setActiveWeek(prev => Math.max(1, prev - 1))}
                    disabled={activeWeek === 1}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <span>Week {activeWeek} of {plan.metadata.totalWeeks}</span>
                      <span className="text-xs font-normal text-emerald-400 font-mono">({currentWeek?.weekFocus})</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Core Strategy: <span className="text-cyan-300 uppercase font-semibold">{settings.coreScheduleMode}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {plan.weeks.map((w: any) => (
                      <button
                        key={w.weekNumber}
                        onClick={() => setActiveWeek(w.weekNumber)}
                        className={`w-7 h-7 rounded-lg text-xs font-mono font-medium transition ${activeWeek === w.weekNumber
                            ? "bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20"
                            : "bg-[#141b2d] text-slate-400 hover:text-slate-200 border border-slate-800"
                          }`}
                      >
                        W{w.weekNumber}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setActiveWeek(prev => Math.min(plan.metadata.totalWeeks, prev + 1))}
                    disabled={activeWeek === plan.metadata.totalWeeks}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day Cards for Active Week */}
              <div className="space-y-3">
                {currentWeek?.days.map((day: any) => {
                  const filteredTasks = day.tasks.filter((t: any) => {
                    if (trackFilter === "dsa") return t.track === "DSA";
                    if (trackFilter === "core") return t.track === "Core CS";
                    if (trackFilter === "contest") return t.track === "Mock Contest";
                    return true;
                  });

                  return (
                    <div
                      key={day.dayNumber}
                      className={`border rounded-2xl p-4 transition ${day.isBufferDay
                          ? "bg-[#101726]/90 border-purple-500/30"
                          : day.isSaturday
                            ? "bg-[#0e1628]/90 border-cyan-500/30"
                            : "bg-[#0e1422] border-slate-800 hover:border-slate-700/80"
                        }`}
                    >
                      {/* Day Header */}
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/60">
                        <div className="flex items-center space-x-2.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${day.isBufferDay
                              ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                              : day.isSaturday
                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                                : "bg-slate-800 text-slate-300"
                            }`}>
                            Day {day.dayNumber}
                          </span>
                          <span className="text-xs text-slate-300 font-medium">
                            {day.isBufferDay
                              ? "Sunday: Planly Buffer & Spaced Consolidation"
                              : day.isSaturday
                                ? "Saturday: Timed Sprint & Weekend Core CS"
                                : `Weekday ${day.dayOfWeek} (Focus: DSA Problem Set)`}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{day.allocatedMins} mins</span>
                        </div>
                      </div>

                      {/* Tasks Checklist Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredTasks.length === 0 ? (
                          <div className="col-span-2 py-3 text-center text-xs text-slate-500 italic">
                            No tasks matching active track filter for Day {day.dayNumber}.
                          </div>
                        ) : (
                          filteredTasks.map((task: any) => (
                            <div
                              key={task.id}
                              className={`p-3 rounded-xl border transition flex flex-col justify-between ${task.completed
                                  ? "bg-emerald-950/20 border-emerald-500/30"
                                  : "bg-[#141b2d] border-slate-700/60"
                                }`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1.5">
                                  <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${task.track === "DSA"
                                      ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                                      : task.track === "Core CS"
                                        ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                                        : task.track === "Mock Contest"
                                          ? "bg-purple-500/10 text-purple-300 border border-purple-500/20"
                                          : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                                    }`}>
                                    {task.track}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400">{task.timeMins} mins</span>
                                </div>

                                <div className="flex items-start space-x-2">
                                  <button
                                    onClick={() => updateTask(task.id, { completed: !task.completed })}
                                    className="mt-0.5 text-slate-500 hover:text-emerald-400 transition"
                                  >
                                    {task.completed ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    ) : (
                                      <Circle className="w-4 h-4" />
                                    )}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <h4 className={`text-xs font-semibold ${task.completed ? "line-through text-slate-400" : "text-slate-100"}`}>
                                      {task.title}
                                    </h4>
                                    <ul className="mt-1 space-y-0.5">
                                      {task.details.map((item: any, idx: number) => (
                                        <li key={idx} className="text-[11px] text-slate-400 flex items-center space-x-1.5 truncate">
                                          <span className="w-1 h-1 rounded-full bg-slate-500 shrink-0"></span>
                                          <span className="truncate">{item}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>

                              {/* Interactive Confidence Rating for Spaced Repetition */}
                              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                                <span className="text-[10px] text-slate-500">Confidence:</span>
                                <div className="flex items-center space-x-1">
                                  {[
                                    { id: "clean", label: "Clean", color: "hover:bg-emerald-500/20 hover:text-emerald-300" },
                                    { id: "hint", label: "Needed Hint", color: "hover:bg-amber-500/20 hover:text-amber-300" },
                                    { id: "struggled", label: "Struggled", color: "hover:bg-rose-500/20 hover:text-rose-300" }
                                  ].map((lvl) => (
                                    <button
                                      key={lvl.id}
                                      onClick={() => updateTask(task.id, { completed: true, confidence: lvl.id })}
                                      className={`px-1.5 py-0.5 rounded text-[10px] transition ${task.confidence === lvl.id
                                          ? "bg-slate-700 text-white font-bold border border-slate-600"
                                          : `text-slate-400 ${lvl.color}`
                                        }`}
                                    >
                                      {lvl.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: ANALYTICAL DASHBOARD & SPLIT VIEW */}
          {activeTab === "analytics" && (
            <div className="bg-[#0e1422] border border-slate-800 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <span>Curriculum Allocation & Preparation Velocity</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visual breakdown of hours, subject distribution, and candidate confidence distribution.
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#141b2d] border border-slate-700/60 p-4 rounded-xl">
                  <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">DSA Question Track</span>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{metrics.dsaCount} Problems</div>
                  <span className="text-[10px] text-slate-500">Striver A2Z Sheet progression</span>
                </div>

                <div className="bg-[#141b2d] border border-slate-700/60 p-4 rounded-xl">
                  <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">Core CS Modules</span>
                  <div className="text-xl font-bold font-mono text-cyan-400 mt-1">{metrics.coreCount} Drills</div>
                  <span className="text-[10px] text-slate-500">Scheduled via: {settings.coreScheduleMode}</span>
                </div>

                <div className="bg-[#141b2d] border border-slate-700/60 p-4 rounded-xl">
                  <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">Struggled (Spaced Queue)</span>
                  <div className="text-xl font-bold font-mono text-purple-400 mt-1">{metrics.struggledCount} Items</div>
                  <span className="text-[10px] text-slate-500">Scheduled for 3-day revisit</span>
                </div>
              </div>

              {/* Time Split Representation */}
              <div className="bg-[#141b2d] border border-slate-700/60 p-4 rounded-xl space-y-3">
                <h4 className="text-xs font-semibold text-slate-200">Study Hours Time Distribution (Weekly Average)</h4>

                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>DSA Coding & Algorithmic Patterns</span>
                      <span className="font-mono text-emerald-400 font-semibold">{settings.coreScheduleMode === "weekends" ? "71%" : "60%"}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: settings.coreScheduleMode === "weekends" ? "71%" : "60%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Core CS (OS, DBMS, Networks, LLD)</span>
                      <span className="font-mono text-cyan-400 font-semibold">{settings.coreScheduleMode === "weekends" ? "19%" : "25%"}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div className="bg-cyan-500 h-2 rounded-full" style={{ width: settings.coreScheduleMode === "weekends" ? "19%" : "25%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Mock Contests & Buffer Consolidation</span>
                      <span className="font-mono text-purple-400 font-semibold">10% - 15%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: "15%" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BACKLOG MANAGEMENT & INTELLIGENT REBALANCER */}
          {activeTab === "backlog" && (
            <div className="bg-[#0e1422] border border-slate-800 rounded-2xl p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Backlog Queue & Intelligent Rebalancing</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Missed tasks accumulate here. Planly can automatically inject them into upcoming weekend/buffer slots without inflating weekday hours.
                  </p>
                </div>
                <button
                  onClick={handleIntelligentRebalance}
                  disabled={metrics.backlogList.length === 0}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold text-xs flex items-center justify-center space-x-2 transition shadow-lg shadow-amber-500/20"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-black" />
                  <span>Execute Intelligent Rebalance</span>
                </button>
              </div>

              {metrics.backlogList.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-semibold text-slate-200">Zero Backlog Debt</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    All scheduled tasks are up-to-date. You are perfectly in sync with your sprint milestones!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {metrics.backlogList.map((t, idx) => (
                    <div key={idx} className="bg-[#141b2d] border border-slate-700/80 rounded-xl p-3.5 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
                            Day {t.dayNumber} · Week {t.weekNumber}
                          </span>
                          <span className="text-xs font-semibold text-slate-200">{t.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {t.details.join(", ")}
                        </p>
                      </div>
                      <button
                        onClick={() => updateTask(t.id, { completed: true })}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-emerald-950/70 hover:text-emerald-300 text-slate-300 text-xs border border-slate-700 transition"
                      >
                        Mark Completed
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: JSON PREVIEW & EXPORT */}
          {activeTab === "json" && plan && (
            <div className="bg-[#0e1422] border border-slate-800 rounded-2xl p-5 flex flex-col space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase font-mono">
                    planly_{settings.coreScheduleMode}_schedule.json
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopyJSON}
                    className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition"
                  >
                    {copyFeedback ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copyFeedback ? "Copied!" : "Copy JSON"}</span>
                  </button>
                  <button
                    onClick={handleDownloadJSON}
                    className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-xs text-black font-semibold transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <pre className="bg-[#070b14] p-4 rounded-xl text-slate-300 font-mono text-[11px] overflow-auto max-h-[520px] leading-relaxed border border-slate-800 selection:bg-cyan-500/30 selection:text-cyan-200">
                  {JSON.stringify(plan, null, 2)}
                </pre>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}