import { CompanyPreset, ProblemDifficulty, ProblemMetadata, TargetCompanyKey, UserDiagnostic } from "./types";
import rawDsaQuestions from "../data/dsaQuesions.json";

export interface DsaTopicCategory {
  topic: string;
  tag: string;
  prerequisites: string[];
  questions: ProblemMetadata[];
  id?: string;
}

const TAG_MAP: Record<string, string> = {
  "maths": "maths",
  "sorting": "sorting",
  "arrays-strings": "arrays",
  "binary-search": "bs",
  "recursion-backtracking": "backtracking",
  "bit-manipulation": "bit",
  "greedy": "greedy",
  "linked-list": "ll",
  "stacks-queues": "stack",
  "sliding-window": "window",
  "trees": "trees",
  "binary-search-trees": "bst",
  "heaps": "heaps",
  "graphs": "graphs",
  "dynamic-programming": "dp",
  "tries": "tries",
  "string-algorithms": "strings"
};

interface RawQuestion {
  name: string;
  difficulty?: string;
  url?: string;
  videoUrl?: string;
  hint?: string;
  description?: string;
  pattern?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
}

interface RawCategory {
  id: string;
  name: string;
  prerequisites?: string[];
  questions?: RawQuestion[];
}

export const DSA_TOPICS_POOL: DsaTopicCategory[] = (rawDsaQuestions as RawCategory[]).map((category) => {
  const mappedTag = TAG_MAP[category.id] || category.id;
  const questions: ProblemMetadata[] = (category.questions || []).map((q: RawQuestion) => ({
    title: q.name,
    difficulty: (q.difficulty as ProblemDifficulty) || "Medium",
    leetcodeUrl: q.url || "https://leetcode.com",
    videoUrl: q.videoUrl || "",
    intuitionHint: q.hint || q.description || "",
    pattern: q.pattern || "",
    timeComplexity: q.timeComplexity || "",
    spaceComplexity: q.spaceComplexity || "",
    topicId: category.id,
    description: q.description || ""
  }));

  return {
    topic: category.name,
    tag: mappedTag,
    id: category.id,
    prerequisites: category.prerequisites || [],
    questions
  };
});

/**
 * Look up the video solution URL for a question by its name/title.
 * Handles prefixes like "[Fresh Challenge] " or "Arrays & Strings: "
 */
export function getVideoUrlForQuestion(title?: string): string | undefined {
  if (!title) return undefined;
  const cleaned = title
    .replace(/^\[.*?\]\s*/, "")
    .split(":")
    .pop()
    ?.trim()
    .toLowerCase() || title.trim().toLowerCase();

  for (const cat of DSA_TOPICS_POOL) {
    for (const q of cat.questions) {
      if (q.title.trim().toLowerCase() === cleaned && q.videoUrl && q.videoUrl.trim()) {
        return q.videoUrl;
      }
    }
  }
  return undefined;
}

export const CORE_SUBJECTS_POOL = {
  dbms: [
    { title: "ACID & Transactions", items: ["Dirty Read & Non-repeatable Read", "Serializability & Conflict Equivalence", "2-Phase Locking Protocol (2PL)"] },
    { title: "Normalization & Functional Dependencies", items: ["1NF, 2NF, 3NF vs BCNF decompositions", "Lossless-Join & Dependency Preservation", "Anomalies in Unnormalized Schemas"] },
    { title: "Indexing & SQL Query Optimization", items: ["B-Tree vs B+ Tree internals", "Clustered vs Non-clustered indexing", "Explain Plan query analysis & table scans"] }
  ],
  os: [
    { title: "Process Scheduling & Concurrency", items: ["Round Robin & Multilevel Queue", "Race Conditions & Mutex vs Semaphores", "Context Switching Overhead & CPU affinity"] },
    { title: "Deadlocks & Peterson's Solution", items: ["Banker's Algorithm & Resource Request", "Deadlock Prevention vs Avoidance", "Dining Philosophers Synchronization"] },
    { title: "Virtual Memory & Paging", items: ["Page Faults & TLB Miss Latency", "LRU Page Replacement Algorithm", "Inverted Page Tables & Thrashing"] }
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

export const COMPANY_PRESETS: Record<TargetCompanyKey, CompanyPreset> = {
  general: {
    name: "General SDE (FAANG / PBC)",
    dsaWeight: 1.0,
    treesGraphsBoost: false,
    lldBoost: false,
    dpBoost: false,
    notes: "Balanced preparation covering standard Striver A2Z topics and core CS fundamentals."
  },
  amazon: {
    name: "Amazon",
    dsaWeight: 1.2,
    treesGraphsBoost: true,
    lldBoost: true,
    dpBoost: false,
    notes: "Heavily tests Trees, Graphs, and Low-Level Object Oriented Design alongside Leadership Principles."
  },
  microsoft: {
    name: "Microsoft",
    dsaWeight: 1.1,
    treesGraphsBoost: true,
    lldBoost: false,
    dpBoost: false,
    notes: "Emphasizes Strings, Arrays, Trees, Recursion, and Operating Systems fundamentals."
  },
  google: {
    name: "Google",
    dsaWeight: 1.4,
    treesGraphsBoost: true,
    lldBoost: false,
    dpBoost: true,
    notes: "High weight on Graphs, Complex Multi-Dimensional DP, and algorithmic edge-case math."
  },
  startups: {
    name: "High-Growth Startups",
    dsaWeight: 0.9,
    treesGraphsBoost: false,
    lldBoost: true,
    dpBoost: false,
    notes: "Values fast Problem Solving, Schema Design, Concurrency, and Machine Coding."
  }
};

export const DEFAULT_DIAGNOSTIC: UserDiagnostic = {
  arrays: 4,
  trees: 3,
  graphs: 2,
  dp: 2,
  systemDesign: 3
};

export const TOPIC_PREREQUISITES: Record<string, string[]> = {
  "binary-search-trees": ["trees", "binary-search"],
  "dynamic-programming": ["recursion-backtracking"],
  "graphs": ["trees", "stacks-queues", "recursion-backtracking"],
  "heaps": ["trees"],
  "sliding-window": ["arrays-strings"],
  "tries": ["trees", "arrays-strings"]
};

export interface ResolvedTopic {
  id: string;
  tag: string;
  kind: "dsa" | "core";
  name: string;
}

const CORE_NAMES: Record<string, string> = {
  dbms: "Database Management Systems (DBMS)",
  os: "Operating Systems (OS)",
  cn: "Computer Networks (CN)",
  lld: "Low-Level Object Oriented Design (LLD)"
};

export function resolveTopic(idOrTag: string): ResolvedTopic | null {
  if (!idOrTag) return null;
  const clean = idOrTag.trim().toLowerCase();

  // Check Core CS first
  if (CORE_NAMES[clean] || CORE_SUBJECTS_POOL[clean as keyof typeof CORE_SUBJECTS_POOL]) {
    return {
      id: clean,
      tag: clean,
      kind: "core",
      name: CORE_NAMES[clean] || clean.toUpperCase()
    };
  }

  // Check DSA Topics by id, tag, or topic name
  for (const item of DSA_TOPICS_POOL) {
    if (
      (item.id && item.id.toLowerCase() === clean) ||
      (item.tag && item.tag.toLowerCase() === clean) ||
      item.topic.toLowerCase() === clean
    ) {
      return {
        id: item.id || item.tag,
        tag: item.tag,
        kind: "dsa",
        name: item.topic
      };
    }
  }

  return null;
}
