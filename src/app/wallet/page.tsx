"use client";
import React from 'react';
import { Header } from '@/components/layout/Header';
import { useWallet, walletProviderName } from "@/hooks/useWallet";

export default function Wallet() {
  const { walletAddress, connecting, walletOptions, selectedWallet, setSelectedWallet, connectWallet, disconnectWallet, error } =
    useWallet();

  return (
    <>
      <Header title="Proof of Learning Wallet" />
      <div className="mx-auto grid w-full max-w-5xl gap-6 p-6">
        <div className="rounded-2xl border border-white/10 bg-[rgba(16,185,129,0.4)] p-5">
          <h1 className="text-2xl font-semibold">Connect Wallet</h1>
          <p className="mt-2 text-sm text-slate-400">
            {walletAddress
              ? `Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
              : "No wallet connected yet."}
          </p>
          {walletOptions.length > 1 && (
            <select
              className="mt-3 w-full max-w-sm rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2 text-sm text-slate-200 outline-none"
              value={selectedWallet}
              onChange={(e) => setSelectedWallet(e.target.value)}
            >
              {walletOptions.map((provider, idx) => (
                <option key={idx} value={String(idx)}>
                  {walletProviderName(provider)}
                </option>
              ))}
            </select>
          )}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => connectWallet()}
              disabled={connecting}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              {connecting ? "Connecting..." : walletAddress ? "Reconnect" : "Connect Wallet"}
            </button>
            {walletAddress && (
              <button
                onClick={disconnectWallet}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
              >
                Disconnect
              </button>
            )}
          </div>
          {!walletAddress && error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Network</p>
            <p className="mt-2 text-sm font-medium text-slate-100">Polygon (Mumbai/Test)</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Status</p>
            <p className="mt-2 text-sm font-medium text-slate-100">{walletAddress ? "Ready to mint" : "Connect wallet first"}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Security</p>
            <p className="mt-2 text-sm font-medium text-slate-100">No private keys stored in UI</p>
          </div>
        </div>
      </div>
    </>
  );
}
