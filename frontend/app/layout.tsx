import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Sora, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets:  ['latin'],
  weight:   ['400', '500', '600', '700', '800'],
  variable: '--font-display',
  display:  'swap',
});

const sora = Sora({
  subsets:  ['latin'],
  weight:   ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display:  'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets:  ['latin'],
  weight:   ['400', '500'],
  variable: '--font-mono',
  display:  'swap',
});

export const metadata: Metadata = {
  title:       'ClaudGPT — Your AI Dev Assistant',
  description: "Build full-stack apps, WhatsApp bots, automation tools, and APIs with ClaudGPT's multi-agent AI system. Powered by Groq — all free.",
  keywords:    ['AI', 'developer', 'assistant', 'code', 'ClaudGPT', 'Groq'],
  authors:     [{ name: 'Emmanuel ARIYO', url: 'https://github.com/Ememzyvisuals' }],
  metadataBase: new URL('https://claudgpt.vercel.app'),
  openGraph: {
    title:       'ClaudGPT — Your AI Dev Assistant',
    description: 'Multi-agent AI coding assistant powered by Groq. Free forever.',
    url:         'https://claudgpt.vercel.app',
    siteName:    'ClaudGPT',
    type:        'website',
  },
};

// Inline script as a plain string — avoids template literal parse errors
const themeScript = `
  try {
    var s = localStorage.getItem('claudgpt-theme');
    var t = s ? JSON.parse(s) : null;
    var theme = (t && t.state && t.state.theme) || 'light';
    var size  = (t && t.state && t.state.fontSize) || 'md';
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-fontsize', size);
  } catch(e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply theme before first paint to prevent flash */}
        {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${plusJakarta.variable} ${sora.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
