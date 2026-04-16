"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { listSessions, deleteSession, type SessionDoc } from "@/lib/appwrite";

// ─── helpers ─────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function cardCount(json: string) {
  try { return (JSON.parse(json)?.cards?.length as number) || 0; } catch { return 0; }
}
function nodeCount(json: string) {
  try { return (JSON.parse(json)?.nodes?.length as number) || 0; } catch { return 0; }
}

// ─── Card ────────────────────────────────────────────────────────────────────
function SessionCard({ session, onDelete }: { session: SessionDoc; onDelete: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const fc = cardCount(session.flashcardsJson);
  const nc = nodeCount(session.conceptMapJson);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Remove this session from your history?")) return;
    setDeleting(true);
    try {
      await deleteSession(session.$id);
      onDelete(session.$id);
    } catch {
      setDeleting(false);
    }
  };

  const revisitHref = `/learn?session=${session.$id}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.22 }}
      className="group relative flex flex-col rounded-2xl border border-white/8 bg-white/3 overflow-hidden hover:border-white/16 hover:bg-white/5 transition-all duration-200"
    >
      {/* Thumbnail */}
      <div className="relative h-36 w-full shrink-0 bg-[#111] overflow-hidden">
        {session.thumbnail && !imgErr ? (
          <Image
            src={session.thumbnail}
            alt={session.videoTitle || "thumbnail"}
            fill
            className="object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.4">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="m10 8 5 4-5 4V8z" />
            </svg>
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-linear-to-t from-[#0a0a0a]/80 to-transparent" />

        {/* Topic badge */}
        {session.topic && (
          <span className="absolute bottom-2 left-2 rounded-full border border-white/12 bg-black/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/70 backdrop-blur-sm">
            {session.topic}
          </span>
        )}

        {/* Score badge */}
        {session.score !== undefined && session.score >= 0 && (
          <span
            className={`absolute bottom-2 right-2 rounded-full px-2.5 py-0.5 text-[10px] font-bold border backdrop-blur-sm ${
              session.score >= 70
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-rose-500/30 bg-rose-500/10 text-rose-400"
            }`}
          >
            {session.score}/100
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 p-4">
        {/* Title */}
        <div>
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-white/90">
            {session.videoTitle || "Learning Session"}
          </p>
          {session.channelName && (
            <p className="mt-0.5 text-[11px] text-white/35">{session.channelName}</p>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3">
          <Stat icon={<FlashIcon />} label={`${fc} cards`} />
          <Stat icon={<NodeIcon />} label={`${nc} concepts`} />
          {session.assessmentJson ? (
            <Stat icon={<CheckIcon />} label="Assessed" positive />
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/6 pt-3">
          <span className="text-[11px] text-white/30" title={fmtDate(session.$createdAt)}>
            {timeAgo(session.$createdAt)}
          </span>

          <div className="flex items-center gap-2">
            {/* Delete */}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/25 transition hover:bg-white/8 hover:text-rose-400 disabled:opacity-40"
              title="Delete session"
            >
              {deleting ? (
                <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                </svg>
              )}
            </button>

            {/* Revisit */}
            <Link
              href={revisitHref}
              className="flex h-7 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-[11px] font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              Revisit →
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Tiny stat chips ──────────────────────────────────────────────────────────
function Stat({ icon, label, positive }: { icon: React.ReactNode; label: string; positive?: boolean }) {
  return (
    <div className={`flex items-center gap-1 text-[11px] ${positive ? "text-emerald-400/70" : "text-white/30"}`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}
function FlashIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}
function NodeIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="5" r="2" />
      <circle cx="5" cy="19" r="2" />
      <circle cx="19" cy="19" r="2" />
      <path d="M12 7v4M7 17l5-6M17 17l-5-6" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-6 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/8 bg-white/3">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </div>
      <div>
        <p className="text-base font-semibold text-white/60">No sessions yet</p>
        <p className="mt-1 text-sm text-white/30">
          Start learning from a YouTube video — your history will appear here.
        </p>
      </div>
      <Link
        href="/"
        className="h-10 rounded-xl border border-white/10 bg-white/5 px-5 text-sm font-semibold text-white/70 leading-10 hover:bg-white/10 hover:text-white transition"
      >
        Start Learning →
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listSessions(50)
      .then((res) => {
        const docs = res.documents as unknown as SessionDoc[];
        // ensure newest-first order by created timestamp
        const sorted = docs.slice().sort((a, b) => {
          return new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime();
        });
        setSessions(sorted);
      })
      .catch(() => setError("Could not load history. Check your Appwrite setup."))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = (id: string) =>
    setSessions((prev) => prev.filter((s) => s.$id !== id));

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="border-b border-white/6 bg-[#080808]/90 sticky top-0 z-20 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/50 hover:text-white transition">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white">Learning History</h1>
              {!loading && sessions.length > 0 && (
                <p className="text-[11px] text-white/35">{sessions.length} session{sessions.length !== 1 ? "s" : ""}</p>
              )}
            </div>
          </div>
          <Link
            href="/"
            className="flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-[11px] font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12l7-7 7 7" />
            </svg>
            New Session
          </Link>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-5xl px-5 py-8">
        {loading && (
          <div className="flex flex-col items-center gap-4 py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-white/50" />
            <p className="text-sm text-white/30">Loading your history…</p>
          </div>
        )}

        {error && (
          <div className="mx-auto max-w-md rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 text-center">
            <p className="text-sm font-semibold text-rose-400">{error}</p>
            <p className="mt-2 text-xs text-white/35">
              Make sure you have run <code className="rounded bg-white/8 px-1 py-0.5">/api/appwrite/setup</code> once.
            </p>
          </div>
        )}

        {!loading && !error && sessions.length === 0 && <EmptyState />}

        {!loading && !error && sessions.length > 0 && (
          <AnimatePresence mode="popLayout">
            <motion.div
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {sessions.map((s) => (
                <SessionCard key={s.$id} session={s} onDelete={handleDelete} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
