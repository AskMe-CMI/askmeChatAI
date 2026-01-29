import type { UserType } from '@/app/(auth)/auth';
import type { ChatModel } from './models';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<ChatModel['id']> | '*'; // '*' means all models allowed
}

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users with an account - allow all models from backend
   */
  regular: {
    maxMessagesPerDay: 100,
    availableChatModelIds: '*', // Allow all backend models
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};

/**
 * Check if a model ID is allowed for a given entitlements
 */
export function isModelAllowed(
  modelId: string,
  availableChatModelIds: Array<string> | '*'
): boolean {
  if (availableChatModelIds === '*') return true;
  return availableChatModelIds.includes(modelId);
}
