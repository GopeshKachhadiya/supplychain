'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowRight, LayoutDashboard, Loader2, Lock, Mail, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f9f9fc] p-6">
      <div className="absolute right-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-[#7C3AED]/5 blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-[#7C3AED]/5 blur-[120px]" />

      <div className="relative z-10 w-full max-w-[450px] space-y-8">
        <div className="space-y-2 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] shadow-xl shadow-[#7C3AED]/20">
            <LayoutDashboard className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-manrope text-4xl font-extrabold tracking-tight text-[#2d3339]">Welcome Back</h1>
          <p className="text-lg text-[#596067]">Sign in to AnvayaAI Supply Chain</p>
        </div>

        <div className="rounded-[32px] border border-[#acb3ba]/20 bg-white p-8 shadow-2xl shadow-[#acb3ba]/10">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-rose-600">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="ml-1 flex items-center gap-2 text-sm font-bold text-[#2d3339]">
                  <Mail className="h-4 w-4 text-[#7C3AED]" /> Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-2xl border-none bg-[#f2f3f8] px-5 py-4 text-[#2d3339] outline-none transition-all placeholder:text-[#acb3ba] focus:ring-2 focus:ring-[#7C3AED]/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="ml-1 flex items-center gap-2 text-sm font-bold text-[#2d3339]">
                  <Lock className="h-4 w-4 text-[#7C3AED]" /> Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-2xl border-none bg-[#f2f3f8] px-5 py-4 text-[#2d3339] outline-none transition-all placeholder:text-[#acb3ba] focus:ring-2 focus:ring-[#7C3AED]/20"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7C3AED] py-4 font-bold text-white shadow-xl shadow-[#7C3AED]/20 transition-all hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 border-t border-[#acb3ba]/10 pt-6 text-center">
            <p className="text-sm font-medium text-[#596067]">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-bold text-[#7C3AED] hover:underline">
                Create one now
              </Link>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-[#acb3ba] opacity-50">
          <Sparkles className="h-4 w-4" />
          <p className="text-[10px] font-bold uppercase tracking-widest">Secure AI Infrastructure</p>
        </div>
      </div>
    </div>
  );
}
