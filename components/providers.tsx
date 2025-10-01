'use client';

import dynamic from 'next/dynamic';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';

// Dynamically import ClientMsalProvider to avoid SSR issues with msal
const ClientMsalProvider = dynamic(() => import('@/components/ClientMsalProvider'), { 
  ssr: false,
  // loading: () => <div>Loading authentication...</div>
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClientMsalProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <Toaster position="top-center" />
        {children}
      </ThemeProvider>
    </ClientMsalProvider>
  );
}
