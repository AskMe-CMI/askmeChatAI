import { cookies } from 'next/headers';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getSessionFromAPI } from '@/lib/auth/local-auth';
import Script from 'next/script';
import { DataStreamProvider } from '@/components/data-stream-provider';
import { sha512 } from 'js-sha512';

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([
    getSessionFromAPI(),
    cookies(),
  ]);
  // Default to open (false = not collapsed) if no cookie is set
  const sidebarState = cookieStore.get('sidebar:state')?.value;
  const isCollapsed = sidebarState === 'false';

  // console.log('Layout session:', session);

  // Convert API session to UserPayload format
  const userPayload = session
    ? {
        sub: session.id,
        // email: session.email,
        email: `${sha512(`AskMe${session.email}`).substring(0,4)}-${sha512(`AskMe${session.email}`).substring(5,10)}-${sha512(`AskMe${session.email}`).substring(11,15)}-${sha512(`AskMe${session.email}`).substring(16,20)}`,
        emailRmutl: session.emailRmutl,
        type: 'regular' as const,
      }
    : null;

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <DataStreamProvider>
        <SidebarProvider defaultOpen={!isCollapsed}>
          <AppSidebar user={userPayload} />
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
      </DataStreamProvider>
    </>
  );
}
