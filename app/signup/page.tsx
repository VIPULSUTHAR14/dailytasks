import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { signupMeta } from "@/lib/data/mockData";
import { AuthFormContainer } from "@/components/auth/AuthFormContainer";

export default function SignupPage() {
    return (
        <main className="min-h-screen relative w-full bg-zinc-950 font-sans text-white antialiased flex flex-col items-center justify-center p-0 sm:p-6 md:p-8">
            <div className="w-full max-w-7xl mx-auto flex flex-col items-center justify-center h-full">

                {/* Form Wrapper Panel */}
                <div className="relative flex min-h-screen sm:min-h-0 w-full flex-col max-w-[430px] mx-auto border-x sm:border-y border-zinc-800 bg-zinc-950 pb-8 sm:pb-0 transition-all duration-300 overflow-visible">

                    <div className="flex items-center p-4 sm:px-6 sm:pt-6 pb-2 justify-between">
                        <Link href="/login" aria-label="Go back" className="text-zinc-400 flex shrink-0 items-center justify-start hover:text-white transition-colors">
                            <ArrowLeft size={24} />
                        </Link>
                    </div>

                    <div className="px-6 sm:px-8 pt-6 pb-8">
                        <h1 className="text-white tracking-tight text-2xl md:text-3xl font-bold leading-tight">
                            {signupMeta.title}
                        </h1>
                        <p className="text-zinc-400 mt-2 text-sm md:text-base">
                            {signupMeta.subtitle}
                        </p>
                    </div>

                    <AuthFormContainer actionType="signup" className="flex flex-col gap-6 px-6 sm:px-8">
                        <Input
                            id="name"
                            name="name"
                            label={signupMeta.fields.name.label}
                            type="text"
                            placeholder={signupMeta.fields.name.placeholder}
                            required
                        />
                        <Input
                            id="email"
                            name="email"
                            label={signupMeta.fields.email.label}
                            type="email"
                            placeholder={signupMeta.fields.email.placeholder}
                            required
                        />
                        <Input
                            id="password"
                            name="password"
                            label={signupMeta.fields.password.label}
                            type="password"
                            placeholder={signupMeta.fields.password.placeholder}
                            required
                        />

                        <div className="pt-4 sm:pb-8">
                            <Button type="submit" className="w-full h-14 rounded-none bg-white text-zinc-950 font-bold text-sm md:text-base tracking-widest uppercase hover:bg-zinc-200">
                                {signupMeta.buttonText}
                            </Button>
                        </div>
                    </AuthFormContainer>

                    <div className="mt-auto pt-8 pb-10 sm:pb-8 flex justify-center px-6 border-t border-zinc-800 mx-6 sm:mx-8">
                        <p className="text-zinc-400 text-sm md:text-base">
                            {signupMeta.footerText}{" "}
                            <Link href="/Login" className="text-white font-semibold underline underline-offset-4 decoration-1 hover:text-zinc-300">
                                {signupMeta.footerLinkText}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* Visual element for minimalist iOS feel on Mobile */}
            <div className="sm:hidden absolute bottom-2 w-32 h-1 bg-white/20 rounded-full" />
        </main>
    );
}
