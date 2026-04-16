"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type StoredNFT = {
  id: string;
  topic: string;
  score: number;
  txHash: string;
  metadataURI: string;
  mintedAt: string;
  wallet: string;
};

const LS_KEY = "learnloop_nfts";
function loadNFTs(): StoredNFT[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}

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
      <rect width="320" height="120" fill={`url(#bg-${score})`} />
      {[0,1,2,3,4,5,6,7].map((i) => (
        <line key={`v${i}`} x1={i*46} y1="0" x2={i*46} y2="120" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      {[0,1,2,3].map((i) => (
        <line key={`h${i}`} x1="0" y1={i*40} x2="320" y2={i*40} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      <circle cx="240" cy="60" r="80" fill={`url(#orb-${score})`} />
      <circle cx="80" cy="100" r="60" fill={p.primary} fillOpacity="0.06" />
      <circle cx="240" cy="60" r="48" fill="none" stroke={p.primary} strokeOpacity="0.15" strokeWidth="1" />
      <circle cx="240" cy="60" r="30" fill="none" stroke={p.primary} strokeOpacity="0.25" strokeWidth="1" />
      <circle cx="240" cy="60" r="14" fill={p.primary} fillOpacity="0.2" filter={`url(#glow-${score})`} />
      <text x="36" y="68" fill="white" fontSize="42" fontWeight="900" fontFamily="system-ui"
        opacity="0.12" letterSpacing="-2">{initials}</text>
      <text x="32" y="65" fill="white" fontSize="38" fontWeight="900" fontFamily="system-ui"
        opacity="0.9" letterSpacing="-2" filter={`url(#glow-${score})`}>{initials}</text>
      <rect x="258" y="18" width="42" height="22" rx="6" fill={p.primary} fillOpacity="0.2"
        stroke={p.primary} strokeOpacity="0.4" strokeWidth="1" />
      <text x="279" y="33" fill={p.primary} fontSize="11" fontWeight="800" fontFamily="system-ui"
        textAnchor="middle">{p.gradeLabel}</text>
      <rect x="0" y="0" width="320" height="2" fill={p.primary} fillOpacity="0.3" />
    </svg>
  );
}

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

/* ─── Skills mapping from topics ──────────────────────────────────────── */
const SKILLS_MAP: Record<string, string[]> = {
  "binary search": ["algorithms", "data structures", "problem solving", "optimization"],
  "depth first search": ["graph algorithms", "tree traversal", "backtracking", "recursion"],
  "breadth first search": ["graph algorithms", "shortest path", "tree traversal", "level order"],
  "sorting algorithms": ["algorithms", "efficiency", "big o notation", "data manipulation"],
  "dynamic programming": ["algorithms", "optimization", "problem solving", "recursion"],
  "graph theory": ["algorithms", "data structures", "optimization", "network analysis"],
  "linked lists": ["data structures", "memory management", "pointer logic", "traversal"],
  "arrays": ["data structures", "indexing", "time complexity", "space optimization"],
  "trees": ["data structures", "hierarchy", "recursion", "tree traversal"],
  "stacks": ["data structures", "lifo", "function calls", "parsing"],
  "queues": ["data structures", "fifo", "scheduling", "buffering"],
  "hash tables": ["data structures", "hashing", "collision resolution", "lookup optimization"],
  "heaps": ["data structures", "priority queues", "sorting", "heap sort"],
  "react": ["frontend", "javascript", "component architecture", "state management"],
  "controllers": ["backend", "architecture", "request handling", "route management"],
  "rest api": ["backend", "api design", "http methods", "web services"],
  "sql": ["databases", "query optimization", "data manipulation", "relational databases"],
  "mongodb": ["databases", "nosql", "document storage", "scalability"],
  "authentication": ["security", "user management", "encryption", "session handling"],
  "authorization": ["security", "access control", "permissions", "role management"],
  "deployment": ["devops", "infrastructure", "ci/cd", "cloud services"],
  "docker": ["devops", "containerization", "infrastructure", "deployment"],
  "typescript": ["programming", "type safety", "object oriented", "code quality"],
  "javascript": ["programming", "frontend", "web development", "asynchronous"],
  "python": ["programming", "data science", "automation", "backend development"],
  "java": ["programming", "object oriented", "enterprise", "performance"],
  "git": ["version control", "collaboration", "source management", "branching"],
  "testing": ["quality assurance", "reliability", "debugging", "automation"],
  "machine learning": ["ai", "data science", "prediction", "neural networks"],
  "blockchain": ["web3", "cryptocurrency", "smart contracts", "decentralization"],
};

function extractSkills(topic: string): string[] {
  const lowerTopic = topic.toLowerCase();
  
  // Direct match
  for (const [key, skills] of Object.entries(SKILLS_MAP)) {
    if (lowerTopic.includes(key)) {
      return skills;
    }
  }
  
  // Partial word matching
  const words = lowerTopic.split(/\s+/);
  const allSkills = new Set<string>();
  
  for (const word of words) {
    for (const [key, skills] of Object.entries(SKILLS_MAP)) {
      if (key.includes(word) || word.includes(key.split(" ")[0])) {
        skills.forEach(s => allSkills.add(s));
      }
    }
  }
  
  if (allSkills.size > 0) {
    return Array.from(allSkills).slice(0, 5);
  }
  
  // Default skills based on generic patterns
  if (lowerTopic.includes("algorithm") || lowerTopic.includes("data")) {
    return ["problem solving", "algorithm design", "code efficiency", "critical thinking"];
  }
  if (lowerTopic.includes("programming") || lowerTopic.includes("code")) {
    return ["programming", "problem solving", "code quality", "debugging"];
  }
  
  return ["learning", "skill development", "course completion"];
}

export default function NFTDetailPage() {
  const params = useParams();
  const tx = params?.txHash ?? "";
  const [nft, setNft] = useState<StoredNFT | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [pageUrl, setPageUrl] = useState("");

  useEffect(() => {
    if (!tx) return;
    const all = loadNFTs();
    const found = all.find((n) => n.txHash === tx || n.id === tx);
    setNft(found ?? null);
    setPageUrl(window.location.href);
  }, [tx]);

  const copy = async (text: string, tag: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(tag);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  if (!nft) {
    return (
      <div className="mx-auto w-full max-w-2xl px-6 py-20 text-center">
        <p className="mb-4 text-sm text-white/40">NFT not found in local storage.</p>
        <Link href="/profile" className="inline-block rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black">
          Back to profile
        </Link>
      </div>
    );
  }

  const p = palette(nft.score);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-6">
        <Link href="/profile" className="inline-flex items-center gap-1 text-sm text-white/40 hover:text-white/60">
          ← Back to profile
        </Link>
      </div>

      <div className="rounded-2xl border border-white/[0.07] bg-[#0d0d0d] overflow-hidden">
        {/* Art banner */}
        <div className="relative overflow-hidden">
          <ArtBanner topic={nft.topic} score={nft.score} />
        </div>

        {/* Card body */}
        <div className="px-6 pb-6 pt-5">
          {/* Chain badge + date row */}
          <div className="mb-4 flex items-center justify-between">
            <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.15em] text-white/40">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.primary }} />
              Sepolia
            </span>
            <span className="text-[10px] text-white/20">
              {new Date(nft.mintedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>

          {/* Topic + score row */}
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-white/25">
                Proof of Learning
              </p>
              <h2 className="text-2xl font-black leading-tight tracking-tight text-white">
                {nft.topic}
              </h2>
            </div>
            <div className="shrink-0">
              <ScoreArc score={nft.score} color={p.primary} />
            </div>
          </div>

          {/* Skills section */}
          <div className="mb-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-white/40">
              Skills Gained
            </p>
            <div className="flex flex-wrap gap-2">
              {extractSkills(nft.topic).map((skill) => (
                <span key={skill} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70">
                  <span className="h-1 w-1 rounded-full" style={{ background: p.primary }} />
                  {skill.charAt(0).toUpperCase() + skill.slice(1)}
                </span>
              ))}
            </div>
          </div>

          {/* Details grid */}
          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="text-xs text-white/30 mb-2">Score</div>
              <div className="text-2xl font-black" style={{ color: p.primary }}>{nft.score}/100</div>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="text-xs text-white/30 mb-2">Wallet</div>
              <code className="text-sm font-mono text-white/50 break-all">{nft.wallet.slice(0, 12)}…{nft.wallet.slice(-10)}</code>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:col-span-2">
              <div className="text-xs text-white/30 mb-2">Transaction Hash</div>
              <code className="text-sm font-mono text-white/50 break-all">{nft.txHash}</code>
            </div>
          </div>

          {/* Actions */}
          <div className="mb-6 flex flex-wrap gap-3">
            <a href={`https://sepolia.etherscan.io/tx/${nft.txHash}`} target="_blank" rel="noreferrer"
               className="rounded-lg border border-white/8 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/60 hover:bg-white/10 transition">
              View on Etherscan ↗
            </a>
            <button onClick={() => copy(pageUrl, "pagelink")}
              className="rounded-lg border border-white/8 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/60 hover:bg-white/10 transition">
              {copied === "pagelink" ? "✓ Link copied" : "Copy page link"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
