import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignupFormContent } from "@/components/auth/SignupFormContent";

export const metadata = {
  title: "Create Account • AlgoCraft Workspace",
  description: "Join AlgoCraft to initialize your algorithmic sprint roadmap and habit tracking workspace.",
};

export default async function SignupPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token");
  if (token) {
    redirect("/dashboard");
  }

  return <SignupFormContent />;
}
