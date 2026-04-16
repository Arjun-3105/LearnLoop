"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useGitHubAuth } from "@/hooks/useGitHubAuth";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import type { ScanEvent } from "@/app/api/assess-repo/stream/route";
import { ReportModal } from "@/components/ReportModal";
import { updateSession } from "@/lib/appwrite";

/* ─── types ──────────────────────────────────────────────────────────── */
type Assignment = {
  title: string; description: string;
  requirements: string[]; checkpoints?: string[]; hint: string; topic: string;
};
type AssessmentResultData = {
  score: number; passed: boolean;
  checklist: { requirement: string; met: boolean; comment: string }[];
  strengths: string[]; gaps: string[]; nextTopic: string; overallFeedback: string;
};
type Repo = { name: string; fullName: string; url: string; private: boolean };

/* ─── log entry ──────────────────────────────────────────────────────── */
type LogEntry = {
  id: number;
  kind: "info" | "file" | "pass" | "warn" | "fail" | "check" | "ai" | "dim";
  text: string;
  sub?: string;
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { ease: "easeOut", duration: 0.45 } },
};

/* ─── log colours ────────────────────────────────────────────────────── */
const KIND_STYLE: Record<LogEntry["kind"], string> = {
  info:  "text-xl text-[#666]",
  file:  "text-xl text-[#aaa]",
  pass:  "text-xl text-emerald-400",
  warn:  "text-xl text-amber-400",
  fail:  "text-xl text-rose-400",
  check: "text-xl text-sky-400",
  ai:    "text-xl text-violet-400",
  dim:   "text-xl text-[#3a3a3a]",
};

const KIND_PREFIX: Record<LogEntry["kind"], string> = {
  info:  "›",
  file:  "  ·",
  pass:  "  ✓",
  warn:  "  ⚠",
  fail:  "  ✗",
  check: "  ⧖",
  ai:    "  ✦",
  dim:   "  —",
};

let logId = 0;
function mkLog(kind: LogEntry["kind"], text: string, sub?: string): LogEntry {
  return { id: logId++, kind, text, sub };
}

/* ─── component ──────────────────────────────────────────────────────── */
export default function AssessPage() {
  const router = useRouter();
  const { user, loading: authLoading, signIn, signOut } = useGitHubAuth();
  const logEndRef = useRef<HTMLDivElement>(null);

  /* Assignment + session from URL */
  const [assignmentQuery, setAssignmentQuery] = useState("");
  const [appwriteSessionId, setAppwriteSessionId] = useState("");
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setAssignmentQuery(p.get("assignment") || "");
    setAppwriteSessionId(p.get("session") || "");
    const ghError = p.get("gh_error");
    if (ghError) setError(`GitHub auth failed: ${ghError}`);
  }, []);

  const assignment = useMemo<Assignment | null>(() => {
    if (!assignmentQuery) return null;
    try { return JSON.parse(assignmentQuery); } catch { return null; }
  }, [assignmentQuery]);

  /* Repos */
  const [repos, setRepos]         = useState<Repo[]>([]);
  const [repoUrl, setRepoUrl]     = useState("");
  const [loadingRepos, setLoadingRepos] = useState(false);

  /* Scan state */
  const [scanning, setScanning]   = useState(false);
  const [logs, setLogs]           = useState<LogEntry[]>([]);
  const [result, setResult]       = useState<AssessmentResultData | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [error, setError]         = useState("");
  const [scanPhase, setScanPhase] = useState<"idle" | "tree" | "security" | "files" | "checkpoints" | "ai" | "done">("idle");

  /* Auto-scroll log */
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  /* Auto-fetch repos */
  useEffect(() => {
    if (!user) { setRepos([]); setRepoUrl(""); return; }
    setLoadingRepos(true);
    fetch("/api/github-repos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
      .then((r) => r.json())
      .then((d) => {
        const list: Repo[] = d.repos ?? [];
        setRepos(list);
        if (list[0]) setRepoUrl(list[0].url);
      })
      .catch(() => setError("Could not fetch repositories"))
      .finally(() => setLoadingRepos(false));
  }, [user]);

  const addLog = (entry: LogEntry) =>
    setLogs((prev) => [...prev, entry]);

  /* ── run assessment ──────────────────────────────────────────────── */
  const runAssessment = async () => {
    if (!assignment) { setError("No assignment context — go back to Learn."); return; }
    if (!repoUrl)    { setError("Please select or paste a repository URL."); return; }

    setScanning(true);
    setError("");
    setResult(null);
    setLogs([]);
    setScanPhase("tree");

    try {
      const res = await fetch("/api/assess-repo/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl, assignment }),
      });

      if (!res.body) throw new Error("No response stream");

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const chunk of lines) {
          const line = chunk.replace(/^data: /, "").trim();
          if (!line) continue;

          let event: ScanEvent;
          try { event = JSON.parse(line); } catch { continue; }

          switch (event.type) {
            case "init":
              addLog(mkLog("info", `Scanning ${event.repoOwner}/${event.repoName}`));
              break;

            case "tree_start":
              setScanPhase("tree");
              addLog(mkLog("info", "Fetching repository tree…"));
              break;

            case "security_start":
              setScanPhase("security");
              addLog(mkLog("info", "Running security checks…"));
              break;

            case "security_check":
              addLog(mkLog(
                event.status === "pass" ? "pass" : event.status === "fail" ? "fail" : "warn",
                event.check,
                event.message,
              ));
              break;

            case "file_found":
              setScanPhase("files");
              addLog(mkLog("file", event.path, `${(event.size / 1024).toFixed(1)} kb`));
              break;

            case "tree_done":
              addLog(mkLog("info", `${event.count} source files indexed`));
              break;

            case "checkpoint_start":
              setScanPhase("checkpoints");
              addLog(mkLog("check", `[${event.index + 1}] ${event.requirement}`));
              break;

            case "ai_start":
              setScanPhase("ai");
              addLog(mkLog("ai", "Running AI deep analysis…"));
              break;

            case "ai_done":
              addLog(mkLog("ai", "Analysis complete"));
              break;

            case "result":
              setScanPhase("done");
              setResult(event.data);
              addLog(mkLog("info", `Score: ${event.data.score}/100 — ${event.data.passed ? "PASSED" : "NEEDS WORK"}`));
              setTimeout(() => setReportOpen(true), 600);
              if (appwriteSessionId) {
                updateSession(appwriteSessionId, {
                  assessmentJson: JSON.stringify(event.data),
                  score: event.data.score,
                }).catch(() => {});
              }
              break;

            case "error":
              setError(event.message);
              addLog(mkLog("fail", event.message));
              break;
          }
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Assessment failed";
      setError(msg);
      addLog(mkLog("fail", msg));
    } finally {
      setScanning(false);
    }
  };

  /* ─── phase label ─────────────────────────────────────────────────── */
  const PHASE_LABEL: Record<typeof scanPhase, string> = {
    idle:        "",
    tree:        "Fetching repository tree…",
    security:    "Running security checks…",
    files:       "Indexing source files…",
    checkpoints: "Mapping checkpoints…",
    ai:          "Running AI analysis…",
    done:        "Scan complete",
  };

  /* ─── render ──────────────────────────────────────────────────────── */
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <motion.div
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        initial="hidden" animate="show"
      >
        {/* Title */}
        <motion.div variants={fadeUp} className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-white">Code Assessment</h1>
          <p className="mt-2 text-sm text-[#555]">
            Connect GitHub, pick your repo, and we scan it live — checkpoint by checkpoint.
          </p>
          {assignment && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs font-semibold text-[#777]">
                {assignment.topic}
              </span>
              <span className="max-w-xs truncate rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-[#555]">
                {assignment.title}
              </span>
            </div>
          )}
        </motion.div>

        {/* ── STEP 1: GitHub auth ─────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="mb-4 rounded-2xl border border-white/[0.07] bg-[#0f0f0f]">
          <div className="border-b border-white/[0.06] px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#444]">
              Step 1 — GitHub Account
            </p>
          </div>
          <div className="px-5 py-4">
            {authLoading ? (
              <div className="flex items-center gap-2 text-xs text-[#555]">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border border-transparent border-t-white/30" />
                Checking auth…
              </div>
            ) : user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image src={user.avatar_url} alt={user.login} width={36} height={36} className="rounded-full" />
                  <div>
                    <p className="text-sm font-semibold text-white">{user.name}</p>
                    <p className="text-xs text-[#555]">@{user.login} · {user.public_repos} repos</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[10px] text-[#22c55e]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                    Connected
                  </span>
                  <button onClick={signOut} className="rounded-lg py-1 px-2 text-[11px] text-[#444] transition hover:text-[#888]">
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[#666]">Sign in to access your repos — including private ones.</p>
                <motion.button
                  whileTap={{ scale: 0.97 }} onClick={signIn}
                  className="flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black transition hover:bg-white/90"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  Sign in with GitHub
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── STEP 2: Repo selection ───────────────────────────────────── */}
        <AnimatePresence>
          {user && (
            <motion.div
              key="repos"
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: "easeOut" }}
              className="mb-4 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0f0f0f]"
            >
              <div className="border-b border-white/[0.06] px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#444]">
                  Step 2 — Select Repository
                </p>
              </div>
              <div className="px-5 py-4">
                {loadingRepos ? (
                  <div className="flex items-center gap-2 text-xs text-[#555]">
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border border-transparent border-t-white/30" />
                    Loading your repos…
                  </div>
                ) : repos.length > 0 ? (
                  <select
                    value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.07] bg-[#080808] px-3 py-2.5 text-sm text-[#ccc] outline-none focus:border-white/20 transition"
                  >
                    {repos.map((r) => (
                      <option key={r.fullName} value={r.url}>
                        {r.fullName}{r.private ? " 🔒" : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-[#555]">No repositories found.</p>
                )}
                <div className="mt-3">
                  <p className="mb-1.5 text-[10px] text-[#818181]">Or paste any URL directly</p>
                  <input
                    value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo"
                    className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#333] focus:border-white/20 transition"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Manual URL if not signed in */}
        {!user && !authLoading && (
          <motion.div variants={fadeUp} className="mb-4 rounded-2xl border border-white/[0.07] bg-[#0f0f0f] p-5">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#444]">
              Or paste a public repo URL directly
            </p>
            <input
              value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#333] focus:border-white/20 transition"
            />
          </motion.div>
        )}

        {/* ── Assess button ────────────────────────────────────────────── */}
        <motion.button
          variants={fadeUp} whileTap={{ scale: 0.98 }}
          onClick={runAssessment}
          disabled={scanning || !repoUrl}
          className="mb-6 h-11 w-full rounded-xl bg-white text-sm font-bold text-black transition hover:bg-gray-200 disabled:opacity-30"
        >
          {scanning ? "Scanning…" : "Scan & Assess Repository →"}
        </motion.button>

        {/* ── LIVE SCAN TERMINAL ───────────────────────────────────────── */}
        <AnimatePresence>
          {(scanning || logs.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-6 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#070707]"
            >
              {/* terminal header bar */}
              <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
                  </div>
                  <span className="ml-2 font-mono text-[10px] text-[#818181]">learnloop · scanner</span>
                </div>
                {scanning && (
                  <span className="flex items-center gap-1.5 font-mono text-[10px] text-[#555]">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    {PHASE_LABEL[scanPhase]}
                  </span>
                )}
                {!scanning && scanPhase === "done" && (
                  <span className="font-mono text-[10px] text-[#818181]">complete</span>
                )}
              </div>

              {/* log body */}
              <div className="max-h-72 overflow-y-auto px-4 py-3 font-mono text-[12px] leading-[1.7]">
                {logs.map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.18 }}
                    className="flex gap-2"
                  >
                    <span className={`shrink-0 select-none ${KIND_STYLE[entry.kind]}`}>
                      {KIND_PREFIX[entry.kind]}
                    </span>
                    <span className={KIND_STYLE[entry.kind]}>
                      {entry.text}
                      {entry.sub && (
                        <span className="ml-2 text-[#818181]">{entry.sub}</span>
                      )}
                    </span>
                  </motion.div>
                ))}

                {/* blinking cursor while scanning */}
                {scanning && (
                  <div className="flex gap-2">
                    <span className="shrink-0 text-[#818181]">›</span>
                    <span className="inline-block h-[14px] w-[7px] animate-pulse bg-white/20" />
                  </div>
                )}
                <div ref={logEndRef} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400"
          >
            {error}
          </motion.div>
        )}

        {/* Results summary bar + open report button */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/[0.07] bg-[#0f0f0f] p-5"
            >
              {/* score row */}
              <div className="mb-4 flex items-center gap-4">
                <div className="relative">
                  <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
                    <motion.circle
                      cx="28" cy="28" r="22" fill="none"
                      stroke={result.passed ? "#fff" : "#ef4444"}
                      strokeWidth="5" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 22}
                      initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 22 * (1 - result.score / 100) }}
                      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-black text-white">{result.score}</span>
                  </div>
                </div>
                <div>
                  <p className="text-base font-black text-white">
                    {result.passed ? "Passed ✓" : "Needs Work"}
                  </p>
                  <p className="text-xs text-[#555]">
                    {result.checklist.filter(c => c.met).length}/{result.checklist.length} checkpoints passed
                  </p>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setReportOpen(true)}
                className="mb-2 h-11 w-full rounded-xl bg-white text-sm font-bold text-black transition hover:bg-white/90"
              >
                View Full Report →
              </motion.button>

              {result.passed && (
                <motion.button
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }} whileTap={{ scale: 0.97 }}
                  onClick={() =>
                    router.push(`/profile?topic=${encodeURIComponent(assignment?.topic ?? "")}&score=${result.score}`)
                  }
                  className="h-10 w-full rounded-xl border border-white/[0.08] text-sm font-semibold text-[#666] transition hover:border-white/20 hover:text-white"
                >
                  Mint Proof of Learning NFT →
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Report modal */}
      {result && (
        <ReportModal
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          result={result}
          topic={assignment?.topic}
          onMint={
            result.passed
              ? () => router.push(`/profile?topic=${encodeURIComponent(assignment?.topic ?? "")}&score=${result.score}`)
              : undefined
          }
        />
      )}
    </div>
  );
}
