"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { useFormStatus } from "react-dom";

interface ButtonProps extends HTMLMotionProps<"button"> {
    children: React.ReactNode;
}

export function Button({ children, ...props }: ButtonProps) {
    const { pending } = useFormStatus();

    const itemVariants: import("framer-motion").Variants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
        hover: { scale: 1.02, transition: { type: "spring", stiffness: 400, damping: 10 } },
        tap: { scale: 0.98 },
    };

    return (
        <motion.button
            variants={itemVariants}
            whileHover="hover"
            whileTap="tap"
            disabled={pending || props.disabled}
            className={`flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${props.className}`}
            {...props}
        >
            {pending ? "Processing..." : children}
        </motion.button>
    );
}
