'use client';

import { ChevronUp } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useMsal } from "@azure/msal-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { signOut } from '@/app/(auth)/actions';
import type { UserPayload } from '@/app/(auth)/auth';

export function SidebarUserNav({
  user,
}: { user: UserPayload | null | undefined }) {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const { instance, accounts } = useMsal();

  const handleSignOut = async () => {
    try {
      if (accounts.length > 0) {
        await instance.logoutPopup();
      }
      await signOut();
    } catch (e) {
      console.error(e);
    }
    window.location.href = '/login';
  };

  if (!user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarMenuButton
                data-testid="login-button"
                className="data-[state=open]:bg-sidebar-accent bg-background h-10"
                onClick={() => router.push('/login')}
              >
                {/* Avatar placeholder for collapsed */}
                <div className="shrink-0 w-6 h-6 rounded-full bg-sidebar-accent flex items-center justify-center">
                  <span className="text-xs">?</span>
                </div>
                {/* Text hidden when collapsed */}
                <span className="group-data-[collapsible=icon]:group-data-[state=collapsed]:hidden">
                  Login
                </span>
              </SidebarMenuButton>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="group-data-[collapsible=icon]:group-data-[state=expanded]:hidden"
            >
              Login
            </TooltipContent>
          </Tooltip>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  data-testid="user-nav-button"
                  className="data-[state=open]:bg-sidebar-accent bg-background data-[state=open]:text-sidebar-accent-foreground h-10 group-data-[collapsible=icon]:group-data-[state=collapsed]:p-0 group-data-[collapsible=icon]:group-data-[state=collapsed]:justify-center"
                >
                  <Image
                    src={`https://avatar.vercel.sh/${user.emailRmutl}`}
                    alt={user.emailRmutl ?? 'User Avatar'}
                    width={24}
                    height={24}
                    className="rounded-full shrink-0"
                  />
                  {/* Text hidden when collapsed */}
                  <span
                    data-testid="user-email"
                    className="truncate group-data-[collapsible=icon]:group-data-[state=collapsed]:hidden"
                  >
                    {user.emailRmutl}
                  </span>
                  <ChevronUp className="ml-auto group-data-[collapsible=icon]:group-data-[state=collapsed]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="group-data-[collapsible=icon]:group-data-[state=expanded]:hidden"
            >
              {user.emailRmutl}
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent
            data-testid="user-nav-menu"
            side="top"
            className="w-[--radix-popper-anchor-width] min-w-[200px]"
          >
            <DropdownMenuItem
              data-testid="user-nav-item-theme"
              className="cursor-pointer"
              onSelect={() =>
                setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
              }
            >
              {`Toggle ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
            </DropdownMenuItem>
            {/* <DropdownMenuItem
              className="cursor-pointer"
              onSelect={() => router.push('/changelog')}
            >
              Change log
            </DropdownMenuItem> */}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild data-testid="user-nav-item-auth">
              <button
                type="button"
                className="w-full cursor-pointer"
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
