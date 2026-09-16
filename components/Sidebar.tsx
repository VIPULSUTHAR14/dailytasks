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
} from "lucide-react";

export interface NavItem {
    name: string;
    href: string;
    icon: React.ElementType;
}

export const DEFAULT_NAV_ITEMS: NavItem[] = [
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Aptitude", href: "/aptitude", icon: GraduationCap },
    { name: "DSA Questions", href: "/dsaquestions", icon: Code2 },
    { name: "DSA Notes", href: "/notes", icon: BookOpen },
    { name: "Custom Notes", href: "/custom-notes", icon: StickyNote },
    { name: "Time Table", href: "/timetable", icon: Clock },
];

interface SidebarProps {
    isMobileOpen?: boolean;
    onMobileClose?: () => void;
    customFilters?: React.ReactNode;
    collapsedFilters?: React.ReactNode;
    brandTitle?: string;
}

export default function Sidebar({
    isMobileOpen = false,
    onMobileClose,
    customFilters,
    collapsedFilters,
    brandTitle = "Dashboard.",
}: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem("sidebar_collapsed");
        if (saved !== null) {
            setIsCollapsed(saved === "true");
        }
    }, []);

    const toggleCollapse = () => {
        setIsCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem("sidebar_collapsed", String(next));
            return next;
        });
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
        router.push(href);
        if (onMobileClose) {
            onMobileClose();
        }
    };

    return (
        <>
            {/* Sidebar Overlay for Mobile */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-zinc-950/80 backdrop-blur-sm md:hidden"
                    onClick={onMobileClose}
                />
            )}

            {/* Main Sidebar */}
            <aside
                className={`fixed md:sticky top-0 h-screen bg-zinc-950 border-r border-white/10 z-50 transform transition-all duration-300 ease-in-out flex flex-col shrink-0 ${
                    isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                } ${isCollapsed ? "md:w-20 w-64" : "w-64"}`}
            >
                {/* Header / Logo */}
                <div
                    className={`p-4 md:p-5 border-b border-white/10 flex items-center ${
                        isCollapsed ? "md:justify-center justify-between" : "justify-between"
                    }`}
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 bg-white flex items-center justify-center shrink-0">
                            <span className="text-zinc-950 font-bold text-lg">E</span>
                        </div>
                        {(!isCollapsed || isMobileOpen) && (
                            <h2 className="text-lg font-bold tracking-tight text-white truncate">
                                {brandTitle}
                            </h2>
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        {/* Desktop Fold / Collapse Toggle Button */}
                        <button
                            onClick={toggleCollapse}
                            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                            className="hidden md:flex p-1.5 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                        </button>

                        {/* Mobile Close Button */}
                        <button
                            className="md:hidden p-1.5 text-zinc-400 hover:text-white"
                            onClick={onMobileClose}
                            title="Close menu"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Body Content */}
                <div className="flex-1 p-3 md:p-4 flex flex-col gap-2 overflow-y-auto overflow-x-hidden">
                    {/* Page Specific Filters (e.g. Tasks, Notes) */}
                    {customFilters && (!isCollapsed || isMobileOpen) && (
                        <div className="flex flex-col gap-1 mb-2">
                            {customFilters}
                        </div>
                    )}

                    {collapsedFilters && isCollapsed && !isMobileOpen && (
                        <div className="flex flex-col items-center gap-1 mb-2">
                            {collapsedFilters}
                        </div>
                    )}

                    {/* Navigation Header */}
                    {(!isCollapsed || isMobileOpen) && (
                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-3 my-2">
                            Navigation
                        </div>
                    )}

                    {/* Navigation Items */}
                    <nav className="flex flex-col gap-1 w-full">
                        {DEFAULT_NAV_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            if (isCollapsed && !isMobileOpen) {
                                return (
                                    <div key={item.href} className="relative group flex justify-center py-1">
                                        <button
                                            onClick={() => handleNavigate(item.href)}
                                            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                                                isActive
                                                    ? "bg-white text-zinc-950 font-bold shadow"
                                                    : "text-zinc-400 hover:bg-white/10 hover:text-white"
                                            }`}
                                            aria-label={item.name}
                                        >
                                            <Icon size={20} />
                                        </button>
                                        {/* Tooltip on Folded Hover */}
                                        <div className="absolute left-full ml-3 px-2.5 py-1 bg-zinc-900 text-white text-xs font-medium rounded shadow-xl border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                                            {item.name}
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <button
                                    key={item.href}
                                    onClick={() => handleNavigate(item.href)}
                                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-none ${
                                        isActive
                                            ? "bg-white text-zinc-950 font-bold"
                                            : "text-zinc-400 hover:bg-white/10 hover:text-white"
                                    }`}
                                >
                                    <Icon size={18} className="shrink-0" />
                                    <span className="truncate">{item.name}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Footer / Sign Out */}
                <div className="p-3 md:p-4 border-t border-white/10">
                    {isCollapsed && !isMobileOpen ? (
                        <div className="relative group flex justify-center">
                            <button
                                onClick={handleSignOut}
                                className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                aria-label="Sign Out"
                            >
                                <LogOut size={18} />
                            </button>
                            <div className="absolute left-full ml-3 px-2.5 py-1 bg-zinc-900 text-white text-xs font-medium rounded shadow-xl border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                                Sign Out
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 px-4 py-3 w-full text-zinc-400 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors"
                        >
                            <LogOut size={18} className="shrink-0" />
                            <span className="truncate">Sign Out</span>
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
}
