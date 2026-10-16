export type ThemeMode =
    | "mono-dark"
    | "mono-light"
    | "metallic-chic"
    | "deep-vintage"
    | "cool-collected"
    | "cosmic-artistry"
    | "vibrant-calm"
    | "striking-simple"
    | "texturized-dynamic"
    | "minimal-warm"
    | "vivid-sharp"
    | "clean-energetic"
    | "youthful-fun"
    | "gorgeous-contrast"
    | "close-to-nature"
    | "loud-in-your-face"
    | "lively-soothing";

export const THEME_STORAGE_KEY = "algocraft_theme";

export interface ThemeOption {
    id: ThemeMode;
    name: string;
    description: string;
    mode: "dark" | "light";
    palette: [string, string, string, string, string];
    accentRgb: string;
    accent2Rgb: string;
    gridRgb: string;
    preview: {
        bg: string;
        card: string;
        accent: string;
        text: string;
    };
}

export const THEMES: ThemeOption[] = [
    {
        id: "mono-dark",
        name: "Black & White",
        description: "Pitch black aesthetic with stark white typography",
        mode: "dark",
        palette: ["#000000", "#121212", "#262626", "#71717A", "#FFFFFF"],
        accentRgb: "255 255 255",
        accent2Rgb: "161 161 170",
        gridRgb: "255 255 255",
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
        mode: "light",
        palette: ["#FFFFFF", "#F4F4F5", "#E4E4E7", "#3F3F46", "#09090B"],
        accentRgb: "9 9 11",
        accent2Rgb: "113 113 122",
        gridRgb: "60 40 30",
        preview: {
            bg: "#FFFFFF",
            card: "#F4F4F5",
            accent: "#09090B",
            text: "#09090B",
        },
    },
    {
        id: "striking-simple",
        name: "Striking and Simple",
        description: "Cyber void pitch black with electric cyan highlights",
        mode: "dark",
        palette: ["#0B0C10", "#1F2833", "#C5C6C7", "#66FCF1", "#45A29E"],
        accentRgb: "102 252 241",
        accent2Rgb: "69 162 158",
        gridRgb: "255 255 255",
        preview: {
            bg: "#0B0C10",
            card: "#1F2833",
            accent: "#66FCF1",
            text: "#F1F5F9",
        },
    },
    {
        id: "metallic-chic",
        name: "Metallic Chic",
        description: "Frosted lavender ice with metallic royal blue",
        mode: "light",
        palette: ["#3D52A0", "#7091E6", "#8697C4", "#ADBBDA", "#EDE8F5"],
        accentRgb: "61 82 160",
        accent2Rgb: "112 145 230",
        gridRgb: "61 82 160",
        preview: {
            bg: "#EDE8F5",
            card: "#FFFFFF",
            accent: "#3D52A0",
            text: "#1E293B",
        },
    },
    {
        id: "deep-vintage",
        name: "Deep Vintage Mood",
        description: "Retro petrol blue with desert sand & vermilion",
        mode: "dark",
        palette: ["#244855", "#E64833", "#874F41", "#90AEAD", "#FBE9D0"],
        accentRgb: "230 72 51",
        accent2Rgb: "144 174 173",
        gridRgb: "251 233 208",
        preview: {
            bg: "#1A343D",
            card: "#244855",
            accent: "#E64833",
            text: "#FBE9D0",
        },
    },
    {
        id: "cool-collected",
        name: "Cool and Collected",
        description: "Deep alpine lake teal with aqua & terracotta",
        mode: "dark",
        palette: ["#003135", "#024950", "#964734", "#0FA4AF", "#AFDDE5"],
        accentRgb: "15 164 175",
        accent2Rgb: "150 71 52",
        gridRgb: "175 221 229",
        preview: {
            bg: "#003135",
            card: "#024950",
            accent: "#0FA4AF",
            text: "#AFDDE5",
        },
    },
    {
        id: "cosmic-artistry",
        name: "Cosmic Artistry",
        description: "Lunar obsidian slate with deep petroleum blue",
        mode: "dark",
        palette: ["#212A31", "#2E3944", "#124E66", "#748D92", "#D3D9D4"],
        accentRgb: "116 141 146",
        accent2Rgb: "18 78 102",
        gridRgb: "211 217 212",
        preview: {
            bg: "#182026",
            card: "#212A31",
            accent: "#748D92",
            text: "#D3D9D4",
        },
    },
    {
        id: "vibrant-calm",
        name: "Vibrant but Calm",
        description: "Warm editorial cream with crimson & marigold",
        mode: "light",
        palette: ["#E43D12", "#D6536D", "#FFA2B6", "#EFB11D", "#EBE9E1"],
        accentRgb: "228 61 18",
        accent2Rgb: "239 177 29",
        gridRgb: "228 61 18",
        preview: {
            bg: "#EBE9E1",
            card: "#FFFFFF",
            accent: "#E43D12",
            text: "#1E1B18",
        },
    },
    {
        id: "texturized-dynamic",
        name: "Texturized & Dynamic",
        description: "Forest shadow with dusty patina rose & teal",
        mode: "dark",
        palette: ["#2F4454", "#2E151B", "#DA7B93", "#376E6F", "#1C3334"],
        accentRgb: "218 123 147",
        accent2Rgb: "55 110 111",
        gridRgb: "243 244 246",
        preview: {
            bg: "#1C3334",
            card: "#2F4454",
            accent: "#DA7B93",
            text: "#F3F4F6",
        },
    },
    {
        id: "minimal-warm",
        name: "Minimal Yet Warm",
        description: "Parchment oatmeal canvas with terracotta coral",
        mode: "light",
        palette: ["#EAE7DC", "#D8C3A5", "#8E8D8A", "#E98074", "#E85A4F"],
        accentRgb: "232 90 79",
        accent2Rgb: "233 128 116",
        gridRgb: "142 141 138",
        preview: {
            bg: "#EAE7DC",
            card: "#F5F3ED",
            accent: "#E85A4F",
            text: "#2A2624",
        },
    },
    {
        id: "vivid-sharp",
        name: "Vivid and Sharp",
        description: "Electric plum night with neon magenta & indigo",
        mode: "dark",
        palette: ["#2A1B3D", "#44318D", "#8F4FA2", "#D83F87", "#A4B3B6"],
        accentRgb: "216 63 135",
        accent2Rgb: "68 49 141",
        gridRgb: "164 179 182",
        preview: {
            bg: "#1D122B",
            card: "#2A1B3D",
            accent: "#D83F87",
            text: "#F8FAFC",
        },
    },
    {
        id: "clean-energetic",
        name: "Clean and Energetic",
        description: "Vibrant cobalt blue with soft azure & electric violet",
        mode: "dark",
        palette: ["#5680E9", "#84CEEB", "#5AB9EA", "#C1C8E4", "#8860D0"],
        accentRgb: "90 185 234",
        accent2Rgb: "136 96 208",
        gridRgb: "193 200 228",
        preview: {
            bg: "#0F1A36",
            card: "#1A2B56",
            accent: "#5AB9EA",
            text: "#FFFFFF",
        },
    },
    {
        id: "youthful-fun",
        name: "Youthful and Fun",
        description: "Buttercream pop with neon purple & sunshine gold",
        mode: "light",
        palette: ["#A64AC9", "#FCCD04", "#FFB48F", "#F5E6CC", "#17E9E0"],
        accentRgb: "166 74 201",
        accent2Rgb: "23 233 224",
        gridRgb: "166 74 201",
        preview: {
            bg: "#F5E6CC",
            card: "#FFFFFF",
            accent: "#A64AC9",
            text: "#1F1726",
        },
    },
    {
        id: "gorgeous-contrast",
        name: "Gorgeous Contrast",
        description: "Industrial charcoal slate with vivid lime neon",
        mode: "dark",
        palette: ["#222629", "#474B4F", "#6B6E70", "#61892F", "#86C232"],
        accentRgb: "134 194 50",
        accent2Rgb: "97 137 47",
        gridRgb: "244 245 246",
        preview: {
            bg: "#1A1D20",
            card: "#222629",
            accent: "#86C232",
            text: "#F4F5F6",
        },
    },
    {
        id: "close-to-nature",
        name: "Close to Nature",
        description: "Crisp cloud white with alpine fjord blue & sage",
        mode: "light",
        palette: ["#687864", "#31708E", "#5085A5", "#8FC1E3", "#F7F9FB"],
        accentRgb: "49 112 142",
        accent2Rgb: "104 120 100",
        gridRgb: "80 133 165",
        preview: {
            bg: "#F7F9FB",
            card: "#FFFFFF",
            accent: "#31708E",
            text: "#1E282D",
        },
    },
    {
        id: "loud-in-your-face",
        name: "Loud and In-Your-Face",
        description: "Cyberpunk midnight with hot flamingo & radioactive seafoam",
        mode: "dark",
        palette: ["#180D1D", "#C34271", "#F070A1", "#16FFBD", "#12C998"],
        accentRgb: "22 255 189",
        accent2Rgb: "240 112 161",
        gridRgb: "22 255 189",
        preview: {
            bg: "#180D1D",
            card: "#2D1535",
            accent: "#16FFBD",
            text: "#F9FAFB",
        },
    },
    {
        id: "lively-soothing",
        name: "Lively Yet Soothing",
        description: "Warm linen with deep ocean teal & pastel mint",
        mode: "light",
        palette: ["#026670", "#9FEDD7", "#FEF9C7", "#FCE181", "#EDEAE5"],
        accentRgb: "2 102 112",
        accent2Rgb: "159 237 215",
        gridRgb: "2 102 112",
        preview: {
            bg: "#EDEAE5",
            card: "#FEF9C7",
            accent: "#026670",
            text: "#0A2E33",
        },
    },
];

const VALID_THEME_IDS = new Set<ThemeMode>([
    "mono-dark",
    "mono-light",
    "striking-simple",
    "metallic-chic",
    "deep-vintage",
    "cool-collected",
    "cosmic-artistry",
    "vibrant-calm",
    "texturized-dynamic",
    "minimal-warm",
    "vivid-sharp",
    "clean-energetic",
    "youthful-fun",
    "gorgeous-contrast",
    "close-to-nature",
    "loud-in-your-face",
    "lively-soothing",
]);

export function getThemeMode(themeId: ThemeMode): "dark" | "light" {
    const theme = THEMES.find((t) => t.id === themeId);
    return theme ? theme.mode : "dark";
}

export function getStoredTheme(): ThemeMode {
    if (typeof window === "undefined") return "striking-simple";
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY) as string | null;
        if (stored && VALID_THEME_IDS.has(stored as ThemeMode)) {
            return stored as ThemeMode;
        }

        // Graceful migration from legacy themes
        if (stored === "mono-dark") return "mono-dark";
        if (stored === "mono-light") return "mono-light";
        if (stored === "midnight-violet") return "vivid-sharp";
        if (stored === "emerald-forest") return "gorgeous-contrast";
        if (stored === "solar-flare") return "deep-vintage";
        if (stored === "paper-sand") return "minimal-warm";
        if (stored === "nordic-frost") return "cosmic-artistry";
        if (stored === "synthwave") return "loud-in-your-face";
        if (stored === "coffee-espresso") return "deep-vintage";
        if (stored === "liquid-glass") return "metallic-chic";
        if (stored === "current") return "striking-simple";
    } catch {}
    return "striking-simple";
}

export function setStoredTheme(theme: ThemeMode) {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
        const themeObj = THEMES.find((t) => t.id === theme) || THEMES[0];
        document.documentElement.setAttribute("data-theme", theme);
        document.documentElement.setAttribute("data-mode", themeObj.mode);
        window.dispatchEvent(new CustomEvent("algocraft-theme-change", { detail: theme }));
    } catch (e) {
        console.error("Failed to set theme", e);
    }
}
