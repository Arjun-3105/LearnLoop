"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ConceptMap from "@/components/ConceptMap";
import AssignmentCard from "@/components/AssignmentCard";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { saveSession, getSession, type SessionDoc } from "@/lib/appwrite";

/* ─── types ─────────────────────────────────────────────────────────── */
type ConceptMapData = {
  nodes: { id: string; label: string; description: string; videoInsight?: string; practicalExample?: string }[];
  edges: { source: string; target: string; label: string }[];
};
type Flashcard = { title: string; explanation: string; example: string; checkpoint: string };
type FlashcardsData = { topic: string; cards: Flashcard[] };
type Assignment = {
  isCodingVideo?: boolean;
  title: string; description: string;
  track: "frontend" | "backend" | "fullstack";
  requirements?: string[]; checkpoints?: string[];
  hint: string; topic: string; starterIdea?: string;
  quiz?: { question: string; options: string[]; answerIndex: number }[];
};
type VideoMeta = { title: string; channelName: string; thumbnail: string; thumbnailFallback: string };

/* ─── motion presets ─────────────────────────────────────────────────── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { ease: "easeOut", duration: 0.5 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

type Step = "flashcards" | "map" | "assignment";
const STEPS: { id: Step; label: string; n: string }[] = [
  { id: "map",        label: "Concept Map", n: "01" },
  { id: "flashcards", label: "Flashcards",  n: "02" },
  { id: "assignment", label: "Assignment",  n: "03" },
];

const LOADING_MSGS = [
  "Fetching transcript…",
  "Parsing video content…",
  "Generating flashcards…",
  "Building concept map…",
  "Writing your assignment…",
  "Almost ready…",
];

function LearnPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const url = searchParams.get("url") ?? "";
  const sessionId = searchParams.get("session") ?? "";
  const [step, setStep] = useState<Step>("map");
  const [maxStep, setMaxStep] = useState(0);

  const [loading, setLoading] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [error, setError] = useState("");
  const [nonEdu, setNonEdu] = useState<{ reason: string } | null>(null);
  const [imgError, setImgError] = useState(false);

  const [flashcards, setFlashcards] = useState<FlashcardsData | null>(null);
  const [conceptMap, setConceptMap] = useState<ConceptMapData | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [videoMeta, setVideoMeta] = useState<VideoMeta | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const savedRef = useRef(false);
  const savedSessionIdRef = useRef("");


  /* rotate loading messages */
  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setLoadingMsgIdx((i) => (i + 1) % LOADING_MSGS.length), 1800);
    return () => clearInterval(t);
  }, [loading]);

  /* auto-save session to Appwrite once all 3 AI steps are ready */
  useEffect(() => {
    if (!flashcards || !conceptMap || !assignment || !videoMeta) return;
    if (savedRef.current) return;
    savedRef.current = true;

    const p = new URLSearchParams(window.location.search);
    const urlParam = p.get("url") || "";

    saveSession({
      videoUrl: urlParam,
      videoTitle: videoMeta.title,
      channelName: videoMeta.channelName,
      thumbnail: videoMeta.thumbnail || videoMeta.thumbnailFallback || "",
      topic: (flashcards as { topic?: string }).topic ?? "",
      flashcardsJson: JSON.stringify(flashcards),
      conceptMapJson: JSON.stringify(conceptMap),
      assignmentJson: JSON.stringify(assignment),
      assessmentJson: "",
      score: -1,
    })
      .then((doc) => { savedSessionIdRef.current = doc.$id; })
      .catch((err) => { 
        console.error("[learn] Failed to save session to Appwrite:", err);
      });
  }, [flashcards, conceptMap, assignment, videoMeta]);

  /* fetch data — either from Appwrite cache (?session=) or fresh AI APIs (?url=) */
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const urlParam = p.get("url") || "";
    const typeParam = p.get("type") || "youtube";
    const sourceParam = p.get("source") || "";
    const sessionParam = p.get("session") || "";

    if (!sessionParam && !urlParam) return;

    (async () => {
      setLoading(true);
      setError("");
      setFlashcards(null); setConceptMap(null); setAssignment(null);
      setVideoMeta(null); setImgError(false); setCardIndex(0);
      setFlipped(false); setStep("map"); setMaxStep(0);
      savedRef.current = true;          // will be reset below for fresh loads
      savedSessionIdRef.current = "";   // reset saved doc ID for new load

      /* ── A. Load from Appwrite cache ──────────────────────────────── */
      if (sessionParam) {
        try {
          const doc = await getSession(sessionParam) as unknown as SessionDoc;
          setVideoMeta({
            title: doc.videoTitle || "Learning Session",
            channelName: doc.channelName || "",
            thumbnail: doc.thumbnail || "",
            thumbnailFallback: doc.thumbnail || "",
          });
          setFlashcards(doc.flashcardsJson ? JSON.parse(doc.flashcardsJson) : null);
          setConceptMap(doc.conceptMapJson ? JSON.parse(doc.conceptMapJson) : null);
          setAssignment(doc.assignmentJson ? JSON.parse(doc.assignmentJson) : null);
          // Unlock all steps immediately
          setMaxStep(STEPS.length - 1);
        } catch {
          setError("Could not load this session from history. It may have been deleted.");
        } finally {
          setLoading(false);
        }
        return;
      }

      /* ── B. Fresh load via AI APIs ────────────────────────────────── */
      savedRef.current = false;

      try {
        const tRes = await fetch("/api/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: urlParam, type: typeParam }),
        });

        const tData = await tRes.json() as {
          transcript?: string; error?: string; reason?: string;
          title?: string; channelName?: string;
          thumbnail?: string; thumbnailFallback?: string;
          transcriptLength?: number;
          type?: string;
        };

        if (!tRes.ok) {
          if (tData.reason) {
            setNonEdu({ reason: tData.reason });
            setLoading(false);
            return;
          }
          throw new Error(tData.error || "Content ingestion failed");
        }
        if (!tData.transcript) throw new Error("No content extracted from source");

        const meta: VideoMeta = {
          title: tData.title ?? "Learning Source",
          channelName: tData.channelName ?? "",
          thumbnail: tData.thumbnail ?? "",
          thumbnailFallback: tData.thumbnailFallback ?? "",
        };
        setVideoMeta(meta);

        /* 2. AI generation (parallel — all share the same transcript) */
        const transcript = tData.transcript;
        const [fR, mR, aR] = await Promise.all([
          fetch("/api/flashcards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transcript }) }),
          fetch("/api/concept-map", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transcript }) }),
          fetch("/api/assignment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transcript }) }),
        ]);
        const [fD, mD, aD] = await Promise.all([fR.json(), mR.json(), aR.json()]);
        if (!fR.ok) throw new Error(fD.error || "Flashcards generation failed");
        if (!mR.ok) throw new Error(mD.error || "Concept map generation failed");
        if (!aR.ok) throw new Error(aD.error || "Assignment generation failed");

        setFlashcards(fD);
        setConceptMap(mD);
        setAssignment(aD);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load learning path");
      } finally {
        setLoading(false);
      }
    })();
  }, [url, sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const advance = (s: Step) => {
    setMaxStep((p) => Math.max(p, STEPS.findIndex((t) => t.id === s)));
    setStep(s); setCardIndex(0); setFlipped(false);
  };

  /* ── thumbnail src with fallback ──────────────────────────────────── */
  const thumbSrc = imgError
    ? (videoMeta?.thumbnailFallback || "")
    : (videoMeta?.thumbnail || videoMeta?.thumbnailFallback || "");

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8">

      {/* ── Source card ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-[#0d0d0d] p-3 pr-4"
      >
        {/* Thumbnail / placeholder */}
        {thumbSrc ? (
          <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-xl">
            <Image src={thumbSrc} alt="thumbnail" fill className="object-cover" onError={() => setImgError(true)} unoptimized />
          </div>
        ) : (
          <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded-xl bg-white/3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 text-[#818181] ">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
            </svg>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight text-white">
            {videoMeta?.title || (loading ? "Processing…" : url || "—")}
          </p>
          {videoMeta?.channelName && (
            <p className="mt-0.5 text-[11px] text-[#444]">{videoMeta.channelName}</p>
          )}
        </div>

        <Link href="/dashboard" className="shrink-0 rounded-lg border border-white/[0.07] px-3 py-1.5 text-[11px] font-medium text-[#555] transition hover:border-white/20 hover:text-white">
          ← Change
        </Link>
      </motion.div>

      {/* ── Loading ──────────────────────────────────────────────── */}
      {loading && (
        <div className="flex flex-col items-center justify-center gap-8 py-36">
          {/* Animated rings */}
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full border border-white/6" />
            <div className="absolute inset-0 animate-spin rounded-full border border-transparent border-t-white/25" style={{ animationDuration: '1.4s' }} />
            <div className="absolute inset-2 animate-spin rounded-full border border-transparent border-t-white/15" style={{ animationDuration: '2.1s', animationDirection: 'reverse' }} />
            <div className="absolute inset-[22px] rounded-full bg-white/4" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <AnimatePresence mode="wait">
              <motion.p
                key={loadingMsgIdx}
                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.28 }}
                className="text-sm font-medium text-[#666]"
              >
                {LOADING_MSGS[loadingMsgIdx]}
              </motion.p>
            </AnimatePresence>
            <p className="text-[11px] text-[#818181] ">AI is working — usually takes 20–40 seconds</p>
          </div>
          {/* Progress dots */}
          <div className="flex gap-1.5">
            {LOADING_MSGS.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i <= loadingMsgIdx ? 'bg-white/30 w-4' : 'bg-white/[0.07] w-1'}`} />
            ))}
          </div>
        </div>
      )}

      {/* ── Non-educational video block ─────────────────────── */}
      {!loading && nonEdu && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0d0d0d]"
        >
          <div className="flex flex-col items-center px-8 py-14 text-center">
            {/* Icon */}
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.04]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} className="h-7 w-7 text-white/40">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>

            {/* Heading */}
            <h2 className="mb-2 text-2xl font-black tracking-tight text-white">
              Not an educational video
            </h2>
            <p className="mb-1 text-sm text-[#555]">
              LearnLoop only supports tutorials, lectures &amp; educational content
            </p>

            {/* Divider */}
            <div className="my-7 h-px w-20 bg-white/[0.05]" />

            {/* AI reason */}
            <div className="mb-8 max-w-md rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-4 text-left">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#818181] ">Why it was rejected</p>
              <p className="text-sm leading-relaxed text-[#666]">{nonEdu.reason}</p>
            </div>

            {/* Tips */}
            <div className="mb-8 grid gap-2 text-left w-full max-w-xs">
              {[
                "Coding tutorials & walkthroughs",
                "University lectures & MOOCs",
                "Tech deep-dives & explainers",
                "How-to guides with clear steps",
              ].map((tip) => (
                <div key={tip} className="flex items-center gap-2.5 text-xs text-[#444]">
                  <div className="h-px w-3 shrink-0 bg-white/[0.12]" />
                  {tip}
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-black transition hover:bg-white/90"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L4.863 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
              </svg>
              Try a different video
            </Link>
          </div>
        </motion.div>
      )}

      {/* ── Generic error ───────────────────────────────────────── */}
      {!loading && error && (
        <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-8 text-center">
          <div className="mb-3 flex justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 text-red-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
          </div>
          <p className="mb-1 text-sm font-semibold text-white">Failed to load learning path</p>
          <p className="mb-6 text-xs leading-relaxed text-[#555]">{error}</p>
          <Link href="/dashboard" className="rounded-lg border border-white/8 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/20">
            ← Back to Dashboard
          </Link>
        </div>
      )}

      {/* ── Main content — step bar + non-map panels ─────────── */}
      {!loading && !error && flashcards && conceptMap && assignment && (
        <>
          {/* ── Step bar ─────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.4 }}
            className="mb-8 flex items-center gap-1 rounded-xl border border-white/6 bg-[#0a0a0a] p-1"
          >
            {STEPS.map(({ id, label, n }, i) => {
              const done = i < STEPS.findIndex((s) => s.id === step);
              const active = step === id;
              const locked = i > maxStep;
              return (
                <button
                  key={id}
                  onClick={() => !locked && advance(id)}
                  disabled={locked}
                  className={[
                    "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all",
                    active ? "bg-white/75 text-black" : "",
                    done && !active ? "text-[#555] hover:text-white" : "",
                    locked ? "cursor-not-allowed text-[#2a2a2a]" : "cursor-pointer",
                    !active && !locked && !done ? "text-[#444] hover:text-white" : "",
                  ].join(" ")}
                >
                  <span className={[
                    "grid h-4 w-4 place-items-center rounded-full text-[8px] font-black transition-all",
                    active ? "bg-black/10 text-black" : done ? "bg-white/7 text-[#555]" : "bg-white/4 text-[#2a2a2a]",
                  ].join(" ")}>
                    {done ? "✓" : n}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
              );
            })}
          </motion.div>

          {/* ── Flashcards panel ─────────────────────────────── */}
          <AnimatePresence mode="wait">
            {step === "flashcards" && (
              <motion.div key="fc" variants={fadeUp} initial="hidden" animate="show" exit="exit">

                {/* Header */}
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#818181] ">Flashcards</p>
                    <h2 className="text-2xl font-black tracking-tight text-white">{flashcards.topic}</h2>
                    <p className="mt-1 text-xs text-[#444]">Card {cardIndex + 1} of {flashcards.cards.length} · click to flip</p>
                  </div>
                  {/* Progress pills */}
                  <div className="flex shrink-0 gap-1 pt-1">
                    {flashcards.cards.map((_, i) => (
                      <button key={i} onClick={() => { setCardIndex(i); setFlipped(false); }}
                        className={`h-1 rounded-full transition-all ${i === cardIndex ? "w-6 bg-white" : i < cardIndex ? "w-1.5 bg-white/30" : "w-1.5 bg-white/8"}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Card flip */}
                <div className="mb-5 cursor-pointer select-none" style={{ perspective: "1600px" }} onClick={() => setFlipped((p) => !p)}>
                  <motion.div
                    animate={{ rotateY: flipped ? 180 : 0 }}
                    transition={{ duration: 0.55, type: "spring", stiffness: 90, damping: 18 }}
                    style={{ transformStyle: "preserve-3d", position: "relative", minHeight: 300 }}
                  >
                    {/* Front */}
                    <div style={{ backfaceVisibility: "hidden" }}
                      className="absolute inset-0 flex flex-col justify-between rounded-2xl border border-white/[0.07] bg-[#0e0e0e] p-8"
                    >
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#2e2e2e]">Concept</span>
                      <div>
                        <h3 className="mb-4 text-[2.2rem] font-black leading-[1.1] tracking-tight text-white">
                          {flashcards.cards[cardIndex]?.title}
                        </h3>
                        <p className="text-[15px] leading-[1.7] text-[#777]">
                          {flashcards.cards[cardIndex]?.explanation}
                        </p>
                      </div>
                      <div className="flex items-center justify-end gap-1.5 text-[11px] text-[#2e2e2e]">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-3 w-3">
                          <path strokeLinecap="round" d="M8 3v5l3 3M1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z" />
                        </svg>
                        flip for example
                      </div>
                    </div>
                    {/* Back */}
                    <div style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                      className="absolute inset-0 flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-[#0d0d0d] p-8"
                    >
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#2e2e2e]">Example &amp; Checkpoint</span>
                      <div className="flex flex-1 flex-col gap-3">
                        <div className="rounded-xl border border-white/5 bg-white/2.5 p-4">
                          <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-[#444]">Example</p>
                          <p className="text-sm leading-relaxed text-[#bbb]">{flashcards.cards[cardIndex]?.example}</p>
                        </div>
                        <div className="rounded-xl border border-white/5 bg-white/2.5 p-4">
                          <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-[#444]">Checkpoint</p>
                          <p className="text-sm leading-relaxed text-[#bbb]">{flashcards.cards[cardIndex]?.checkpoint}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Nav row */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setCardIndex((p) => Math.max(0, p - 1)); setFlipped(false); }}
                    disabled={cardIndex === 0}
                    className="h-9 rounded-lg border border-white/20 px-4 text-xs text-white transition hover:bg-white/5 disabled:opacity-20"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => { setCardIndex((p) => Math.min(flashcards.cards.length - 1, p + 1)); setFlipped(false); }}
                    disabled={cardIndex >= flashcards.cards.length - 1}
                    className="h-9 rounded-lg border border-white/20 px-4 text-xs text-white transition hover:bg-white/5 disabled:opacity-20"
                  >
                    Next →
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }} onClick={() => advance("assignment")}
                    className="ml-auto h-9 rounded-lg bg-white px-5 text-xs font-bold text-black transition hover:bg-white/90"
                  >
                    Assignment →
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ── Concept Map ───────────────────────────────────── */}
            {step === "map" && (
              <motion.div key="map" variants={fadeUp} initial="hidden" animate="show" exit="exit">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#818181] ">Concept Map</p>
                    <h2 className="text-2xl font-black tracking-tight text-white">Dependency Graph</h2>
                    <p className="mt-1 text-xs text-[#444]">Click any node to inspect · Feynman Mode to master each concept</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }} onClick={() => advance("flashcards")}
                    className="mt-1 shrink-0 h-9 rounded-lg bg-white px-5 text-xs font-bold text-black transition hover:bg-white/90"
                  >
                    Flashcards →
                  </motion.button>
                </div>
                {/* break out of max-w-3xl so the graph gets full viewport width */}
                <div className="relative -mx-5 w-[calc(100%+2.5rem)]">
                  <ConceptMap nodes={conceptMap.nodes} edges={conceptMap.edges} />
                </div>
              </motion.div>
            )}

            {/* ── Assignment panel ──────────────────────────────── */}
            {step === "assignment" && (
              <motion.div key="asgn" variants={fadeUp} initial="hidden" animate="show" exit="exit">

                {/* Header + action buttons */}
                <div className="mb-5">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#818181] ">Assignment</p>
                      <h2 className="text-2xl font-black tracking-tight text-white">Your Challenge</h2>
                      <p className="mt-1 text-xs text-[#444]">Built from the video you just watched</p>
                    </div>
                  </div>

                  {/* Single CTA */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      const base64Assign = btoa(encodeURIComponent(JSON.stringify(assignment)));
                      if (assignment.isCodingVideo === false) {
                        router.push(`/quiz?assignment=${base64Assign}`);
                      } else {
                        router.push(
                          `/assess?assignment=${encodeURIComponent(JSON.stringify(assignment))}${(sessionId || savedSessionIdRef.current) ? `&session=${sessionId || savedSessionIdRef.current}` : ""}`
                        );
                      }
                    }}
                    className="flex h-10 w-full items-center justify-center rounded-xl bg-white text-xs font-bold text-black transition hover:bg-white/90"
                  >
                    {assignment.isCodingVideo === false ? "Take Quiz →" : "Submit Code for Review →"}
                  </motion.button>
                </div>

                <AssignmentCard assignment={assignment} />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

export default function LearnPage() {
  return (
    <Suspense>
      <LearnPageInner />
    </Suspense>
  );
}