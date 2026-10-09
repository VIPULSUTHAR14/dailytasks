export type ThemeMode =
    | "current"
    | "mono-dark"
    | "mono-light"
    | "midnight-violet"
    | "emerald-forest"
    | "solar-flare"
    | "paper-sand"
    | "nordic-frost"
    | "synthwave"
    | "coffee-espresso"
    | "liquid-glass";

export const THEME_STORAGE_KEY = "algocraft_theme";

export interface ThemeOption {
    id: ThemeMode;
    name: string;
    description: string;
    preview: {
        bg: string;
        card: string;
        accent: string;
        text: string;
    };
}

export const THEMES: ThemeOption[] = [
    {
        id: "current",
        name: "Cyber Slate",
        description: "Default dark slate with cyan & emerald highlights",
        preview: {
            bg: "#0B0F17",
            card: "#10141E",
            accent: "#06B6D4",
            text: "#F1F5F9",
        },
    },
    {
        id: "liquid-glass",
        name: "Liquid Glass",
        description: "Frosted amethyst quartz with champagne-rose & lilac refractive light",
        preview: {
            bg: "#0E0B14",
            card: "#1A1424",
            accent: "linear-gradient(135deg, #FB7185 0%, #C084FC 100%)",
            text: "#FDF4F8",
        },
    },
    {
        id: "solar-flare",
        name: "Solar Flare",
        description: "Charcoal canvas with fiery amber & burnt-orange accents",
        preview: {
            bg: "#181513",
            card: "#241F1C",
            accent: "#FF7A00",
            text: "#FFF5EE",
        },
    },
    {
        id: "paper-sand",
        name: "Paper / Sand",
        description: "Soft off-white parchment with warm ink & terracotta accents",
        preview: {
            bg: "#F7F5F0",
            card: "#EFECE6",
            accent: "#D95D39",
            text: "#1E1B18",
        },
    },
    {
        id: "nordic-frost",
        name: "Nordic Frost",
        description: "Desaturated polar slate with muted ice-blue & pale teal",
        preview: {
            bg: "#242933",
            card: "#2E3440",
            accent: "#88C0D0",
            text: "#ECEFF4",
        },
    },
    {
        id: "synthwave",
        name: "Synthwave",
        description: "Deep plum background with vibrant magenta & coral neon",
        preview: {
            bg: "#1A102F",
            card: "#261845",
            accent: "#FF2A85",
            text: "#FDF2F8",
        },
    },
    {
        id: "coffee-espresso",
        name: "Coffee / Espresso",
        description: "Deep roasted-brown canvas with creamy beige & caramel",
        preview: {
            bg: "#1C1816",
            card: "#2B2522",
            accent: "#E2B179",
            text: "#F5ECE5",
        },
    },
    {
        id: "mono-dark",
        name: "Black & White",
        description: "Pitch black aesthetic with pure monochrome contrast",
        preview: {
            bg: "#000000",
            card: "#121212",
            accent: "#FFFFFF",
            text: "#FFFFFF",
        },
    },
    {
        id: "mono-light",
        name: "White & Black",
        description: "Clean stark light theme with pitch black typography",
        preview: {
            bg: "#FFFFFF",
            card: "#F1F5F9",
            accent: "#000000",
            text: "#09090B",
        },
    },
    {
        id: "midnight-violet",
        name: "Midnight Violet",
        description: "Deep indigo canvas with electric violet & neon cyan",
        preview: {
            bg: "#0E101D",
            card: "#16192B",
            accent: "#8B5CF6",
            text: "#F3F4F6",
        },
    },
    {
        id: "emerald-forest",
        name: "Emerald Matrix",
        description: "Obsidian jade terminal with bioluminescent emerald & mint",
        preview: {
            bg: "#071510",
            card: "#0D221A",
            accent: "#10B981",
            text: "#ECFDF5",
        },
    },
];

export function getStoredTheme(): ThemeMode {
    if (typeof window === "undefined") return "current";
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode;
        if (
            stored === "current" ||
            stored === "mono-dark" ||
            stored === "mono-light" ||
            stored === "midnight-violet" ||
            stored === "emerald-forest" ||
            stored === "solar-flare" ||
            stored === "paper-sand" ||
            stored === "nordic-frost" ||
            stored === "synthwave" ||
            stored === "coffee-espresso" ||
            stored === "liquid-glass"
        ) {
            return stored;
        }
    } catch {}
    return "current";
}

export function setStoredTheme(theme: ThemeMode) {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
        document.documentElement.setAttribute("data-theme", theme);
        window.dispatchEvent(new CustomEvent("algocraft-theme-change", { detail: theme }));
    } catch (e) {
        console.error("Failed to set theme", e);
    }
}
