declare module 'ai' {
  // Augment UIMessagePart to include common optional properties used in the app
  interface UIMessagePart<TData = any, TTools = any> {
    // Common optional fields produced by various tool outputs
    text?: string;
    url?: string;
    filename?: string;
    mediaType?: string;
    image?: string;
  }

  // Also provide a loose Message alias if needed
  interface UIMessage<TMeta = any, TData = any, TTools = any> {
    parts?: UIMessagePart<TData, TTools>[];
  }
}
