import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/themeContext';

export const metadata: Metadata = {
  title: 'OUSL LMS Digest — Academic Updates & Announcements',
  description: 'Clean personal digest dashboard for Open University of Sri Lanka LMS.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbf8f5' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f11' },
  ],
};

const themeScript = `
  (function() {
    try {
      var stored = localStorage.getItem('oulms-theme');
      var isDark = false;
      if (stored === 'dark') {
        isDark = true;
      } else if (stored === 'light') {
        isDark = false;
      } else {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-[#fbf8f5] dark:bg-[#0f0f11] text-[#4e080c] dark:text-[#f4f4f5] antialiased selection:bg-[#4e080c]/10 dark:selection:bg-[#4e080c]/30">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}


