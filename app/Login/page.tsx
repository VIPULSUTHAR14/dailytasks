import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginFormContent } from "@/components/auth/LoginFormContent";

export const metadata = {
  title: "Sign In • AlgoCraft Workspace",
  description: "Sign in to AlgoCraft algorithmic workspace, track practice sprints, and manage daily habits.",
};

export default async function LoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token");
  if (token) {
    redirect("/dashboard");
  }

  return <LoginFormContent />;
}
