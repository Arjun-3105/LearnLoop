"use client";
import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";

/* ─── data ────────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
      </svg>
    ),
    label: "AI Learning Engine",
    desc: "Paste any YouTube link and get a complete learning path generated in seconds.",
    points: ["Flip-card flashcards", "Interactive concept map", "Personalised assignment"],
    descStyle: "text-white/80",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
      </svg>
    ),
    label: "Live Code Assessment",
    desc: "Connect GitHub, pick a repo, and get graded against every checkpoint automatically.",
    points: ["GitHub OAuth — incl. private repos", "Checkpoint-by-checkpoint grading", "Strengths & gaps breakdown"],
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
    label: "Proof of Learning NFT",
    desc: "Pass the assessment and mint a tamper-proof ERC-721 credential on Polygon.",
    points: ["IPFS metadata storage", "Polygon Mumbai chain", "Permanently verifiable"],
  },
];

const STATS = [
  { value: "< 30s", label: "to generate learning path" },
  { value: "10+", label: "checkpoints evaluated" },
  { value: "ERC-721", label: "on-chain credential" },
  { value: "100%", label: "AI-graded, no bias" },
];

const STEPS = [
  { n: "01", label: "Watch", desc: "Paste any YouTube tutorial or lecture URL." },
  { n: "02", label: "Learn", desc: "Flashcards, concept map, coding assignment — all AI-generated." },
  { n: "03", label: "Submit", desc: "Connect GitHub, select your repo, run the assessment." },
  { n: "04", label: "Own It", desc: "Mint your Proof of Learning NFT on Polygon." },
];

/* ─── animation variants ──────────────────────────────────────────────── */
const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
const rise: Variants = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { ease: "easeOut", duration: 0.6 } } };
const fade: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { ease: "easeOut", duration: 0.5 } } };

/* ─── component ───────────────────────────────────────────────────────── */
export default function Dashboard() {
  const [url, setUrl] = useState("");
  const [focused, setFocused] = useState(false);
  const router = useRouter();

  const go = () => {
    if (!url.trim()) return;
    router.push(`/learn?url=${encodeURIComponent(url.trim())}&type=youtube`);
  };

  return (
    <div className="min-h-screen">

      {/* ══════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative flex min-h-[88vh] flex-col justify-center overflow-hidden px-10 py-24">

        {/* Subtle grid background */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 100%)",
          }}
        />

        <motion.div variants={stagger} initial="hidden" animate="show" className="relative max-w-5xl">

          {/* Logo + label */}
          <motion.div variants={rise} className="mb-10 flex items-center gap-4">
            <Image
              src="/logo.png"
              alt="LearnLoop"
              width={56}
              height={56}
              style={{ mixBlendMode: "screen" }}
            />
            <div className="h-8 w-px bg-white/[0.07]" />
            <span className="text-[18px] font-semibold uppercase tracking-[0.2em] text-[#10b981]">
              LearnLoop · AI Proof of Learning
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={rise}
            className="mb-8 text-[clamp(3.2rem,7.5vw,6rem)] font-black leading-[0.93] tracking-[-0.04em]"
          >
            <span className="text-white/60">Turn any </span>
            <span className="text-white">YouTube</span>
            <br />
            <span className="text-white">video </span>
            <span className="text-white/60">into a </span>
            <br />
            <span className="text-white">challenge.</span>
          </motion.h1>

          {/* Subtext */}
          <motion.p variants={rise} className="mb-10 max-w-lg text-[15px] leading-[1.75] text-white/70">
            Paste a YouTube tutorial or lecture link. Get flashcards, a concept map, and a personalized assignment instantly.
          </motion.p>

          {/* Input Box */}
          <motion.div variants={rise} className="mb-5 max-w-2xl">
            <div
              className={[
                "flex items-center rounded-2xl border transition-all duration-200",
                focused
                  ? "border-white/20 shadow-[0_0_0_5px_rgba(255,255,255,0.03)]"
                  : "border-white/8",
              ].join(" ")}
              style={{ background: "#0d0d0d" }}
            >
              <div className="ml-4 h-4 w-4 shrink-0 text-white/60">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" /></svg>
              </div>

              <input
                type="text"
                placeholder="Paste a YouTube URL…"
                className="h-14 flex-1 bg-transparent px-4 text-[15px] text-white outline-none placeholder:text-white/70"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={(e) => e.key === "Enter" && go()}
              />

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={go}
                className="mr-2 h-10 rounded-xl bg-emerald-500 px-6 text-sm font-bold text-black transition hover:bg-emerald-600"
              >
                Generate →
              </motion.button>
            </div>
            <p className="mt-3 px-1 text-xs text-white/70">
              Works with educational videos, tutorials, and lectures that have captions.
            </p>
          </motion.div>

          {/* Pills */}
          <motion.div variants={rise} className="flex flex-wrap gap-2">
            {["AI Flashcards", "Concept Map", "Coding Assignment", "GitHub Grading", "NFT Certificate"].map((t) => (
              <span key={t} className="rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1 text-[11px] text-white/70">
                {t}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          STATS STRIP
      ══════════════════════════════════════════════════════════════ */}
      <section className="border-y border-white/[0.05]">
        <motion.div
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="grid grid-cols-2 divide-x divide-white/[0.05] lg:grid-cols-4"
        >
          {STATS.map(({ value, label }) => (
            <motion.div key={value} variants={fade} className="flex flex-col gap-1 px-8 py-7">
              <span className="text-2xl font-black tracking-tight text-white">{value}</span>
              <span className="text-xs text-white/40">{label}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FEATURE CARDS
      ══════════════════════════════════════════════════════════════ */}
      <section className="px-10 py-20">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
          <motion.p variants={fade} className="mb-10 text-[17px] font-semibold uppercase tracking-[0.2em] text-[#818181]">
            What you get
          </motion.p>

          <div className="grid gap-4 lg:grid-cols-3">
            {FEATURES.map(({ icon, label, desc, points }) => (
              <motion.div
                key={label}
                variants={rise}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="group flex flex-col gap-6 rounded-2xl border border-white/[0.06] bg-[#0a0a0a] p-7 transition-colors hover:border-white/[0.1] hover:bg-[#0d0d0d]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-white/50 transition-colors group-hover:text-white">
                  {icon}
                </div>
                <div className="flex-1">
                  <h3 className="mb-2 text-base font-bold text-white">{label}</h3>
                  <p className="mb-5 text-sm leading-relaxed text-white/40">{desc}</p>
                  <ul className="space-y-2">
                    {points.map((p) => (
                      <li key={p} className="flex items-center gap-2.5 text-xs text-white/40">
                        <span className="h-px w-3 bg-white/[0.15]" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════════════ */}
      <section className="border-t border-white/[0.05] px-10 py-20">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
          <motion.p variants={fade} className="mb-10 text-[17px] font-semibold uppercase tracking-[0.2em] text-white/50">
            How it works
          </motion.p>

          <div className="grid gap-0 overflow-hidden rounded-2xl border border-white/[0.06] lg:grid-cols-4">
            {STEPS.map(({ n, label, desc }, i) => (
              <motion.div
                key={n}
                variants={rise}
                className="group relative flex flex-col justify-between gap-8 border-b border-white/[0.05] bg-[#080808] p-7 last:border-0 transition-colors hover:bg-[#0c0c0c] lg:border-b-0 lg:border-r lg:last:border-r-0"
              >
                <div className="flex items-start justify-between">
                  <span className="text-[25px] font-black tracking-[0.16em] text-white/25">{n}</span>
                  {i < STEPS.length - 1 && (
                    <svg viewBox="0 0 16 16" fill="none" className="hidden h-3 w-3 text-white/25 lg:block">
                      <path d="M1 8h14M9 2l6 6-6 6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="mb-2 text-lg font-bold text-white">{label}</p>
                  <p className="text-sm leading-relaxed text-white/40">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          BOTTOM CTA
      ══════════════════════════════════════════════════════════════ */}
      <section className="border-t border-white/[0.05] px-10 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ ease: "easeOut", duration: 0.6 }}
          className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="flex items-center gap-5">
            <Image src="/logo.png" alt="LearnLoop" width={44} height={44} style={{ mixBlendMode: "screen" }} />
            <div>
              <p className="text-xl font-black tracking-tight text-white">Ready to start learning?</p>
              <p className="mt-1 text-sm text-white/40">Paste a YouTube link and get your path in under 30 seconds.</p>
            </div>
          </div>

          <div
            className={[
              "flex w-full max-w-md items-center rounded-2xl border transition-all duration-200",
              focused
                ? "border-white/20"
                : "border-white/[0.08]",
            ].join(" ")}
            style={{ background: "#0d0d0d" }}
          >
            <input
              type="text"
              placeholder="youtube.com/watch?v=…"
              className="h-12 flex-1 bg-transparent px-4 text-sm text-white outline-none placeholder:text-white/20"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => e.key === "Enter" && go()}
            />
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={go}
              className="mr-1.5 h-9 rounded-xl bg-white px-5 text-xs font-bold text-black transition hover:bg-white/90"
            >
              Go →
            </motion.button>
          </div>
        </motion.div>
      </section>

    </div>
  );
}