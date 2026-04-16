"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { QuizReportModal, type QuizReportData, type MintContext } from "@/components/QuizReportModal";
import { useWallet } from "@/hooks/useWallet";

/* ── localStorage helpers (same key as profile page) ── */
const LS_KEY = "learnloop_nfts";
type StoredNFT = { id: string; topic: string; score: number; txHash: string; metadataURI: string; mintedAt: string; wallet: string };
function saveNFT(nft: StoredNFT) {
  try {
    const all: StoredNFT[] = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    if (!all.find((n) => n.txHash === nft.txHash)) {
      localStorage.setItem(LS_KEY, JSON.stringify([nft, ...all]));
    }
  } catch { /* ignore */ }
}

type QuizQuestion = {
  question: string;
  options: string[];
  answerIndex: number;
};

type Assignment = {
  isCodingVideo?: boolean;
  title: string;
  description: string;
  track: "frontend" | "backend" | "fullstack";
  topic: string;
  quiz?: QuizQuestion[];
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { ease: "easeOut", duration: 0.45 } },
};

export default function QuizPage() {
  /* Assignment context from URL */
  const [assignmentQuery, setAssignmentQuery] = useState("");
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setAssignmentQuery(p.get("assignment") || "");
  }, []);

  const assignment = useMemo<Assignment | null>(() => {
    if (!assignmentQuery) return null;
    try {
      // Handle both raw URI-encoded JSON or base64 URI-encoded JSON
      let decoded = "";
      try {
        decoded = decodeURIComponent(atob(assignmentQuery));
      } catch (e) {
        decoded = decodeURIComponent(assignmentQuery);
      }
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }, [assignmentQuery]);

  const quiz = assignment?.quiz ?? [];

  /* Resolved topic — never fall back to generic words */
  const GENERIC = new Set(["quiz", "assignment", "coding challenge", "challenge", "test"]);
  const resolvedTopic =
    assignment?.topic && !GENERIC.has(assignment.topic.toLowerCase().trim())
      ? assignment.topic
      : assignment?.title ?? "MCQ Quiz";

  /* Wallet */
  const { walletAddress, connecting, walletOptions, connectWallet } = useWallet();

  /* Mint state */
  const [minting, setMinting] = useState(false);
  const [mintErr, setMintErr] = useState("");
  const [mintSuccess, setMintSuccess] = useState<{ txHash: string; explorerUrl: string } | null>(null);

  // State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // Derive score
  const score = useMemo(() => {
    let s = 0;
    quiz.forEach((q, i) => {
      if (selectedAnswers[i] === q.answerIndex) s += 1;
    });
    return Math.round((s / Math.max(1, quiz.length)) * 100);
  }, [selectedAnswers, quiz]);

  // Build full report data from answers
  const reportData = useMemo<QuizReportData>(() => {
    const correct = quiz.filter((q, i) => selectedAnswers[i] === q.answerIndex).length;
    return {
      score,
      passed: score >= 70,
      correct,
      total: quiz.length,
      topic: resolvedTopic,
      questions: quiz.map((q, i) => ({
        question: q.question,
        options: q.options,
        yourAnswerIndex: selectedAnswers[i],
        correctAnswerIndex: q.answerIndex,
        isCorrect: selectedAnswers[i] === q.answerIndex,
      })),
    };
  }, [score, quiz, selectedAnswers, assignment]);

  const handleSelectOption = (idx: number) => {
    if (isFinished) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestionIndex]: idx }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.length - 1) {
      setCurrentQuestionIndex((curr) => curr + 1);
    } else {
      setIsFinished(true);
      setTimeout(() => setReportOpen(true), 500);
    }
  };

  const handleRetry = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setIsFinished(false);
    setReportOpen(false);
    setMintErr("");
    setMintSuccess(null);
  };

  const doMint = async () => {
    if (!walletAddress) return;
    setMinting(true);
    setMintErr("");
    try {
      const res = await fetch("/api/mint-nft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          topic: resolvedTopic,
          score,
          resourceUrl: typeof window !== "undefined" ? window.location.href : "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Minting failed");
      const result = { txHash: data.txHash as string, explorerUrl: data.explorerUrl as string };
      setMintSuccess(result);
      saveNFT({
        id: data.txHash,
        topic: resolvedTopic,
        score,
        txHash: data.txHash,
        metadataURI: data.metadataURI,
        mintedAt: new Date().toISOString(),
        wallet: walletAddress,
      });
    } catch (e) {
      setMintErr(e instanceof Error ? e.message : "Minting failed");
    } finally {
      setMinting(false);
    }
  };

  const mintContext: MintContext | undefined = score >= 70 ? {
    walletAddress,
    connecting,
    hasWalletExtension: walletOptions.length > 0,
    connectWallet,
    minting,
    mintErr,
    mintSuccess,
    doMint,
  } : undefined;

  if (!assignmentQuery) return null;

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <motion.div
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={fadeUp} className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-white">Knowledge Quiz</h1>
          <p className="mt-2 text-sm text-[#555]">
            Answer the following questions to prove your understanding and mint your learning NFT.
          </p>
          {assignment && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs font-semibold text-[#777]">
                {resolvedTopic}
              </span>
              <span className="max-w-xs truncate rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-[#555]">
                {assignment.title}
              </span>
            </div>
          )}
        </motion.div>

        {!isFinished && quiz.length > 0 && (
          <motion.div variants={fadeUp} className="mb-4 rounded-2xl border border-white/[0.07] bg-[#0f0f0f]">
            <div className="border-b border-white/[0.06] px-5 py-4 flex justify-between items-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#444]">
                Question {currentQuestionIndex + 1} of {quiz.length}
              </p>
            </div>
            <div className="px-5 py-6">
              <h2 className="text-lg font-semibold text-white mb-6 leading-relaxed">
                {quiz[currentQuestionIndex].question}
              </h2>
              <div className="space-y-3">
                {quiz[currentQuestionIndex].options.map((opt, i) => {
                  const isSelected = selectedAnswers[currentQuestionIndex] === i;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSelectOption(i)}
                      className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition-all ${
                        isSelected
                          ? "border-white/30 bg-white/10 text-white"
                          : "border-white/[0.07] bg-white/[0.02] text-[#ccc] hover:bg-white/[0.05]"
                      }`}
                    >
                      <span className="font-mono text-xs opacity-50 mr-3">
                        {String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="border-t border-white/[0.06] px-5 py-4 flex justify-end">
              <button
                onClick={handleNext}
                disabled={selectedAnswers[currentQuestionIndex] === undefined}
                className="rounded-lg bg-white px-5 py-2 text-xs font-bold text-black transition hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {currentQuestionIndex < quiz.length - 1 ? "Next →" : "Finish →"}
              </button>
            </div>
          </motion.div>
        )}

        {isFinished && quiz.length > 0 && (
          <motion.div variants={fadeUp} className="mb-4 rounded-2xl border border-white/[0.07] bg-[#0f0f0f] overflow-hidden">
            {/* Header */}
            <div className="border-b border-white/[0.06] px-5 py-4 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#444]">
                Quiz Complete — {resolvedTopic}
              </p>
              <span
                className="rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{
                  background: score >= 70 ? "rgba(255,255,255,0.06)" : "rgba(239,68,68,0.08)",
                  color: score >= 70 ? "#fff" : "#ef4444",
                }}
              >
                {score >= 70 ? "Passed" : "Needs Work"}
              </span>
            </div>

            {/* Score row */}
            <div className="flex items-center gap-5 px-5 py-5 border-b border-white/[0.05]">
              <div
                className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 text-2xl font-black ${
                  score >= 70 ? "border-white/15 text-white" : "border-red-500/25 text-red-400"
                }`}
              >
                {score}%
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-white mb-1">
                  {score >= 70 ? "Great job!" : "Keep practicing!"}
                </h2>
                <p className="text-sm text-[#555]">
                  {reportData.correct} of {quiz.length} correct
                </p>
                {/* mini accuracy bar */}
                <div className="mt-2.5 h-1 w-full rounded-full bg-white/[0.05] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: score >= 70 ? "#fff" : "#ef4444" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                  />
                </div>
              </div>
            </div>

            {/* Inline wrong/right breakdown */}
            <div className="grid grid-cols-2 divide-x divide-white/[0.05] border-b border-white/[0.05]">
              {/* Correct */}
              <div className="px-4 py-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#444]">
                  You knew ✓
                </p>
                {reportData.questions.filter((q) => q.isCorrect).length === 0 ? (
                  <p className="text-xs text-[#444]">None yet.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {reportData.questions
                      .filter((q) => q.isCorrect)
                      .slice(0, 4)
                      .map((q, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-[#666]">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white/30" />
                          <span className="line-clamp-2">{q.question}</span>
                        </li>
                      ))}
                    {reportData.questions.filter((q) => q.isCorrect).length > 4 && (
                      <li className="text-[10px] text-[#444]">
                        +{reportData.questions.filter((q) => q.isCorrect).length - 4} more…
                      </li>
                    )}
                  </ul>
                )}
              </div>

              {/* Wrong */}
              <div className="px-4 py-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#444]">
                  Needs review ✗
                </p>
                {reportData.questions.filter((q) => !q.isCorrect).length === 0 ? (
                  <p className="text-xs text-[#444]">Perfect score!</p>
                ) : (
                  <ul className="space-y-1.5">
                    {reportData.questions
                      .filter((q) => !q.isCorrect)
                      .slice(0, 4)
                      .map((q, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-[#777]">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-500/50" />
                          <span className="line-clamp-2">{q.question}</span>
                        </li>
                      ))}
                    {reportData.questions.filter((q) => !q.isCorrect).length > 4 && (
                      <li className="text-[10px] text-[#444]">
                        +{reportData.questions.filter((q) => !q.isCorrect).length - 4} more in full report…
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col gap-2 px-5 py-4">
              <button
                onClick={() => setReportOpen(true)}
                className="h-11 w-full rounded-xl bg-white text-sm font-bold text-black transition hover:bg-white/90"
              >
                View Full Report & AI Analysis →
              </button>
              {score >= 70 && (
                <motion.button
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => setReportOpen(true)}
                  className="h-10 w-full rounded-xl border border-white/[0.08] text-sm font-semibold text-[#666] transition hover:border-white/20 hover:text-white"
                >
                  Mint Proof of Learning NFT →
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {quiz.length === 0 && assignment && (
          <motion.div variants={fadeUp} className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            Error: No quiz data was provided by the AI for this assignment. Please try generating it again.
          </motion.div>
        )}
      </motion.div>

      <QuizReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        data={reportData}
        mintContext={mintContext}
        onRetry={handleRetry}
      />
    </div>
  );
}
