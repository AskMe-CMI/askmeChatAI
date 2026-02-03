'use client';

import type { UserPayload } from '@/app/(auth)/auth';

import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import Link from 'next/link';

export function AppSidebar({ user }: { user: UserPayload | null | undefined }) {
  const { setOpenMobile, toggleSidebar, state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar className="group-data-[side=left]:border-r-0" collapsible="icon">
      <SidebarHeader className="group-data-[collapsible=icon]:group-data-[state=collapsed]:px-2 group-data-[collapsible=icon]:group-data-[state=collapsed]:py-2">
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center gap-2">
            {/* Logo - Link to home (expanded) / Toggle button (collapsed) */}
            {/* Expanded state: Logo as link */}
            <Link
              href="/"
              onClick={() => setOpenMobile(false)}
              className="flex items-center overflow-hidden group-data-[collapsible=icon]:group-data-[state=collapsed]:hidden"
            >
              <img
                src="/images/logoW.png"
                alt="logo"
                className="h-6 w-auto dark:hidden"
              />
              <img
                src="/images/logoB.png"
                alt="logo"
                className="h-6 w-auto hidden dark:block"
              />
            </Link>

            {/* Collapsed/Expanded Toggle Buttons */}
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleSidebar}
                    aria-expanded={false}
                    aria-label="Expand Sidebar"
                    className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-sidebar-accent transition-colors group/toggle-btn"
                  >
                    {/* Logo icon - hidden on hover */}
                    <img
                      src="/images/logoL.ico"
                      alt="logo"
                      className="h-6 w-6 dark:hidden group-hover/toggle-btn:hidden"
                    />
                    <img
                      src="/images/logoL.ico"
                      alt="logo"
                      className="h-6 w-6 hidden p-[0.275rem] bg-white rounded-full dark:block group-hover/toggle-btn:dark:hidden"
                    />
                    {/* Expand icon - shown on hover */}
                    <PanelLeft className="h-4 w-4 hidden group-hover/toggle-btn:block" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Expand Sidebar
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    aria-expanded={true}
                    aria-label="Collapse Sidebar"
                    className="h-8 w-8 shrink-0"
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Collapse Sidebar
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarHistory user={user} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarUserNav user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
