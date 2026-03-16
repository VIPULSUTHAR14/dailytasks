import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { loginMeta } from "@/lib/data/mockData";
import { AuthFormContainer } from "@/components/auth/AuthFormContainer";

export default function LoginPage() {
    return (
        <main className="min-h-screen relative w-full bg-zinc-950 font-sans text-white flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
            {/* Global Container with Max Width to prevent ultrawide void */}
            <div className="w-full max-w-7xl mx-auto flex flex-col items-center justify-center h-full sm:min-h-[600px]">
                {/* Form Container with responsive borders */}
                <div className="w-full max-w-[400px] flex flex-col gap-8 sm:border sm:border-zinc-800 sm:bg-zinc-950 sm:p-8 sm:rounded-none md:p-10 transition-all duration-300">
                    <header className="flex flex-col gap-2">
                        <h1 className="text-white text-2xl md:text-3xl font-bold tracking-tight leading-tight">
                            {loginMeta.title}
                        </h1>
                        <p className="text-zinc-400 text-sm md:text-base font-light">
                            {loginMeta.subtitle}
                        </p>
                    </header>

                    <AuthFormContainer actionType="login">
                        <div className="flex flex-col gap-5">
                            <Input
                                id="email"
                                name="email"
                                label={loginMeta.fields.email.label}
                                type="email"
                                placeholder={loginMeta.fields.email.placeholder}
                                required
                            />
                            <Input
                                id="password"
                                name="password"
                                label={loginMeta.fields.password.label}
                                type="password"
                                placeholder={loginMeta.fields.password.placeholder}
                                required
                            />

                            <div className="pt-6">
                                <Button type="submit" className="w-full h-14 rounded-none uppercase tracking-widest text-sm md:text-base font-bold bg-white text-zinc-950 hover:bg-zinc-200">
                                    {loginMeta.buttonText}
                                </Button>
                            </div>

                            <div className="text-center">
                                <Link href="#" className="text-zinc-500 text-xs font-medium uppercase tracking-tighter hover:text-white transition-colors">
                                    {loginMeta.forgotPasswordText}
                                </Link>
                            </div>
                        </div>
                    </AuthFormContainer>

                    <footer className="mt-4 sm:mt-8 text-center border-t border-zinc-800 pt-6">
                        <p className="text-zinc-400 text-sm font-light">
                            {loginMeta.footerText}{" "}
                            <Link href="/signup" className="text-white font-semibold hover:underline decoration-1 underline-offset-4 ml-1">
                                {loginMeta.footerLinkText}
                            </Link>
                        </p>
                    </footer>
                </div>
            </div>
            {/* Visual element for minimalist iOS feel on Mobile */}
            <div className="sm:hidden absolute bottom-2 w-32 h-1 bg-white/20 rounded-full" />
        </main>
    );
}
