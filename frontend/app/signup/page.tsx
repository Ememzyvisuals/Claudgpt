'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Mail, Lock, User, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/shared/Logo';

const PERKS = [
  'Multi-agent AI pipeline — Plan, Code, Debug, Review',
  'Kimi K2 coding · GPT-OSS 120B reasoning',
  'Voice input (Whisper) + voice output (Orpheus)',
  'Image, file & GitHub repository reading',
  '100% free — no credit card ever',
];

export default function SignupPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle, signInWithGitHub } = useAuth();
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setError(''); setLoading(true);
    const { error } = await signUp(email, password, name);
    if (error) { setError(error.message); setLoading(false); return; }
    // If email confirmation is off, session is returned immediately
    if (data.session) {
      router.refresh();
      router.replace('/dashboard');
    } else {
      setSuccess('Account created! Check your email to verify, then sign in.');
      setTimeout(() => router.push('/login'), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1A1410] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#C4A484]/12 to-transparent pointer-events-none" />
        <Logo size="md" inverted />
        <div className="relative">
          <h2 className="font-display text-4xl font-bold text-white mb-4 leading-tight">
            The AI assistant<br />that ships code.
          </h2>
          <p className="text-[#8B7B6B] text-base leading-relaxed mb-8">
            Join ClaudGPT and build full-stack apps, bots, and APIs with frontier AI — completely free.
          </p>
          <div className="flex flex-col gap-3">
            {PERKS.map((p) => (
              <div key={p} className="flex items-start gap-2.5 text-sm text-[#8B7B6B]">
                <CheckCircle2 className="w-4 h-4 text-[#C4A484] shrink-0 mt-0.5" />
                {p}
              </div>
            ))}
          </div>
        </div>
        <p className="text-[#4d4030] text-xs">© {new Date().getFullYear()} EMEMZYVISUALS DIGITALS · Built by Emmanuel ARIYO</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-md">
          <div className="lg:hidden mb-8"><Logo size="md" /></div>

          <h1 className="font-display text-3xl font-bold text-[#1A1410] mb-1">Create your account</h1>
          <p className="text-[#8B7B6B] text-sm mb-8">Free forever. No credit card required.</p>

          {error   && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-4 py-3 mb-5">{error}</div>}
          {success && <div className="bg-green-50 border border-green-200 text-green-600 text-sm rounded-2xl px-4 py-3 mb-5">{success}</div>}

          <form onSubmit={handleSignup} className="space-y-4">
            {[
              { label: 'Full Name', type: 'text', value: name, setter: setName, icon: User, placeholder: 'Emmanuel ARIYO', autoComplete: 'name' },
              { label: 'Email',     type: 'email', value: email, setter: setEmail, icon: Mail, placeholder: 'you@example.com', autoComplete: 'email' },
              { label: 'Password',  type: 'password', value: password, setter: setPassword, icon: Lock, placeholder: 'Min. 8 characters', autoComplete: 'new-password' },
            ].map(({ label, type, value, setter, icon: Icon, placeholder, autoComplete }) => (
              <div key={label}>
                <label className="text-xs font-semibold text-[#6B5D52] block mb-1.5 uppercase tracking-wider">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A89585]" />
                  <input type={type} value={value} onChange={(e) => setter(e.target.value)} required autoComplete={autoComplete}
                    className="w-full bg-white border border-[#E8E0D6] rounded-2xl pl-10 pr-4 py-3 text-sm text-[#1A1410] placeholder-[#A89585] transition"
                    placeholder={placeholder} />
                </div>
              </div>
            ))}

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 mt-2 disabled:opacity-60 font-semibold">
              {loading ? 'Creating account…' : <><span>Create account</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E8E0D6]" /></div>
            <div className="relative text-center"><span className="bg-[#FAFAF8] px-3 text-xs text-[#A89585] font-medium">or continue with</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => signInWithGoogle()} className="btn-ghost flex items-center justify-center gap-2.5 py-3 text-sm">
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </button>
            <button onClick={() => signInWithGitHub()} className="btn-ghost flex items-center justify-center gap-2.5 py-3 text-sm">
              <svg className="w-4 h-4 fill-[#1A1410]" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
              GitHub
            </button>
          </div>

          <p className="text-center text-sm text-[#8B7B6B] mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-[#C4A484] hover:text-[#a8896a] font-semibold transition">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
