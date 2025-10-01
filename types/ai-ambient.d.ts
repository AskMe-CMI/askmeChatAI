declare module 'ai' {
  // Generic helpers
  export function generateText(...args: any[]): any;
  export function generateId(...args: any[]): string;
  export function simulateReadableStream(...args: any[]): any;

  // Message / UI types
  export interface UIMessagePart<TData = any, TTools = any> {
    type?: string;
    text?: string;
    url?: string;
    filename?: string;
    mediaType?: string;
    image?: string;

    // tool-related fields
    toolCallId?: string;
    state?: 'input-available' | 'output-available' | string;
    input?: any;
    output?: any;
    reason?: string;
    [key: string]: any;
  }

  export type UIMessage<TMeta = any, TData = any, TTools = any> = {
    id?: string;
    role?: string;
    parts?: UIMessagePart<TData, TTools>[];
    metadata?: TMeta;
  };

  export type DataUIPart<T = any> = UIMessagePart<T>;
  export type ModelMessage = any;

  // Streams / tools
  export function streamObject(...args: any[]): any;
  export function streamText(...args: any[]): any;
  export function createUIMessageStream(...args: any[]): any;
  export type UIMessageStreamWriter<T = any> = any;
  export function tool(...args: any[]): any;
  export function JsonToSseTransformStream(...args: any[]): any;

  // Providers / models
  export function customProvider(...args: any[]): any;
  export const DefaultChatTransport: any;
  export type InferUITool<T> = any;

  // V2 model types (if code references newer API)
  export const LanguageModelV2: any;
  // also export a type so code can import it as a type
  export type LanguageModelV2 = any;
  export type LanguageModelV2CallOptions = any;

  // image helpers
  export function experimental_generateImage(...args: any[]): any;

  // other helpers used by tests
  export function generateId(...args: any[]): string;
}
