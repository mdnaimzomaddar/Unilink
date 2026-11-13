"use client";

import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { IconGithub, IconGoogle } from "@/components/icons";

export default function SocialButtons() {
  const login = (provider: "google" | "github") =>
    signIn.social({
      provider,
      callbackURL: "/dashboard?flash=login",
      errorCallbackURL: "/login?flash=oauth_error",
    });

  return (
    <div className="space-y-3">
      <Button type="button" className="w-full gap-2" variant="outline" onClick={() => login("google")}>
        <IconGoogle className="h-4 w-4" /> Google দিয়ে চালিয়ে যাও
      </Button>
      <Button type="button" className="w-full gap-2" variant="outline" onClick={() => login("github")}>
        <IconGithub className="h-4 w-4" /> GitHub দিয়ে চালিয়ে যাও
      </Button>
    </div>
  );
}