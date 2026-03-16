"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface AuthFormContainerProps {
    children: React.ReactNode;
    actionType: "login" | "signup";
    className?: string;
}

export function AuthFormContainer({ children, actionType, className }: AuthFormContainerProps) {
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setGlobalError(null);
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        const endpoint = actionType === "login" ? "/api/auth/Login" : "/api/auth/Signup";

        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            const result = await res.json();

            if (!res.ok) {
                setGlobalError(result.message || "An error occurred");
                setIsLoading(false);
                return;
            }

            // Success redirect 
            if (actionType === "login") {
                router.push("/dashboard");
            } else {
                router.push("/login?signup_success=1");
            }
        } catch (err: unknown) {
            setGlobalError("Network error, please try again later.");
            console.log(err);
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className={className || "flex flex-col gap-5"}>
            {globalError && (
                <div className="p-3 mb-2 rounded border border-red-500/20 bg-red-500/10 text-red-500 text-sm md:text-base font-medium">
                    {globalError}
                </div>
            )}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className={`w-full h-full flex flex-col gap-5 ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
            >
                {children}
            </motion.div>
        </form>
    );
}
