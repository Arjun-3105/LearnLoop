"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useGitHubAuth } from "@/hooks/useGitHubAuth";
import { useWallet } from "@/hooks/useWallet";

/* ─── types ──────────────────────────────────────────────────────────── */
type StoredNFT = {
  id: string;
  topic: string;
  score: number;
  txHash: string;
  metadataURI: string;
  mintedAt: string;
  wallet: string;
};

/* ─── localStorage ────────────────────────────────────────────────────── */
const LS_KEY = "learnloop_nfts";
function loadNFTs(): StoredNFT[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}
function saveNFT(nft: StoredNFT) {
  const all = loadNFTs();
  if (all.find((n) => n.txHash === nft.txHash)) return;
  localStorage.setItem(LS_KEY, JSON.stringify([nft, ...all]));
}
function removeNFT(txHash: string) {
  const all = loadNFTs().filter((n) => n.txHash !== txHash);
  localStorage.setItem(LS_KEY, JSON.stringify(all));
}

/* ─── colour palette per score ──────────────────────────────────────── */
function palette(score: number) {
  if (score >= 80) return {
    primary: "#10b981", secondary: "#06b6d4",
    glow: "rgba(16,185,129,0.4)", dim: "rgba(16,185,129,0.07)",
    art1: "#064e3b", art2: "#065f46", art3: "#0d9488",
    grade: "S", gradeLabel: "Expert",
  };
  if (score >= 60) return {
    primary: "#f59e0b", secondary: "#fb923c",
    glow: "rgba(245,158,11,0.4)", dim: "rgba(245,158,11,0.07)",
    art1: "#451a03", art2: "#78350f", art3: "#d97706",
    grade: "A", gradeLabel: "Proficient",
  };
  return {
    primary: "#f43f5e", secondary: "#e879f9",
    glow: "rgba(244,63,94,0.4)", dim: "rgba(244,63,94,0.07)",
    art1: "#4c0519", art2: "#881337", art3: "#e11d48",
    grade: "B", gradeLabel: "Learning",
  };
}

/* ─── SVG score arc ─────────────────────────────────────────────────── */
function ScoreArc({ score, color }: { score: number; color: string }) {
  const r = 26, cx = 32, cy = 32;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ * 0.25}
        strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle"
        fill="white" fontSize="13" fontWeight="900" fontFamily="system-ui">
        {score}
      </text>
    </svg>
  );
}

/* ─── Generative art banner (SVG) ───────────────────────────────────── */
function ArtBanner({ topic, score }: { topic: string; score: number }) {
  const p = palette(score);
  const initials = topic.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <svg width="100%" height="120" viewBox="0 0 320 120" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id={`bg-${score}`} cx="30%" cy="40%" r="70%">
          <stop offset="0%" stopColor={p.art2} />
          <stop offset="100%" stopColor={p.art1} />
        </radialGradient>
        <radialGradient id={`orb-${score}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={p.primary} stopOpacity="0.6" />
          <stop offset="100%" stopColor={p.primary} stopOpacity="0" />
        </radialGradient>
        <filter id={`glow-${score}`}>
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Base */}
      <rect width="320" height="120" fill={`url(#bg-${score})`} />
      {/* Grid lines */}
      {[0,1,2,3,4,5,6,7].map((i) => (
        <line key={`v${i}`} x1={i*46} y1="0" x2={i*46} y2="120" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      {[0,1,2,3].map((i) => (
        <line key={`h${i}`} x1="0" y1={i*40} x2="320" y2={i*40} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      {/* Orb glow */}
      <circle cx="240" cy="60" r="80" fill={`url(#orb-${score})`} />
      <circle cx="80" cy="100" r="60" fill={p.primary} fillOpacity="0.06" />
      {/* Decorative circles */}
      <circle cx="240" cy="60" r="48" fill="none" stroke={p.primary} strokeOpacity="0.15" strokeWidth="1" />
      <circle cx="240" cy="60" r="30" fill="none" stroke={p.primary} strokeOpacity="0.25" strokeWidth="1" />
      <circle cx="240" cy="60" r="14" fill={p.primary} fillOpacity="0.2" filter={`url(#glow-${score})`} />
      {/* Initials */}
      <text x="36" y="68" fill="white" fontSize="42" fontWeight="900" fontFamily="system-ui"
        opacity="0.12" letterSpacing="-2">{initials}</text>
      <text x="32" y="65" fill="white" fontSize="38" fontWeight="900" fontFamily="system-ui"
        opacity="0.9" letterSpacing="-2" filter={`url(#glow-${score})`}>{initials}</text>
      {/* Grade badge */}
      <rect x="258" y="18" width="42" height="22" rx="6" fill={p.primary} fillOpacity="0.2"
        stroke={p.primary} strokeOpacity="0.4" strokeWidth="1" />
      <text x="279" y="33" fill={p.primary} fontSize="11" fontWeight="800" fontFamily="system-ui"
        textAnchor="middle">{p.gradeLabel}</text>
      {/* Scan line */}
      <rect x="0" y="0" width="320" height="2" fill={p.primary} fillOpacity="0.3" />
    </svg>
  );
}

/* ─── HoloCard ────────────────────────────────────────────────────────── */
function HoloCard({ nft, index, onRemove }: { nft: StoredNFT; index: number; onRemove: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hov, setHov] = useState(false);
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const p = palette(nft.score);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
  };
  const rx = hov ? (pos.y - 0.5) * -15 : 0;
  const ry = hov ? (pos.x - 0.5) * 15 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.85, rotateX: -10 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      transition={{ delay: index * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="group relative"
      style={{ perspective: "1000px" }}
    >
      {/* Holo border — animates on hover */}
      <div className={`absolute -inset-[1.5px] rounded-[18px] opacity-0 transition-opacity duration-500 group-hover:opacity-100 nft-holo-border`} />

      {/* Card body */}
      <div
        ref={ref}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => { setHov(false); setPos({ x: 0.5, y: 0.5 }); }}
        onMouseMove={onMove}
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${rx}deg) rotateY(${ry}deg) translateZ(${hov ? 12 : 0}px)`,
          transition: hov ? "transform 0.1s ease, box-shadow 0.3s ease" : "transform 0.6s ease, box-shadow 0.3s ease",
          boxShadow: hov
            ? `0 40px 80px -12px ${p.glow}, 0 0 60px -20px ${p.glow}`
            : "0 8px 32px rgba(0,0,0,0.6)",
        }}
        className="relative overflow-hidden rounded-2xl bg-[#0d0d0d] select-none"
      >
        {/* Art banner */}
        <div className="relative overflow-hidden">
          <ArtBanner topic={nft.topic} score={nft.score} />
          {/* Scan line animation on hover */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-white/30 to-transparent"
              style={{ animation: hov ? "scan-line 1.5s linear infinite" : "none" }} />
          </div>
          {/* Mouse sheen */}
          <div className="pointer-events-none absolute inset-0"
            style={{
              opacity: hov ? 1 : 0,
              background: `radial-gradient(circle at ${pos.x * 100}% ${pos.y * 100}%, rgba(255,255,255,0.12) 0%, transparent 50%)`,
              transition: "opacity 0.3s",
            }} />
          {/* Remove button — appears on hover */}
          <AnimatePresence>
            {hov && !confirmDelete && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDelete(true); }}
                className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white/50 backdrop-blur-sm transition hover:bg-red-500/80 hover:text-white"
                title="Remove from collection"
              >
                <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3">
                  <path d="M12 4 4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </motion.button>
            )}
            {confirmDelete && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                className="absolute inset-x-2.5 top-2.5 flex items-center gap-1.5 rounded-xl bg-black/80 px-3 py-2 backdrop-blur-sm"
              >
                <span className="flex-1 text-[10px] font-semibold text-white/60">Remove NFT?</span>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}
                  className="rounded-lg bg-red-500/80 px-2.5 py-1 text-[10px] font-bold text-white transition hover:bg-red-500"
                >
                  Remove
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDelete(false); }}
                  className="rounded-lg bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/50 transition hover:bg-white/20"
                >
                  Cancel
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 pt-4">
          {/* Chain badge + date row */}
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] text-white/20">
              {new Date(nft.mintedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>

          {/* Topic + score row */}
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-white/25">
                Proof of Learning
              </p>
              <h3 className="text-[1.05rem] font-black leading-tight tracking-tight text-white">
                {nft.topic}
              </h3>
            </div>
            <div className="shrink-0">
              <ScoreArc score={nft.score} color={p.primary} />
            </div>
          </div>

          {/* Divider */}
          <div className="mb-4 h-px" style={{ background: `linear-gradient(90deg, ${p.primary}30, transparent)` }} />

          {/* Tx hash (display only) */}
          <div
            className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5 shrink-0 text-white/20" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
            </svg>
            <span className="flex-1 truncate font-mono text-[10px] text-white/30">
              {nft.txHash.slice(0, 14)}…{nft.txHash.slice(-10)}
            </span>
            <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 shrink-0 text-white/20 transition group-hover:text-white/50">
              <path d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
              <path d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
            </svg>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── tiny stat chip ──────────────────────────────────────────────────── */
function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-lg font-black tracking-tight text-white">{value}</span>
      <span className="text-[10px] uppercase tracking-[0.12em] text-white/25">{label}</span>
    </div>
  );
}

function Meta({ icon, text, href }: { icon: React.ReactNode; text: string; href?: string }) {
  const cls = "flex items-center gap-2 text-xs text-white/25 transition hover:text-white/50";
  const inner = <><span className="text-white/15">{icon}</span>{text}</>;
  return href
    ? <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
    : <span className={cls}>{inner}</span>;
}

/* ─── page ────────────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const { user, loading: authLoading, signIn, signOut } = useGitHubAuth();
  const { walletAddress, connecting, connectWallet, walletOptions } = useWallet();

  const [params, setParams] = useState({ topic: "", score: 0 });
  const [minting, setMinting] = useState(false);
  const [mintErr, setMintErr] = useState("");
  const [justMinted, setJustMinted] = useState<StoredNFT | null>(null);
  const [nfts, setNfts] = useState<StoredNFT[]>([]);

  const handleRemoveNFT = (txHash: string) => {
    removeNFT(txHash);
    setNfts(loadNFTs());
  };

  const [resumeCopied, setResumeCopied] = useState(false);
  const copyResume = async () => {
    const snippet = `${user!.name} (@${user!.login})\n${user!.bio ?? ""}\nTop score: ${nfts.length ? Math.max(...nfts.map((n) => n.score)) : 0}/100 · NFTs: ${nfts.length}\n${user!.html_url}`;
    try {
      await navigator.clipboard.writeText(snippet);
      setResumeCopied(true);
      setTimeout(() => setResumeCopied(false), 2500);
    } catch {
      setResumeCopied(false);
    }
  };

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setParams({ topic: p.get("topic") || "", score: Number(p.get("score") || 0) });
    setNfts(loadNFTs());
  }, []);

  const mint = async () => {
    if (!walletAddress) return;
    setMinting(true); setMintErr(""); setJustMinted(null);
    try {
      const res = await fetch("/api/mint-nft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, topic: params.topic, score: params.score, resourceUrl: window.location.href }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Minting failed");
      const nft: StoredNFT = {
        id: data.txHash,
        topic: params.topic,
        score: params.score,
        txHash: data.txHash,
        metadataURI: data.metadataURI,
        mintedAt: new Date().toISOString(),
        wallet: walletAddress,
      };
      saveNFT(nft);
      setNfts(loadNFTs());
      setJustMinted(nft);
    } catch (e) {
      setMintErr(e instanceof Error ? e.message : "Minting failed");
    } finally { setMinting(false); }
  };

  /* ── Not signed in ─────────────────────────────────────────────── */
  if (!authLoading && !user) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ ease: "easeOut", duration: 0.5 }}
          className="w-full max-w-sm text-center"
        >
          <div className="mb-6 flex justify-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/[0.07] bg-white/[0.03]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} className="h-7 w-7 text-white/20">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
          </div>
          <h2 className="mb-2 text-xl font-black text-white">Your Profile</h2>
          <p className="mb-8 text-sm text-white/30">Sign in with GitHub to see your profile and mint Proof of Learning NFTs.</p>
          <motion.button whileTap={{ scale: 0.97 }} onClick={signIn}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-black transition hover:bg-white/90"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Sign in with GitHub
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (authLoading && !user) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-32 rounded-2xl bg-white/[0.03]" />
          <div className="h-48 rounded-2xl bg-white/[0.03]" />
        </div>
      </div>
    );
  }

  const avgScore = nfts.length
    ? Math.round(nfts.reduce((s, n) => s + n.score, 0) / nfts.length)
    : 0;
  const topScore = nfts.length ? Math.max(...nfts.map((n) => n.score)) : 0;

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <motion.div
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}
        initial="hidden" animate="show"
        className="flex flex-col gap-6"
      >
        {/* ── GitHub profile card ──────────────────────────────────── */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
          className="rounded-2xl border border-white/[0.07] bg-[#0d0d0d]"
        >
          {/* Banner + avatar overlap wrapper */}
          <div className="relative">
            <div className="h-24 w-full overflow-hidden rounded-t-2xl"
              style={{ background: "linear-gradient(135deg,#111 0%,#0a0a0a 100%)" }}>
              <div className="absolute inset-0" style={{
                backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",
                backgroundSize: "32px 32px"
              }} />
            </div>
            {/* Avatar pinned to the bottom of the banner — overflows downward into the content area */}
            <div className="absolute bottom-0 left-6 translate-y-1/2">
              <Image src={user!.avatar_url} alt={user!.login} width={84} height={84}
                className="rounded-2xl border-[3px] border-[#0d0d0d] shadow-2xl" />
            </div>
          </div>

          <div className="px-6 pb-6 pt-14">
            <div className="mb-4 flex items-center justify-end">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-[10px] font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Connected
                </span>
                <button onClick={signOut} className="rounded-lg px-3 py-1 text-[11px] text-white/20 transition hover:text-white/50">
                  Sign out
                </button>
              </div>
            </div>
            <h2 className="mb-0.5 text-xl font-black tracking-tight text-white">{user!.name}</h2>
            <a href={user!.html_url} target="_blank" rel="noopener noreferrer"
              className="mb-3 block text-sm text-white/30 transition hover:text-white/50">@{user!.login}</a>
            {user!.bio && <p className="mb-4 text-sm leading-relaxed text-white/40">{user!.bio}</p>}
            <div className="mb-5 flex flex-wrap gap-4">
              {user!.location && <Meta icon={<svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3"><path d="M8 0a5 5 0 0 0-5 5c0 3.75 5 11 5 11s5-7.25 5-11a5 5 0 0 0-5-5Zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z"/></svg>} text={user!.location} />}
              {user!.company && <Meta icon={<svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3"><path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h11A1.5 1.5 0 0 1 15 2.5v11a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 13.5v-11ZM6 4v1.5h1V4H6Zm3 0v1.5h1V4H9ZM6 7v1.5h1V7H6Zm3 0v1.5h1V7H9ZM5 11h6v-2.5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0-.5.5V11Z"/></svg>} text={user!.company.replace(/^@/, "")} />}
              {user!.blog && <Meta icon={<svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3"><path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0ZM4.5 7.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5Z"/></svg>} text={user!.blog.replace(/^https?:\/\//, "")} href={user!.blog.startsWith("http") ? user!.blog : `https://${user!.blog}`} />}
              {user!.twitter_username && <Meta icon={<svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3"><path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z"/></svg>} text={`@${user!.twitter_username}`} href={`https://twitter.com/${user!.twitter_username}`} />}
            </div>
            <div className="flex gap-8 border-t border-white/[0.05] pt-5">
              <Stat value={user!.public_repos} label="Repos" />
              <Stat value={user!.followers} label="Followers" />
              <Stat value={user!.following} label="Following" />
              {nfts.length > 0 && <>
                <div className="h-8 w-px bg-white/[0.05] self-center" />
                <Stat value={nfts.length} label="NFTs" />
                <Stat value={`${avgScore}/100`} label="Avg Score" />
              </>}
            </div>
          </div>
        </motion.div>

        {/* ── Mint CTA ──────────────────────────────────────────────── */}
        {params.topic && (
          <motion.div
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
            className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d0d0d]"
          >
            {/* Score accent glow */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${palette(params.score).primary}80, transparent)` }} />
            <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full blur-3xl"
              style={{ background: palette(params.score).dim }} />

            <div className="relative px-6 py-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Mint Proof of Learning</h3>
                  <p className="mt-0.5 text-xs text-white/30">
                    <span className="text-white/60">{params.topic}</span>
                    {" — Score: "}
                    <span style={{ color: palette(params.score).primary }}>{params.score}/100</span>
                  </p>
                </div>
                <ScoreArc score={params.score} color={palette(params.score).primary} />
              </div>

              {walletAddress ? (
                <div className="mb-4 flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                  <span className="min-w-0 flex-1 truncate font-mono text-sm text-white/60">{walletAddress}</span>
                  <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/30">Sepolia</span>
                </div>
              ) : (
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => connectWallet()}
                  disabled={connecting || walletOptions.length === 0}
                  className="mb-4 h-11 w-full rounded-xl border border-white/[0.07] bg-white/[0.03] text-sm font-bold text-white transition hover:bg-white/[0.06] disabled:opacity-40"
                >
                  {connecting ? "Connecting…" : walletOptions.length === 0 ? "Install MetaMask to continue" : "Connect Wallet →"}
                </motion.button>
              )}

              <motion.button whileTap={{ scale: 0.97 }} onClick={mint}
                disabled={minting || !walletAddress || !!justMinted}
                className="relative h-12 w-full overflow-hidden rounded-xl text-sm font-bold text-black transition disabled:opacity-40"
                style={{ background: justMinted ? "#10b981" : "white" }}
              >
                {minting && (
                  <span className="absolute inset-0 flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="black" strokeOpacity="0.2" strokeWidth="3"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="black" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                    Minting on Sepolia…
                  </span>
                )}
                {!minting && (justMinted ? "✓ Minted!" : "Mint Proof of Learning →")}
              </motion.button>

              {mintErr && <p className="mt-3 text-xs text-red-400">{mintErr}</p>}

              <AnimatePresence>
                {justMinted && (
                  <motion.a initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    href={`https://sepolia.etherscan.io/tx/${justMinted.txHash}`}
                    target="_blank" rel="noopener noreferrer"
                    className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs text-emerald-400 transition hover:bg-emerald-500/10"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
                      <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                    </svg>
                    <span className="flex-1">NFT minted — view on Etherscan</span>
                    <span className="font-mono text-[10px] text-emerald-600">{justMinted.txHash.slice(0, 12)}…</span>
                    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 shrink-0 opacity-50">
                      <path d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/><path d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
                    </svg>
                  </motion.a>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* ── NFT Collection ──────────────────────────────────────────── */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
        >
          {/* Section header */}
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/20">On-chain</p>
              <h3 className="text-xl font-black tracking-tight text-white">Proof of Learning Collection</h3>
            </div>
            {nfts.length > 0 && (
              <div className="flex items-center gap-5">
                <div className="text-right">
                  <p className="text-xl font-black text-white">{nfts.length}</p>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-white/20">Credentials</p>
                </div>
                <div className="h-8 w-px bg-white/[0.06]" />
                <div className="text-right">
                  <p className="text-xl font-black" style={{ color: palette(topScore).primary }}>{topScore}</p>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-white/20">Best Score</p>
                </div>
              </div>
            )}
          </div>

          {nfts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-white/[0.06] py-20 text-center">
              <div className="relative">
                <div className="grid h-16 w-16 place-items-center rounded-2xl border border-white/[0.07] bg-white/[0.02]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} className="h-7 w-7 text-white/15">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="mb-1 text-sm font-semibold text-white/30">No credentials yet</p>
                <p className="text-xs text-white/15">Complete a learning path, pass the assessment, and mint your first NFT.</p>
              </div>
              <a href="/dashboard"
                className="mt-1 inline-flex h-9 items-center rounded-xl bg-white px-5 text-xs font-bold text-black transition hover:bg-white/90"
              >
                Start Learning →
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {nfts.map((nft, i) => (
                <motion.div
                  key={nft.id}
                  layout
                  exit={{ opacity: 0, scale: 0.85, y: -10 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link href={`/profile/nft/${nft.txHash}`} className="block">
                    <HoloCard nft={nft} index={i} onRemove={() => handleRemoveNFT(nft.txHash)} />
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

      </motion.div>
    </div>
  );
}
