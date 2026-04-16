"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LearnWorkspace } from "@/components/learn/LearnWorkspace";

export default function FeynmanPage() {
  const router = useRouter();
  const [topic, setTopic] = useState<string | null>(null);
  const [desc, setDesc] = useState("");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const t = p.get("topic");
    if (!t) { router.replace("/learn"); return; }
    setTopic(decodeURIComponent(t));
    setDesc(decodeURIComponent(p.get("desc") || ""));
  }, [router]);

  if (!topic) return null;

  return (
    <LearnWorkspace
      conceptTitle={topic}
      conceptDescription={desc}
      onComplete={() => router.push("/learn")}
    />
  );
}
