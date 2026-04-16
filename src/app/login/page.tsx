import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function Login() {
  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-b from-[#070d1a] via-[#0a1326] to-[#050910] p-6">
      <Card padding="lg" className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-cyan-400 text-2xl font-bold text-slate-950">L</div>
          <h2 className="text-2xl font-semibold">Welcome to LearnLoop</h2>
          <p className="mt-2 text-sm text-slate-400">Your AI learning and proof engine</p>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/dashboard" className="block w-full">
            <Button fullWidth variant="primary" size="lg">Enter Dashboard</Button>
          </Link>
          <Button fullWidth variant="secondary" size="lg">Continue with Email</Button>
        </div>
      </Card>
    </div>
  );
}
