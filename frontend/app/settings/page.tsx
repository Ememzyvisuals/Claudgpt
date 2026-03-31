'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Palette, Key, Keyboard, Save, Check,
  Eye, EyeOff, Moon, Sun, Type, Zap, ChevronDown,
  AlertCircle, CheckCircle2, Loader2, Trash2, Shield
} from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { supabase } from '@/lib/supabase';
import { userSettingsApi } from '@/lib/api';
import { cn } from '@/lib/utils';

type Tab = 'profile' | 'appearance' | 'models' | 'apikeys' | 'shortcuts';

const TABS = [
  { id: 'profile'    as Tab, label: 'Profile',    icon: User     },
  { id: 'appearance' as Tab, label: 'Appearance', icon: Palette  },
  { id: 'models'     as Tab, label: 'AI Models',  icon: Zap      },
  { id: 'apikeys'    as Tab, label: 'API Keys',   icon: Key      },
  { id: 'shortcuts'  as Tab, label: 'Shortcuts',  icon: Keyboard },
];

const PROVIDERS = [
  {
    id: 'groq', name: 'Groq', badge: 'Default · Free',
    desc: 'Ultra-fast inference. 30+ requests/min. No key needed — uses ClaudGPT shared keys.',
    color: 'text-orange-500',
  },
  {
    id: 'openrouter', name: 'OpenRouter', badge: 'Free + Paid',
    desc: 'Access 300+ models including free tier models. Your own key gives 200 free req/day.',
    color: 'text-purple-500',
  },
  {
    id: 'openai', name: 'OpenAI', badge: 'Paid',
    desc: 'GPT-4o, o1, o3-mini and more. Requires your OpenAI API key.',
    color: 'text-green-500',
  },
  {
    id: 'anthropic', name: 'Anthropic', badge: 'Paid',
    desc: 'Claude Opus 4.6, Sonnet 4.6, Haiku 4.5. Requires your Anthropic API key.',
    color: 'text-blue-500',
  },
];

const MODELS_BY_PROVIDER: Record<string, { id: string; name: string; tag?: string }[]> = {
  groq: [
    { id: 'llama-3.3-70b-versatile',                      name: 'Llama 3.3 70B',          tag: 'Stable' },
    { id: 'openai/gpt-oss-120b',                           name: 'GPT-OSS 120B',           tag: 'Stable' },
    { id: 'openai/gpt-oss-20b',                            name: 'GPT-OSS 20B',            tag: 'Fast'   },
    { id: 'moonshotai/kimi-k2-0905-instruct',              name: 'Kimi K2',                tag: 'Coder'  },
    { id: 'meta-llama/llama-4-scout-17b-16e-instruct',     name: 'Llama 4 Scout',          tag: 'Vision' },
    { id: 'qwen/qwen3-32b',                                name: 'Qwen 3 32B',             tag: 'Thinking'},
    { id: 'llama-3.1-8b-instant',                          name: 'Llama 3.1 8B',           tag: 'Fastest'},
    { id: 'groq/compound',                                 name: 'Groq Compound',          tag: 'Search' },
  ],
  openrouter: [
    { id: 'meta-llama/llama-3.3-70b-instruct:free',        name: 'Llama 3.3 70B',          tag: 'Free'   },
    { id: 'deepseek/deepseek-r1:free',                     name: 'DeepSeek R1',            tag: 'Free'   },
    { id: 'qwen/qwen3-coder-480b-a22b-instruct:free',      name: 'Qwen3 Coder 480B',       tag: 'Free'   },
    { id: 'nvidia/llama-3.1-nemotron-ultra-253b-v1:free',  name: 'NVIDIA Nemotron 253B',   tag: 'Free'   },
    { id: 'microsoft/phi-4-reasoning:free',                name: 'Phi-4 Reasoning',        tag: 'Free'   },
    { id: 'mistralai/mistral-small-3.1-24b-instruct:free', name: 'Mistral Small 3.1',      tag: 'Free'   },
    { id: 'openai/gpt-4o',                                 name: 'GPT-4o',                 tag: 'Paid'   },
    { id: 'anthropic/claude-sonnet-4-6',                   name: 'Claude Sonnet 4.6',      tag: 'Paid'   },
    { id: 'google/gemini-2.5-pro',                         name: 'Gemini 2.5 Pro',         tag: 'Paid'   },
    { id: 'deepseek/deepseek-r1',                          name: 'DeepSeek R1',            tag: 'Paid'   },
    { id: 'openrouter/free',                               name: 'Auto (Best Free)',        tag: 'Free'   },
  ],
  openai: [
    { id: 'gpt-4o',       name: 'GPT-4o',       tag: 'Flagship' },
    { id: 'gpt-4o-mini',  name: 'GPT-4o Mini',  tag: 'Fast'     },
    { id: 'o1',           name: 'o1',            tag: 'Reasoning'},
    { id: 'o3-mini',      name: 'o3-mini',       tag: 'Fast'     },
    { id: 'gpt-4-turbo',  name: 'GPT-4 Turbo',  tag: 'Capable'  },
  ],
  anthropic: [
    { id: 'claude-opus-4-6',           name: 'Claude Opus 4.6',     tag: 'Most Capable' },
    { id: 'claude-sonnet-4-6',         name: 'Claude Sonnet 4.6',   tag: 'Balanced'     },
    { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5',    tag: 'Fastest'      },
  ],
};

function SecretInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#FAFAF8] border border-[#E8E0D6] rounded-2xl px-4 py-3 pr-10 text-sm text-[#1A1410] font-mono placeholder-[#A89585] focus:outline-none focus:border-[#C4A484] transition"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A89585] hover:text-[#1A1410] transition"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const router               = useRouter();
  const { user, loading }    = useAuth();
  const { user: storeUser }  = useAuthStore();
  const { theme, fontSize, setTheme, setFontSize } = useThemeStore();
  const [tab,        setTab]       = useState<Tab>('profile');
  const [fullName,   setFullName]  = useState('');
  const [saved,      setSaved]     = useState(false);
  const [saving,     setSaving]    = useState(false);

  // Provider / model settings
  const [provider,   setProvider]  = useState('groq');
  const [model,      setModel]     = useState('llama-3.3-70b-versatile');
  const [groqKey,    setGroqKey]   = useState('');
  const [openaiKey,  setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [hasKeys,    setHasKeys]   = useState({ groq: false, openai: false, anthropic: false, openrouter: false });
  const [messagesLeft, setMessagesLeft] = useState(25);
  const [dailyLimit,   setDailyLimit]   = useState(25);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingKeys,   setSavingKeys]   = useState(false);
  const [keysSaved,    setKeysSaved]    = useState(false);

  useEffect(() => { if (!loading && !user) router.replace('/login'); }, [user, loading, router]);

  useEffect(() => {
    if (storeUser?.user_metadata?.full_name) setFullName(storeUser.user_metadata.full_name);
  }, [storeUser]);

  // Apply theme/fontsize to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-fontsize', fontSize);
  }, [theme, fontSize]);

  // Load settings from backend
  useEffect(() => {
    if (!user) return;
    userSettingsApi.get().then((data) => {
      setProvider(data.provider);
      setModel(data.model);
      setMessagesLeft(data.messagesLeft === Infinity ? 999 : data.messagesLeft);
      setDailyLimit(data.dailyLimit);
      setHasKeys({
        groq:       data.hasGroqKey,
        openai:     data.hasOpenaiKey,
        anthropic:  data.hasAnthropicKey,
        openrouter: data.hasOpenrouterKey,
      });
    }).catch(() => {}).finally(() => setLoadingSettings(false));
  }, [user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    await supabase.auth.updateUser({ data: { full_name: fullName } });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setSaving(false);
  };

  const handleSaveProvider = async () => {
    setSaving(true);
    await userSettingsApi.update({ provider, model }).catch(() => {});
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  };

  const handleSaveKeys = async () => {
    setSavingKeys(true);
    const payload: Record<string, string> = {};
    if (groqKey)        payload.groqKey       = groqKey;
    if (openaiKey)      payload.openaiKey      = openaiKey;
    if (anthropicKey)   payload.anthropicKey   = anthropicKey;
    if (openrouterKey)  payload.openrouterKey  = openrouterKey;
    await userSettingsApi.update(payload).catch(() => {});
    // Update hasKeys
    setHasKeys({
      groq:       !!(groqKey || hasKeys.groq),
      openai:     !!(openaiKey || hasKeys.openai),
      anthropic:  !!(anthropicKey || hasKeys.anthropic),
      openrouter: !!(openrouterKey || hasKeys.openrouter),
    });
    setGroqKey(''); setOpenaiKey(''); setAnthropicKey(''); setOpenrouterKey('');
    setKeysSaved(true);
    setTimeout(() => setKeysSaved(false), 2000);
    setSavingKeys(false);
  };

  const handleDeleteKey = async (keyName: string) => {
    await userSettingsApi.update({ [keyName]: '' }).catch(() => {});
    setHasKeys((prev) => ({ ...prev, [keyName.replace('Key', '')]: false }));
  };

  if (loading || !user) return <PageLoader />;

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAF8]">
      <Sidebar />

      <main className="flex-1 overflow-y-auto pt-12 md:pt-0 pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <p className="text-xs font-semibold tracking-[0.15em] text-[#C4A484] uppercase mb-1">Account</p>
            <h1 className="font-display text-2xl font-bold text-[#1A1410]">Settings</h1>
          </motion.div>

          <div className="flex gap-6 flex-col md:flex-row">
            {/* Tab nav */}
            <nav className="md:w-48 shrink-0 flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setTab(id)}
                  className={cn(
                    'flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition whitespace-nowrap',
                    tab === id
                      ? 'bg-[#EDE8E2] text-[#8B5E3C] border border-[#C4A484]'
                      : 'text-[#6B5D52] hover:text-[#1A1410] hover:bg-[#EDE8E2]'
                  )}>
                  <Icon className="w-4 h-4 shrink-0" />{label}
                </button>
              ))}
            </nav>

            {/* Content */}
            <motion.div key={tab}
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}
              className="flex-1 bg-white border border-[#E8E0D6] rounded-3xl p-6 shadow-soft-sm"
            >
              {/* ── Profile ── */}
              {tab === 'profile' && (
                <div className="space-y-5">
                  <h2 className="font-display text-base font-semibold text-[#1A1410]">Profile</h2>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#C4A484] to-[#8B7B6B] flex items-center justify-center text-white text-2xl font-display font-bold shadow-primary shrink-0">
                      {(user.email || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1A1410]">{storeUser?.user_metadata?.full_name || 'No name set'}</p>
                      <p className="text-xs text-[#A89585] mt-0.5">{user.email}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#6B5D52] block mb-1.5 uppercase tracking-wider">Full Name</label>
                    <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#FAFAF8] border border-[#E8E0D6] rounded-2xl px-4 py-3 text-sm text-[#1A1410] focus:outline-none focus:border-[#C4A484] transition"
                      placeholder="Your full name" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#6B5D52] block mb-1.5 uppercase tracking-wider">Email</label>
                    <input value={user.email || ''} disabled
                      className="w-full bg-[#F5F2EF] border border-[#E8E0D6] rounded-2xl px-4 py-3 text-sm text-[#A89585] cursor-not-allowed" />
                  </div>
                  <button onClick={handleSaveProfile} disabled={saving}
                    className="btn-primary flex items-center gap-2 px-6 py-2.5 disabled:opacity-60">
                    {saved ? <><Check className="w-4 h-4" />Saved</> : saving ? 'Saving…' : <><Save className="w-4 h-4" />Save changes</>}
                  </button>
                </div>
              )}

              {/* ── Appearance ── */}
              {tab === 'appearance' && (
                <div className="space-y-6">
                  <h2 className="font-display text-base font-semibold text-[#1A1410]">Appearance</h2>

                  {/* Theme */}
                  <div>
                    <label className="text-xs font-semibold text-[#6B5D52] block mb-3 uppercase tracking-wider">Theme</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'light', label: 'Light', icon: Sun,  preview: 'bg-white border border-[#E8E0D6]' },
                        { id: 'dark',  label: 'Dark',  icon: Moon, preview: 'bg-[#1A1410]' },
                      ].map((t) => (
                        <button key={t.id} onClick={() => { setTheme(t.id as 'light' | 'dark'); userSettingsApi.update({ theme: t.id }).catch(() => {}); }}
                          className={cn(
                            'flex items-center gap-3 p-4 rounded-2xl border-2 transition',
                            theme === t.id ? 'border-[#C4A484] bg-[#FDF8F4]' : 'border-[#E8E0D6] hover:border-[#C4A484]'
                          )}>
                          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', t.preview)}>
                            <t.icon className={cn('w-5 h-5', t.id === 'dark' ? 'text-[#C4A484]' : 'text-[#8B7B6B]')} />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-semibold text-[#1A1410]">{t.label}</p>
                            {theme === t.id && <p className="text-[11px] text-[#C4A484] font-medium">Active</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font size */}
                  <div>
                    <label className="text-xs font-semibold text-[#6B5D52] block mb-3 uppercase tracking-wider">Font Size</label>
                    <div className="flex gap-2">
                      {[
                        { id: 'sm', label: 'Small',  preview: 'text-xs'  },
                        { id: 'md', label: 'Medium', preview: 'text-sm'  },
                        { id: 'lg', label: 'Large',  preview: 'text-base'},
                      ].map((s) => (
                        <button key={s.id} onClick={() => { setFontSize(s.id as 'sm'|'md'|'lg'); userSettingsApi.update({ fontSize: s.id }).catch(() => {}); }}
                          className={cn(
                            'flex-1 py-3 rounded-2xl border-2 transition font-medium',
                            s.preview,
                            fontSize === s.id ? 'border-[#C4A484] bg-[#FDF8F4] text-[#8B5E3C]' : 'border-[#E8E0D6] text-[#6B5D52] hover:border-[#C4A484]'
                          )}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Accent colour */}
                  <div>
                    <label className="text-xs font-semibold text-[#6B5D52] block mb-3 uppercase tracking-wider">Accent Colour</label>
                    <div className="flex gap-3">
                      {[
                        { color: '#C4A484', label: 'Gold'  },
                        { color: '#8B7B6B', label: 'Brown' },
                        { color: '#2563eb', label: 'Blue'  },
                        { color: '#059669', label: 'Green' },
                        { color: '#dc2626', label: 'Red'   },
                      ].map(({ color, label }, i) => (
                        <button key={color} title={label}
                          className={cn('w-9 h-9 rounded-full border-4 transition-transform hover:scale-110', i === 0 ? 'border-[#1A1410] scale-110' : 'border-transparent')}
                          style={{ background: color }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── AI Models ── */}
              {tab === 'models' && (
                <div className="space-y-6">
                  <h2 className="font-display text-base font-semibold text-[#1A1410]">AI Provider & Model</h2>

                  {/* Usage bar */}
                  <div className="bg-[#FAFAF8] border border-[#E8E0D6] rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-[#6B5D52]">Daily messages (free tier)</p>
                      <p className="text-xs font-bold text-[#1A1410]">{messagesLeft} / {dailyLimit} left</p>
                    </div>
                    <div className="w-full bg-[#E8E0D6] rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-[#C4A484] to-[#8B7B6B] rounded-full h-2 transition-all"
                        style={{ width: `${Math.min(100, (messagesLeft / dailyLimit) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-[#A89585] mt-2">
                      Add your own API key below to get unlimited messages.
                    </p>
                  </div>

                  {/* Provider selector */}
                  <div>
                    <label className="text-xs font-semibold text-[#6B5D52] block mb-3 uppercase tracking-wider">Provider</label>
                    <div className="space-y-2">
                      {PROVIDERS.map((p) => (
                        <button key={p.id} onClick={() => {
                          setProvider(p.id);
                          setModel(MODELS_BY_PROVIDER[p.id][0].id);
                        }}
                          className={cn(
                            'w-full flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition',
                            provider === p.id ? 'border-[#C4A484] bg-[#FDF8F4]' : 'border-[#E8E0D6] hover:border-[#C4A484]'
                          )}>
                          <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', p.color.replace('text-','bg-'))} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-[#1A1410]">{p.name}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-[#F5F2EF] border border-[#E8E0D6] rounded-full text-[#8B7B6B]">{p.badge}</span>
                            </div>
                            <p className="text-xs text-[#8B7B6B] mt-0.5 leading-relaxed">{p.desc}</p>
                          </div>
                          {provider === p.id && <Check className="w-4 h-4 text-[#C4A484] shrink-0 mt-0.5" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Model selector */}
                  <div>
                    <label className="text-xs font-semibold text-[#6B5D52] block mb-3 uppercase tracking-wider">Model</label>
                    <div className="grid grid-cols-1 gap-2">
                      {(MODELS_BY_PROVIDER[provider] || []).map((m) => (
                        <button key={m.id} onClick={() => setModel(m.id)}
                          className={cn(
                            'flex items-center justify-between px-4 py-3 rounded-2xl border-2 text-left transition',
                            model === m.id ? 'border-[#C4A484] bg-[#FDF8F4]' : 'border-[#E8E0D6] hover:border-[#C4A484]'
                          )}>
                          <div>
                            <span className="text-sm font-medium text-[#1A1410]">{m.name}</span>
                            <span className="text-[11px] text-[#A89585] font-mono ml-2">{m.id}</span>
                          </div>
                          {m.tag && (
                            <span className={cn(
                              'text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0',
                              m.tag === 'Free'   ? 'bg-green-50 text-green-700 border-green-200' :
                              m.tag === 'Paid'   ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              m.tag === 'Search' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                   'bg-[#F5F2EF] text-[#8B7B6B] border-[#E8E0D6]'
                            )}>{m.tag}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button onClick={handleSaveProvider} disabled={saving}
                    className="btn-primary flex items-center gap-2 px-6 py-2.5 disabled:opacity-60">
                    {saved ? <><Check className="w-4 h-4" />Saved</> : saving ? 'Saving…' : <><Save className="w-4 h-4" />Save provider & model</>}
                  </button>
                </div>
              )}

              {/* ── API Keys ── */}
              {tab === 'apikeys' && (
                <div className="space-y-5">
                  <h2 className="font-display text-base font-semibold text-[#1A1410]">API Keys</h2>

                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                    <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-800 mb-0.5">Keys stored securely</p>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        Your API keys are stored encrypted in your private account and never exposed to other users or the browser.
                        Adding your own key removes the 25 messages/day limit.
                      </p>
                    </div>
                  </div>

                  {[
                    { id: 'groq',       label: 'Groq API Key',       placeholder: 'gsk_...',  link: 'https://console.groq.com/keys',   hasKey: hasKeys.groq,       value: groqKey,       setter: setGroqKey       },
                    { id: 'openrouter', label: 'OpenRouter API Key',  placeholder: 'sk-or-...', link: 'https://openrouter.ai/settings/keys', hasKey: hasKeys.openrouter, value: openrouterKey, setter: setOpenrouterKey },
                    { id: 'openai',     label: 'OpenAI API Key',      placeholder: 'sk-...',   link: 'https://platform.openai.com/api-keys', hasKey: hasKeys.openai,     value: openaiKey,     setter: setOpenaiKey     },
                    { id: 'anthropic',  label: 'Anthropic API Key',   placeholder: 'sk-ant-...', link: 'https://console.anthropic.com/account/keys', hasKey: hasKeys.anthropic, value: anthropicKey, setter: setAnthropicKey },
                  ].map((k) => (
                    <div key={k.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-[#6B5D52] uppercase tracking-wider">{k.label}</label>
                        <div className="flex items-center gap-2">
                          {k.hasKey && (
                            <span className="flex items-center gap-1 text-[11px] text-green-600 font-medium">
                              <CheckCircle2 className="w-3 h-3" /> Saved
                            </span>
                          )}
                          <a href={k.link} target="_blank" rel="noopener noreferrer"
                            className="text-[11px] text-[#C4A484] hover:text-[#a8896a] transition">
                            Get key ↗
                          </a>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <SecretInput
                            value={k.value}
                            onChange={k.setter}
                            placeholder={k.hasKey ? '••••••••••••••••••••' : k.placeholder}
                          />
                        </div>
                        {k.hasKey && (
                          <button onClick={() => handleDeleteKey(`${k.id}Key`)}
                            className="p-3 rounded-2xl border border-[#E8E0D6] text-[#A89585] hover:text-red-500 hover:border-red-200 transition"
                            title="Remove key">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <button onClick={handleSaveKeys} disabled={savingKeys || (!groqKey && !openaiKey && !anthropicKey && !openrouterKey)}
                    className="btn-primary flex items-center gap-2 px-6 py-2.5 disabled:opacity-60">
                    {keysSaved ? <><Check className="w-4 h-4" />Keys saved</> :
                     savingKeys ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> :
                     <><Save className="w-4 h-4" />Save API keys</>}
                  </button>
                </div>
              )}

              {/* ── Shortcuts ── */}
              {tab === 'shortcuts' && (
                <div className="space-y-5">
                  <h2 className="font-display text-base font-semibold text-[#1A1410]">Keyboard Shortcuts</h2>
                  <div className="space-y-2.5">
                    {[
                      { keys: ['⌘', 'K'],    label: 'New chat'              },
                      { keys: ['⌘', 'L'],    label: 'Clear & focus input'   },
                      { keys: ['⌘', '\\'],   label: 'Toggle artifact panel' },
                      { keys: ['⌘', 'D'],    label: 'Go to dashboard'       },
                      { keys: ['⌘', 'P'],    label: 'Go to projects'        },
                      { keys: ['/'],          label: 'Focus chat input'      },
                      { keys: ['?'],          label: 'Show shortcuts'        },
                      { keys: ['Shift', '↵'], label: 'New line in input'    },
                      { keys: ['↵'],          label: 'Send message'          },
                      { keys: ['Esc'],        label: 'Close panels'          },
                    ].map(({ keys, label }) => (
                      <div key={label} className="flex items-center justify-between py-1">
                        <span className="text-sm text-[#6B5D52]">{label}</span>
                        <div className="flex items-center gap-1">
                          {keys.map((k, i) => (
                            <kbd key={i} className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 bg-[#F5F2EF] border border-[#E8E0D6] rounded-lg text-xs font-mono font-semibold text-[#8B7B6B]">
                              {k}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
