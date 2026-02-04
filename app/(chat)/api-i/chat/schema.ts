import { z } from 'zod';

const textPartSchema = z.object({
  type: z.enum(['text']),
  text: z.string().min(1).max(10000),
});

const filePartSchema = z.object({
  type: z.enum(['file']),
  mediaType: z.string().min(1), // Accept any media type from backend
  name: z.string().min(1).max(255),
  url: z.string().min(1), // Accept relative paths from backend API
});

const partSchema = z.union([textPartSchema, filePartSchema]);

export const postRequestBodySchema = z.object({
  // Accept both UUID (new chats) and integer string (Backend API session IDs)
  id: z.string().min(1),
  message: z.object({
    id: z.string().uuid(),
    role: z.enum(['user']),
    parts: z.array(partSchema),
  }),
  selectedChatModel: z.string().min(1), // Accept any model ID from Backend API
  selectedVisibilityType: z.enum(['public', 'private']),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
