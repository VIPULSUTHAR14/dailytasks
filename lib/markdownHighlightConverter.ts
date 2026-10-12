/**
 * Markdown Highlight Converter
 *
 * Converts between legacy AlgoCraft markdown highlight syntax:
 *   ==r:text==  (Rose / Bug / Critical)
 *   ==g:text==  (Emerald / Optimal Insight)
 *   ==b:text==  (Sky / Std Library)
 *   ==y:text==  (Amber / Follow-up)
 *   ==p:text==  (Purple / Formula)
 *   ==text==    (Amber fallback)
 *
 * And TipTap-compatible HTML mark tags:
 *   <mark data-color="#f43f5e">text</mark>
 *   <mark data-color="#10b981">text</mark>
 *   <mark data-color="#06b6d4">text</mark>
 *   <mark data-color="#f59e0b">text</mark>
 *   <mark data-color="#a855f7">text</mark>
 *
 * Preserves code blocks, inline code, and Mermaid diagrams intact.
 */

import { sanitizeHtml } from "@/lib/sanitize";

export const COLOR_MAP_TO_RICH: Record<string, string> = {
    r: "#f43f5e",
    red: "#f43f5e",
    rose: "#f43f5e",
    g: "#10b981",
    green: "#10b981",
    emerald: "#10b981",
    b: "#06b6d4",
    blue: "#06b6d4",
    cyan: "#06b6d4",
    c: "#06b6d4",
    sky: "#06b6d4",
    y: "#f59e0b",
    yellow: "#f59e0b",
    amber: "#f59e0b",
    p: "#a855f7",
    purple: "#a855f7",
};

export const COLOR_MAP_TO_STORAGE: Record<string, string> = {
    "#f43f5e": "r",
    rose: "r",
    red: "r",
    "#10b981": "g",
    emerald: "g",
    green: "g",
    "#06b6d4": "b",
    sky: "b",
    blue: "b",
    cyan: "b",
    "#f59e0b": "y",
    amber: "y",
    yellow: "y",
    "#a855f7": "p",
    purple: "p",
};

/**
 * Temporarily shields fenced code blocks and inline code from conversion.
 */
function protectCodeSegments(markdown: string): {
    shielded: string;
    restore: (text: string) => string;
} {
    const codeSegments: string[] = [];

    // 1. Shield fenced code blocks (```...```) including language tags like ```mermaid, ```typescript, etc.
    let shielded = markdown.replace(/(```[\s\S]*?```)/g, (match) => {
        const id = `__SHIELDED_BLOCK_${codeSegments.length}__`;
        codeSegments.push(match);
        return id;
    });

    // 2. Shield inline code (`...`)
    shielded = shielded.replace(/(`[^`\n]+`)/g, (match) => {
        const id = `__SHIELDED_INLINE_${codeSegments.length}__`;
        codeSegments.push(match);
        return id;
    });

    const restore = (text: string): string => {
        let restored = text;
        for (let i = codeSegments.length - 1; i >= 0; i--) {
            restored = restored
                .replace(`__SHIELDED_BLOCK_${i}__`, () => codeSegments[i])
                .replace(`__SHIELDED_INLINE_${i}__`, () => codeSegments[i]);
        }
        return restored;
    };

    return { shielded, restore };
}

/**
 * Converts legacy ==r:text== syntax into TipTap-compatible <mark data-color="...">text</mark>
 * and sanitizes HTML to neutralize script and onerror payloads.
 */
export function legacyToRich(markdown: string): string {
    if (!markdown) return "";

    const { shielded, restore } = protectCodeSegments(markdown);

    // Regex for legacy highlights:
    // Either ==color:content== where content has at least 1 non-empty character,
    // or plain ==content== without a recognized color prefix.
    // Supports single = signs inside content (e.g., equations like ==p:dp[i] = dp[i-1]==)
    const legacyRegex = /==(?:(red|rose|r|green|emerald|g|blue|sky|cyan|b|c|yellow|amber|y|purple|p):((?:[^\n=]|=(?!=))+)|((?:[^\n=]|=(?!=))+))==/gi;

    const converted = shielded.replace(legacyRegex, (match, prefix, coloredContent, plainContent) => {
        const content = coloredContent ?? plainContent;
        if (!content || !content.trim()) return match;

        // If matched as plainContent but is actually an empty prefix like "r:", ignore it
        if (!prefix && /^(red|rose|r|green|emerald|g|blue|sky|cyan|b|c|yellow|amber|y|purple|p):$/i.test(plainContent.trim())) {
            return match;
        }

        let colorHex = "#f59e0b"; // default amber
        if (prefix) {
            const key = prefix.toLowerCase();
            if (COLOR_MAP_TO_RICH[key]) {
                colorHex = COLOR_MAP_TO_RICH[key];
            }
        }

        return `<mark data-color="${colorHex}">${content}</mark>`;
    });

    return sanitizeHtml(restore(converted));
}

/**
 * Converts TipTap <mark data-color="...">text</mark> back into legacy ==r:text== format.
 */
export function richToStorage(markdown: string): string {
    if (!markdown) return "";

    const { shielded, restore } = protectCodeSegments(markdown);

    // Matches <mark ...>content</mark>
    const markRegex = /<mark\b([^>]*)>([\s\S]*?)<\/mark>/gi;

    const converted = shielded.replace(markRegex, (match, attributes, content) => {
        // If content is empty, return empty
        if (!content) return "";

        let code = "y"; // default amber

        // Try extracting data-color
        const dataColorMatch = attributes.match(/data-color=["']([^"']+)["']/i);
        if (dataColorMatch) {
            const val = dataColorMatch[1].toLowerCase();
            code = COLOR_MAP_TO_STORAGE[val] || "y";
        } else {
            // Try extracting from style attribute (e.g., style="background-color: #f43f5e")
            const styleMatch = attributes.match(/style=["'][^"']*background-color:\s*([^;"'\s]+)[^"']*["']/i);
            if (styleMatch) {
                const val = styleMatch[1].toLowerCase();
                code = COLOR_MAP_TO_STORAGE[val] || "y";
            }
        }

        return `==${code}:${content}==`;
    });

    return restore(converted);
}
