"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

const LoginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(4, "Password must be at least 4 characters long"),
});

export async function loginAction(formData: FormData) {
    const email = formData.get("email");
    const password = formData.get("password");

    const validatedFields = LoginSchema.safeParse({
        email,
        password,
    });

    if (!validatedFields.success) {
        return { error: validatedFields.error.issues[0].message };
    }

    // Here you would authenticate with your API or DB
    // e.g. await signIn("credentials", { email, password });
    
    redirect("/dashboard");
}

const SignupSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters long"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(4, "Password must be at least 4 characters long"),
});

export async function signupAction(formData: FormData) {
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");

    const validatedFields = SignupSchema.safeParse({
        name,
        email,
        password,
    });

    if (!validatedFields.success) {
        return { error: validatedFields.error.issues[0].message };
    }

    // Here you would register the user via your API or DB
    // e.g. await db.user.create({ data: { name, email, password } });

    redirect("/login");
}
