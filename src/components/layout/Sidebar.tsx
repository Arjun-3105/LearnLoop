"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { motion, AnimatePresence } from "framer-motion";
import { WalletConnectModal } from "@/components/wallet/WalletConnectModal";
import { listSessions, deleteSession, type SessionDoc } from "@/lib/appwrite";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/learn",     label: "Learn"      },
  { href: "/assess",    label: "Assess"     },
  { href: "/profile",   label: "Profile"    },
  { href: "/wallet",    label: "Wallet"     },
];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// ─── Recent Sessions (ChatGPT-style) ─────────────────────────────────────────
function RecentSessions() {
  const [sessions, setSessions]   = useState<SessionDoc[]>([]);
  const [loading, setLoading]     = useState(true);
  const [hoverId, setHoverId]     = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    listSessions(12)
      .then((res) => setSessions(res.documents as unknown as SessionDoc[]))
      .catch(() => {/* silent */})
      .finally(() => setLoading(false));
  }, [pathname]); // refresh when navigating (new session may have been saved)

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    await deleteSession(id).catch(() => {});
    setSessions((p) => p.filter((s) => s.$id !== id));
  };

  if (loading) {
    return (
      <div className="mt-1 space-y-1.5 px-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-7 animate-pulse rounded-md bg-white/[0.04]" />
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <p className="mt-1 px-4 text-[10px] text-[#818181]">No sessions yet</p>
    );
  }

  return (
    <div className="mt-1 space-y-0.5 px-2">
      <AnimatePresence initial={false}>
        {sessions.map((s) => {
          const label = s.topic || s.videoTitle || "Learning Session";
          const href  = `/learn?session=${s.$id}`;
          const isHovered = hoverId === s.$id;

          return (
            <motion.div
              key={s.$id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.18 }}
              className="group relative"
              onMouseEnter={() => setHoverId(s.$id)}
              onMouseLeave={() => setHoverId(null)}
            >
              <Link
                href={href}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors duration-100 hover:bg-white/[0.05]"
              >
                {/* small colored dot keyed to topic */}
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/20" />

                <span className="min-w-0 flex-1 truncate text-[11.5px] text-[#c9c9c9] group-hover:text-[#aaa] transition-colors">
                  {label}
                </span>

                {/* time or delete button */}
                <AnimatePresence mode="wait">
                  {isHovered ? (
                    <motion.button
                      key="del"
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      transition={{ duration: 0.12 }}
                      onClick={(e) => handleDelete(e, s.$id)}
                      className="shrink-0 rounded p-0.5 text-[#9f3838] hover:text-rose-400 transition-colors"
                      title="Remove from history"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </motion.button>
                  ) : (
                    <motion.span
                      key="time"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                      className="shrink-0 text-[10px] text-[#818181]"
                    >
                      {timeAgo(s.$createdAt)}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* View all link */}
      <Link
        href="/history"
        className="mt-1 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10.5px] text-[#818181] transition hover:text-[#666]"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 8v4l3 3M3.05 11a9 9 0 1 0 .5-3" />
          <path d="M3 4v4h4" />
        </svg>
        View all history
      </Link>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [modalOpen, setModalOpen] = useState(false);
  const {
    walletAddress, connecting, walletOptions,
    selectedWallet, setSelectedWallet,
    connectWallet, disconnectWallet, error,
  } = useWallet();

  return (
    <aside className="hidden h-screen w-56 flex-col border-r border-white/[0.06] bg-[#080808] md:flex">
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-white/[0.06] px-5">
        <Image src="/logo.png" alt="LearnLoop" width={30} height={30} style={{ mixBlendMode: "screen" }} />
        <span className="text-sm font-semibold tracking-tight text-white">LearnLoop</span>
      </div>

      {/* Scrollable body */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {/* Nav links */}
        <nav className="flex flex-col text-[#8c8c8c] gap-0.5 p-3">
          {NAV.map(({ href, label }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "group relative flex items-center text-[#a1a1a1] rounded-lg px-3 py-2 text-sm transition-all duration-150",
                  active
                    ? "bg-white/[0.07] text-white"
                    : "text-[#666] hover:bg-white/[0.04] hover:text-[#ccc]",
                ].join(" ")}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg bg-white/[0.07]"
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />
                )}
                <span className="relative">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="mx-3 border-t border-white/[0.05]" />

        {/* Recent sessions — ChatGPT style */}
        <div className="mt-3 min-h-0 flex-1">
          <p className="mb-1 px-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#c5c4c4]">
            Recent
          </p>
          <RecentSessions />
        </div>
      </div>

      {/* Wallet — pinned to bottom */}
      <div className="shrink-0 border-t border-white/[0.06] p-3">
        <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#818181] ">
          Wallet
        </p>

        {walletAddress ? (
          <>
            <div className="mb-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2">
              <p className="font-mono text-xs text-[#818181]">
                {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
              </p>
            </div>
            <button
              type="button"
              onClick={disconnectWallet}
              className="w-full rounded-lg py-1.5 text-[11px] text-[#818181]  transition hover:text-[#888]"
            >
              Disconnect
            </button>
          </>
        ) : (
          <>
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => setModalOpen(true)}
              disabled={connecting}
              className="group relative w-full overflow-hidden rounded-xl bg-white py-2.5 text-xs font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
            >
              <span className="relative z-10 flex items-center justify-center gap-1.5">
                <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
                  <path d="M2 4a2 2 0 012-2h8a2 2 0 012 2v1H2V4z" fill="currentColor" fillOpacity="0.5"/>
                  <rect x="2" y="6" width="12" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="11" cy="9.5" r="1" fill="currentColor"/>
                </svg>
                Connect Wallet
              </span>
            </motion.button>
            {error && (
              <p className="mt-1.5 text-[10px] text-red-400">{error}</p>
            )}
          </>
        )}
      </div>

      <WalletConnectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        walletOptions={walletOptions}
        selectedWallet={selectedWallet}
        setSelectedWallet={setSelectedWallet}
        connectWallet={connectWallet}
        connecting={connecting}
        error={error}
      />
    </aside>
  );
};
