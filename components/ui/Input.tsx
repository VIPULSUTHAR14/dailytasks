"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export function Input({ label, error, type, ...props }: InputProps) {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";

    const itemVariants: import("framer-motion").Variants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
    };

    return (
        <motion.div variants={itemVariants} className="flex flex-col w-full gap-2">
            <label className="text-white text-sm font-medium leading-normal tracking-wide uppercase">
                {label}
            </label>
            <div className="relative flex items-center">
                <input
                    type={isPassword && showPassword ? "text" : type}
                    className={`form-input flex w-full rounded-none border-b border-t-0 border-l-0 border-r-0 bg-transparent p-3 text-white placeholder:text-white/30 focus:ring-0 transition-all text-base font-light ${
                        error ? "border-red-500 focus:border-red-500" : "border-white/20 focus:border-white"
                    }`}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 text-white/50 hover:text-white transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                )}
            </div>
            {error && <span className="text-red-500 text-xs mt-1 font-medium">{error}</span>}
        </motion.div>
    );
}
