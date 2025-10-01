declare module 'ai' {
  // Minimal ambient declarations to satisfy TypeScript for this workspace.
  export function convertToModelMessages(...args: any[]): any;
  export function createUIMessageStream(...args: any[]): any;
  export class JsonToSseTransformStream {
    constructor(...args: any[]);
  }
  export function smoothStream(...args: any[]): any;
  export function stepCountIs(...args: any[]): any;
  export function streamText(...args: any[]): any;
  export class DefaultChatTransport {
    constructor(...args: any[]);
  }

  export type UIMessagePart<TData = any, TTools = any> = any;
  export type UIMessage<TMeta = any, TData = any, TTools = any> = any;
  export type InferUITool<T> = any;
}
