"use client";

import { useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function ProtectedPage() {
  const router = useRouter();

  useEffect(() => {
    const routeUser = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role, subscription_status")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        router.push("/login");
        return;
      }

      if (!profile) {
        router.push("/onboarding");
        return;
      }

      const role = String(profile.role || "").toLowerCase().trim();
      const sub = String(profile.subscription_status || "inactive").toLowerCase().trim();

      if (role === "founder") {
        router.push("/founder");
        return;
      }

      if (role === "builder") {
        router.push(sub === "active" ? "/builder" : "/subscribe");
        return;
      }

      router.push("/onboarding");
    };

    routeUser();
  }, [router]);

  return (
    <div style={{ padding: 40, fontFamily: "system-ui" }}>
      Routing...
    </div>
  );
}