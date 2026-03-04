'use client';

import { startTransition, useEffect, useMemo, useOptimistic, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import { saveChatModelAsCookie } from '@/app/(chat)/actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DEFAULT_CHAT_MODEL, type ChatModel, fallbackChatModels } from '@/lib/ai/models';
import { cn } from '@/lib/utils';

import { CheckCircleFillIcon, ChevronDownIcon } from './icons';

interface BackendModel {
  id: string;
  object: string;
  owned_by: string;
}

/**
 * Format model ID to human readable name
 */
function formatModelName(modelId: string): string {
  // Remove prefixes like "ollama/", "hf.co/" etc.
  const parts = modelId.split('/');
  const name = parts[parts.length - 1];

  // Clean up the name
  return name
    .replace(/:latest$/, '')
    .replace(/:Q4_K_M$/, '')
    .replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convert backend model to chat model format
 */
function convertToCharModel(backendModel: BackendModel): ChatModel {
  return {
    id: backendModel.id,
    name: formatModelName(backendModel.id),
    description: `${backendModel.owned_by}`, //remove Powered by
  };
}

export function ModelSelector({
  selectedModelId,
  className,
  onModelChange,
}: {
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [optimisticModelId, setOptimisticModelId] = useOptimistic(selectedModelId);
  const [models, setModels] = useState<ChatModel[]>(fallbackChatModels);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Fetch models from backend on mount
  useEffect(() => {
    async function fetchModels() {
      try {
        const response = await fetch('/api-i/models');
        if (response.ok) {
          const data = await response.json();
          if (data.data && Array.isArray(data.data)) {
            const chatModels = data.data.map(convertToCharModel);
            setModels(chatModels);

            // Auto-select the first model if current selection is invalid
            const isCurrentValid = chatModels.some((m: ChatModel) => m.id === selectedModelId);
            if (!isCurrentValid && chatModels.length > 0) {
              const firstModelId = chatModels[0].id;

              startTransition(() => {
                setOptimisticModelId(firstModelId);
              });

              await saveChatModelAsCookie(firstModelId);

              if (onModelChange) {
                console.log('✅ Auto-selecting first model calling onModelChange callback');
                onModelChange(firstModelId);
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
        // Keep fallback models
      } finally {
        setIsLoading(false);
      }
    }

    fetchModels();
  }, []);

  const selectedChatModel = useMemo(
    () =>
      models.find((chatModel) => chatModel.id === optimisticModelId) ||
      models[0],
    [optimisticModelId, models],
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
          className,
        )}
      >
        <Button
          data-testid="model-selector"
          variant="outline"
          className="md:px-2 md:h-[34px] bg-white shadow-md hover:bg-white/90 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          disabled={isLoading}
        >
          <span className="truncate max-w-[150px] md:max-w-none block text-left">
            {isLoading ? 'Loading...' : selectedChatModel?.name || 'Select Model'}
          </span>
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[300px] max-h-[400px] overflow-y-auto">
        {models.map((chatModel) => {
          const { id } = chatModel;

          return (
            <DropdownMenuItem
              data-testid={`model-selector-item-${id}`}
              key={id}
              onSelect={async () => {
                setOpen(false);

                // Update optimistic UI immediately
                startTransition(() => {
                  setOptimisticModelId(id);
                });

                // Wait for cookie to be set on server
                await saveChatModelAsCookie(id);

                // Call callback if provided, otherwise redirect to new chat
                console.log('🔄 Model selected:', id, 'hasCallback:', !!onModelChange);
                if (onModelChange) {
                  console.log('✅ Calling onModelChange callback');
                  onModelChange(id);
                } else {
                  // Fallback: redirect to new chat for backwards compatibility
                  console.log('⚠️ No onModelChange callback, redirecting to /');
                  window.location.href = '/';
                }
              }}
              data-active={id === optimisticModelId}
              asChild
            >
              <button
                type="button"
                className="gap-4 group/item flex flex-row justify-between items-center w-full"
              >
                <div className="flex flex-col gap-1 items-start">
                  <div>{chatModel.name}</div>
                  <div className="text-xs opacity-75">
                    {chatModel.description}
                  </div>
                </div>

                <div className="opacity-0 group-data-[active=true]/item:opacity-100">
                  <CheckCircleFillIcon />
                </div>
              </button>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
