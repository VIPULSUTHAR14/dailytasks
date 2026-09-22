"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
    CheckSquare,
    GraduationCap,
    Code2,
    BookOpen,
    Clock,
    StickyNote,
    LogOut,
    PanelLeftClose,
    PanelLeftOpen,
    X,
    Search,
    Terminal,
    ChevronRight,
    Menu,
} from "lucide-react";
import CommandPalette from "@/components/CommandPalette";

export interface NavItem {
    name: string;
    href: string;
    icon: React.ElementType;
    badge?: string;
    badgeColor?: string;
}

export const ALGO_NAV_ITEMS: NavItem[] = [
    { name: "Tasks", href: "/tasks", icon: CheckSquare, badge: "1", badgeColor: "bg-[#1E293B] text-zinc-300" },
    { name: "Aptitude Prep", href: "/aptitude", icon: GraduationCap, badge: "5%", badgeColor: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" },
    { name: "DSA Questions", href: "/dsaquestions", icon: Code2, badge: "147", badgeColor: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" },
    { name: "DSA Notes", href: "/notes", icon: BookOpen, badge: "29", badgeColor: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" },
    { name: "Custom Notes", href: "/custom-notes", icon: StickyNote, badge: "3", badgeColor: "bg-[#1E293B] text-zinc-400" },
    { name: "Daily Time Table", href: "/timetable", icon: Clock, badge: "Active", badgeColor: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" },
];

interface SidebarProps {
    isMobileOpen?: boolean;
    onMobileClose?: () => void;
    customFilters?: React.ReactNode;
    collapsedFilters?: React.ReactNode;
    brandTitle?: string;
    hideBottomNav?: boolean;
}

export default function Sidebar({
    isMobileOpen = false,
    onMobileClose,
    customFilters,
    collapsedFilters,
    brandTitle = "AlgoCraft",
    hideBottomNav = false,
}: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isCmdPaletteOpen, setCmdPaletteOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const saved = localStorage.getItem("sidebar_collapsed");
        if (saved !== null) {
            setIsCollapsed(saved === "true");
        }
    }, []);

    // Global ⌘K / Ctrl+K listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setCmdPaletteOpen((prev) => !prev);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const toggleCollapse = () => {
        setIsCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem("sidebar_collapsed", String(next));
            return next;
        });
    };

    const [localMobileOpen, setLocalMobileOpen] = useState(isMobileOpen);

    useEffect(() => {
        setLocalMobileOpen(isMobileOpen);
    }, [isMobileOpen]);

    // Global listener for mobile sidebar triggers from headers, floating buttons, etc.
    useEffect(() => {
        const handleOpen = () => setLocalMobileOpen(true);
        const handleClose = () => {
            setLocalMobileOpen(false);
            if (onMobileClose) onMobileClose();
        };
        const handleToggle = () => setLocalMobileOpen((prev) => !prev);

        window.addEventListener("open-mobile-sidebar", handleOpen);
        window.addEventListener("close-mobile-sidebar", handleClose);
        window.addEventListener("toggle-mobile-sidebar", handleToggle);

        return () => {
            window.removeEventListener("open-mobile-sidebar", handleOpen);
            window.removeEventListener("close-mobile-sidebar", handleClose);
            window.removeEventListener("toggle-mobile-sidebar", handleToggle);
        };
    }, [onMobileClose]);

    const activeMobileOpen = localMobileOpen;

    const handleClose = () => {
        setLocalMobileOpen(false);
        if (onMobileClose) {
            onMobileClose();
        }
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("close-mobile-sidebar"));
        }
    };

    const handleSignOut = async () => {
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

    const handleNavigate = (href: string) => {
        handleClose();
        router.push(href);
    };

    return (
        <>
            {/* Command Palette */}
            <CommandPalette isOpen={isCmdPaletteOpen} onClose={() => setCmdPaletteOpen(false)} />

            {/* Sidebar Overlay for Mobile */}
            {activeMobileOpen && (
                <div
                    className="fixed inset-0 z-[60] bg-[#0B0F17]/80 backdrop-blur-sm md:hidden"
                    onClick={handleClose}
                />
            )}

            {/* Main Sidebar */}
            <aside
                className={`fixed md:sticky top-0 h-screen bg-[#0B0F17] border-r border-[#1E293B] z-[70] transform transition-all duration-300 ease-in-out flex flex-col shrink-0 select-none ${
                    activeMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                } ${isCollapsed ? "md:w-20 w-64" : "w-64"}`}
            >
                {/* Header / Logo */}
                <div
                    className={`p-4 border-b border-[#1E293B] flex items-center ${
                        isCollapsed ? "md:justify-center justify-between" : "justify-between"
                    }`}
                >
                    <div
                        className="flex items-center gap-2.5 overflow-hidden cursor-pointer"
                        onClick={() => handleNavigate("/tasks")}
                    >
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/10">
                            <Terminal size={18} className="text-cyan-400" />
                        </div>
                        {(!isCollapsed || activeMobileOpen) && (
                            <div className="flex items-center gap-2 truncate">
                                <h2 className="text-base font-bold tracking-tight text-white truncate">
                                    {brandTitle}
                                </h2>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
                                    v2.4 PRO
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        {/* Desktop Fold / Collapse Toggle Button */}
                        <button
                            onClick={toggleCollapse}
                            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                            className="hidden md:flex p-1.5 rounded text-zinc-400 hover:text-white hover:bg-[#141923] transition-colors"
                        >
                            {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                        </button>

                        {/* Mobile Close Button */}
                        <button
                            className="md:hidden p-1.5 text-zinc-400 hover:text-white"
                            onClick={handleClose}
                            title="Close menu"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Body Content */}
                <div className="flex-1 p-3 flex flex-col gap-3 overflow-y-auto overflow-x-hidden no-scrollbar">
                    {/* Quick Jump Search Button */}
                    {(!isCollapsed || activeMobileOpen) ? (
                        <button
                            onClick={() => setCmdPaletteOpen(true)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#10141E] border border-[#1E293B] hover:border-cyan-500/40 text-zinc-400 hover:text-white transition-all text-xs group"
                        >
                            <div className="flex items-center gap-2">
                                <Search size={14} className="text-zinc-500 group-hover:text-cyan-400" />
                                <span>Quick jump...</span>
                            </div>
                            <kbd className="px-1.5 py-0.5 rounded bg-[#181C24] border border-[#1E293B] text-[10px] font-mono text-zinc-400 group-hover:text-cyan-300">
                                ⌘K
                            </kbd>
                        </button>
                    ) : (
                        <div className="flex justify-center">
                            <button
                                onClick={() => setCmdPaletteOpen(true)}
                                title="Quick jump (⌘K)"
                                className="w-10 h-10 rounded-lg bg-[#10141E] border border-[#1E293B] hover:border-cyan-500/40 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
                            >
                                <Search size={16} />
                            </button>
                        </div>
                    )}

                    {/* Page Specific Filters (if any) */}
                    {customFilters && (!isCollapsed || activeMobileOpen) && (
                        <div className="flex flex-col gap-1 pb-2 border-b border-[#1E293B]">
                            {customFilters}
                        </div>
                    )}

                    {collapsedFilters && isCollapsed && !activeMobileOpen && (
                        <div className="flex flex-col items-center gap-1 pb-2 border-b border-[#1E293B]">
                            {collapsedFilters}
                        </div>
                    )}

                    {/* Navigation Header */}
                    {(!isCollapsed || activeMobileOpen) && (
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-2">
                            Navigation
                        </div>
                    )}

                    {/* Navigation Items */}
                    <nav className="flex flex-col gap-1 w-full">
                        {ALGO_NAV_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            if (isCollapsed && !activeMobileOpen) {
                                return (
                                    <div key={item.href} className="relative group flex justify-center py-0.5">
                                        <button
                                            onClick={() => handleNavigate(item.href)}
                                            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors relative ${
                                                isActive
                                                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10"
                                                    : "text-zinc-400 hover:bg-[#141923] hover:text-white"
                                            }`}
                                            aria-label={item.name}
                                        >
                                            <Icon size={18} />
                                            {item.name === "Daily Time Table" && (
                                                <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                            )}
                                        </button>
                                        {/* Tooltip on Folded Hover */}
                                        <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#10141E] text-white text-xs font-medium rounded-lg shadow-xl border border-[#1E293B] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                                            {item.name} {item.badge && `(${item.badge})`}
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <button
                                    key={item.href}
                                    onClick={() => handleNavigate(item.href)}
                                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group cursor-pointer ${
                                        isActive
                                            ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold shadow-sm"
                                            : "text-zinc-400 hover:bg-[#141923] hover:text-white border border-transparent"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon
                                            size={16}
                                            className={`shrink-0 transition-colors ${
                                                isActive ? "text-cyan-400" : "text-zinc-400 group-hover:text-zinc-200"
                                            }`}
                                        />
                                        <span className="truncate">{item.name}</span>
                                    </div>

                                    {item.badge && (
                                        <span
                                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                                item.badgeColor || "bg-[#141923] text-zinc-300 border border-[#1E293B]"
                                            } ${item.name === "Daily Time Table" && isActive ? "animate-pulse" : ""}`}
                                        >
                                            {item.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Footer Telemetry & Sign Out */}
                <div className="p-3 border-t border-[#1E293B] bg-[#0B0F17]/60">
                    {(!isCollapsed || activeMobileOpen) && (
                        <div className="flex items-center justify-between px-2 py-1.5 mb-2 text-[10px] text-zinc-500 border-b border-[#1E293B]/50 font-mono">
                            <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                Live Telemetry
                            </span>
                            <span className="text-cyan-400">All active</span>
                        </div>
                    )}

                    {isCollapsed && !activeMobileOpen ? (
                        <div className="relative group flex justify-center">
                            <button
                                onClick={handleSignOut}
                                className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#141923] rounded-lg transition-colors"
                                aria-label="Sign Out"
                            >
                                <LogOut size={16} />
                            </button>
                            <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#10141E] text-white text-xs font-medium rounded-lg shadow-xl border border-[#1E293B] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                                Sign Out
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 px-3 py-2 w-full text-zinc-400 hover:text-white hover:bg-[#141923] text-xs font-medium rounded-lg transition-colors"
                        >
                            <LogOut size={15} className="shrink-0" />
                            <span className="truncate">Sign Out</span>
                        </button>
                    )}
                </div>
            </aside>

            {/* Mobile Bottom Navigation Dock */}
            {!hideBottomNav && (
                <nav
                    aria-label="Mobile Navigation"
                    className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0F17]/95 backdrop-blur-md border-t border-[#1E293B] px-1 py-1.5 flex items-center justify-around select-none shadow-2xl shadow-black"
                >
                    {ALGO_NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        const label =
                            item.name === "Aptitude Prep"
                                ? "Aptitude"
                                : item.name === "DSA Questions"
                                ? "DSA Qs"
                                : item.name === "DSA Notes"
                                ? "Notes"
                                : item.name === "Custom Notes"
                                ? "Custom"
                                : item.name === "Daily Time Table"
                                ? "Schedule"
                                : item.name;

                        return (
                            <button
                                key={item.href}
                                type="button"
                                onClick={() => handleNavigate(item.href)}
                                className={`flex flex-col items-center justify-center flex-1 py-1 px-0.5 rounded-lg transition-all cursor-pointer relative ${
                                    isActive
                                        ? "text-cyan-400 font-semibold"
                                        : "text-zinc-400 hover:text-zinc-200"
                                }`}
                            >
                                <div className="relative">
                                    <Icon size={17} className={isActive ? "text-cyan-400" : "text-zinc-400"} />
                                    {item.name === "Daily Time Table" && isActive && (
                                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                    )}
                                </div>
                                <span className="text-[10px] mt-0.5 tracking-tight font-medium leading-none">
                                    {label}
                                </span>
                                {isActive && (
                                    <span className="absolute -bottom-1 w-3.5 h-0.5 bg-cyan-400 rounded-full" />
                                )}
                            </button>
                        );
                    })}

                    {/* Mobile Menu Button in Bottom Bar */}
                    <button
                        type="button"
                        onClick={() => setLocalMobileOpen((prev) => !prev)}
                        className="flex flex-col items-center justify-center flex-1 py-1 px-0.5 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer"
                        title="Open full menu"
                        aria-label="Open full menu"
                    >
                        <Menu size={17} />
                        <span className="text-[10px] mt-0.5 tracking-tight font-medium leading-none">
                            Menu
                        </span>
                    </button>
                </nav>
            )}
        </>
    );
}
