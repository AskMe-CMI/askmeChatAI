'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { memo } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { VisibilityType } from './visibility-selector';
import type { ChatMessage } from '@/lib/types';

interface SuggestedActionsProps {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
  selectedVisibilityType: VisibilityType;
  disabled?: boolean;
}

function PureSuggestedActions({
  chatId,
  sendMessage,
  selectedVisibilityType,
  disabled,
}: SuggestedActionsProps) {
  const suggestedActions = [
    {
      title: 'AskMe Solutions & Consultants',
      label: 'Digital Transformation & IT Consulting',
      action: 'AskMe Solutions & Consultants Digital Transformation & IT Consulting',
    },
    {
      title: 'AskMe Solutions & Consultants',
      label: `AI, Data & Intelligent Solutions`,
      action: `AskMe Solutions & Consultants AI, Data & Intelligent Solutions`,
    },
    {
      title: 'AskMe Solutions & Consultants',
      label: `Cloud, System Integration & Security`,
      action: `AskMe Solutions & Consultants Cloud, System Integration & Security`,
    },
    {
      title: 'AskMe Solutions & Consultants',
      label: 'Enterprise Solutions & Custom Development',
      action: 'AskMe Solutions & Consultants Enterprise Solutions & Custom Development',
    },
  ];

  return (
    <div
      data-testid="suggested-actions"
      className="grid sm:grid-cols-2 gap-2 w-full"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={index > 1 ? 'hidden sm:block' : 'block'}
        >
          <Button
            variant="ghost"
            disabled={disabled}
            onClick={async () => {
              // Note: URL update is handled in chat.tsx onData when Backend session ID is received
              sendMessage({
                role: 'user',
                createdAt: new Date().toISOString(),
                parts: [{ type: 'text', text: suggestedAction.action }],
              });
            }}
            className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start bg-white/70 backdrop-blur-md shadow-lg hover:bg-white/90 hover:text-foreground hover:-translate-y-1 hover:shadow-xl transition-all duration-200 dark:bg-zinc-900/70 dark:hover:bg-zinc-900/90"
          >
            <span className="font-medium">{suggestedAction.title}</span>
            <span className="text-muted-foreground">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) return false;
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
      return false;
    if (prevProps.disabled !== nextProps.disabled) return false;

    return true;
  },
);
