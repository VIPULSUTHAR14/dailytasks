export type Status = "Not Started" | "In Progress" | "Mastered";

export interface Topic {
    name: string;
    subtopics: string[];
}

export interface Category {
    category: string;
    subtitle: string;
    weightage: "Medium" | "High" | "Very High";
    topics: Topic[];
    footerNote?: {
        type: "benchmark" | "warning";
        title: string;
        desc: string;
    };
}

export const APTITUDE_DATA: Category[] = [
    {
        category: "Quantitative Aptitude",
        subtitle: "Core Math Foundations",
        weightage: "High",
        topics: [
            {
                name: "Arithmetic",
                subtopics: ["Percentages", "Profit & Loss", "Simple/Compound Interest", "Time and Work"]
            },
            {
                name: "Time & Motion",
                subtopics: ["Time, Speed, and Distance", "Pipes and Cisterns", "Relative Speed", "Boats and Streams"]
            },
            {
                name: "Modern Math",
                subtopics: ["Permutation and Combination", "Probability Distributions", "Number Properties"]
            },
            {
                name: "Data Interpretation",
                subtopics: ["Bar Graphs & Charts", "Tabular Analysis"]
            }
        ]
    },
    {
        category: "Logical Reasoning",
        subtitle: "Deductive & Spatial Logic",
        weightage: "High",
        topics: [
            {
                name: "Arrangements",
                subtopics: ["Linear Seating", "Circular Seating", "Matrix Match"]
            },
            {
                name: "Relational Logic",
                subtopics: ["Blood Relations", "Direction Sense"]
            },
            {
                name: "Critical Thinking",
                subtopics: ["Data Sufficiency", "Assumptions & Inferences"]
            },
            {
                name: "Series & Patterns",
                subtopics: ["Number Series", "Symbol Coding", "Odd One Out"]
            }
        ]
    },
    {
        category: "Verbal Ability",
        subtitle: "Communication & Grammar",
        weightage: "Medium",
        topics: [
            {
                name: "Comprehension",
                subtopics: ["Reading Passages", "Theme Detection"]
            },
            {
                name: "Grammar & Usage",
                subtopics: ["Synonyms & Antonyms", "Cloze Test", "Contextual Usage"]
            }
        ],
        footerNote: {
            type: "benchmark",
            title: "Speed Benchmark",
            desc: "Aim for 220+ WPM with 85% accuracy on Tier-1 reading passages."
        }
    },
    {
        category: "Programming Logic",
        subtitle: "Technical Screening Aptitude",
        weightage: "Very High",
        topics: [
            {
                name: "Pseudocode Analysis",
                subtopics: ["Dry Running Loops", "Conditionals & Logic Gates", "Recursion Depth & Call Stack"]
            },
            {
                name: "Algorithmic Complexity",
                subtopics: ["Big O Notation & Growth", "Auxiliary Space Complexity"]
            }
        ],
        footerNote: {
            type: "warning",
            title: "ASSESSMENT WARNING",
            desc: "Bitwise logic & loop dry runs carry highest elimination weightage in OT rounds."
        }
    }
];
