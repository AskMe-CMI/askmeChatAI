import type { Chat } from '@/lib/db/schema';
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from './ui/sidebar';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  MoreHorizontalIcon,
  TrashIcon,
} from './icons';
import { memo } from 'react';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

// Format exact date and time (e.g., "29 ม.ค. 2569 17:46")
function formatDateTime(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return '';

  // Convert string to Date if needed
  let date: Date;
  if (typeof dateInput === 'string') {
    // If string doesn't end with Z and doesn't have timezone offset, assume UTC and append Z
    // This handles Backend sending "2026-01-29T03:37:49" (UTC) without Z
    const isISOFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(dateInput);
    const hasTimezone = /Z|[+-]\d{2}:?\d{2}$/.test(dateInput);

    if (isISOFormat && !hasTimezone) {
      date = new Date(dateInput + 'Z');
    } else {
      date = new Date(dateInput);
    }
    // console.log('🕒 Date Debug:', { input: dateInput, parsed: date.toString(), iso: date.toISOString() });
  } else {
    date = dateInput;
  }

  // Validate the date
  if (isNaN(date.getTime())) return '';

  try {
    return new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
      calendar: 'buddhist',
      numberingSystem: 'latn', // Use Arabic numerals (0-9) instead of Thai numerals
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Bangkok'
    }).format(date);
  } catch (error) {
    // Fallback: manually add 543 years for broken environments
    const year = date.getFullYear() + 543;
    const month = date.toLocaleDateString('th-TH', { month: 'short' });
    const day = date.getDate();
    const time = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${day} ${month} ${year} ${time}`;
  }
}

// Get short model name (e.g., "gpt-4.1-mini" -> "4.1-mini")
function getShortModelName(model: string | undefined): string {
  if (!model) return '';
  // Remove common prefixes
  return model
    .replace(/^azure\//, '')
    .replace(/^gpt-/, '')
    .replace(/^claude-/, 'c-')
    .substring(0, 12);
}

const PureChatItem = ({
  chat,
  isActive,
  onDelete,
  setOpenMobile,
}: {
  chat: Chat;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  setOpenMobile: (open: boolean) => void;
}) => {
  const { visibilityType, setVisibilityType } = useChatVisibility({
    chatId: chat.id,
    initialVisibilityType: chat.visibility,
  });

  const modelShort = getShortModelName(chat.model);
  const msgCount = chat.messageCount ?? 0;
  // Use updated_at as requested, formatted as Date Time
  const lastActive = formatDateTime(chat.updatedAt);

  return (
    <SidebarMenuItem>
      <Tooltip>
        <TooltipTrigger asChild>
          <SidebarMenuButton
            asChild
            isActive={isActive}
            aria-current={isActive ? 'page' : undefined}
            className="h-auto py-2"
          >
            <Link href={`/chat/${chat.id}`} onClick={() => setOpenMobile(false)}>
              <div className="flex flex-col gap-0.5 w-full overflow-hidden text-primary">
                <span className="truncate font-medium text-sm">
                  {chat.title}
                </span>
                {/* Row 1: Model • Message count */}
                {(modelShort || msgCount > 0) && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {modelShort && (
                      <span className="truncate max-w-[80px]" title={chat.model}>
                        {modelShort}
                      </span>
                    )}
                    {modelShort && msgCount > 0 && <span>•</span>}
                    {msgCount > 0 && <span>{msgCount} msgs</span>}
                  </div>
                )}
                {/* Row 2: Date/Time */}
                {lastActive && (
                  <div className="text-xs text-muted-foreground/70">
                    {lastActive}
                  </div>
                )}
              </div>
            </Link>
          </SidebarMenuButton>
        </TooltipTrigger>
        {/* Tooltip only shows when collapsed */}
        <TooltipContent
          side="right"
          className="max-w-[200px] group-data-[collapsible=icon]:group-data-[state=expanded]:hidden"
        >
          <div>
            <div className="font-medium">{chat.title}</div>
            {(modelShort || msgCount > 0 || lastActive) && (
              <div className="text-xs text-muted-foreground mt-1">
                {[modelShort, msgCount > 0 ? `${msgCount} msgs` : '', lastActive].filter(Boolean).join(' • ')}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>

      {/* Dropdown menu - hide when collapsed */}
      <DropdownMenu modal={true}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground mr-0.5 group-data-[collapsible=icon]:group-data-[state=collapsed]:hidden"
            showOnHover={!isActive}
          >
            <MoreHorizontalIcon />
            <span className="sr-only">More</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive dark:text-red-500"
            onSelect={() => {
              console.log('🗑️ Delete menu item clicked for chat:', chat.id);
              onDelete(chat.id);
            }}
          >
            <TrashIcon />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) return false;
  if (prevProps.chat.id !== nextProps.chat.id) return false;
  if (prevProps.chat.title !== nextProps.chat.title) return false;
  if (prevProps.chat.messageCount !== nextProps.chat.messageCount) return false;
  if (String(prevProps.chat.lastMessageAt) !== String(nextProps.chat.lastMessageAt)) return false;
  return true;
});
