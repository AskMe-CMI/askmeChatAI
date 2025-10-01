import type {
  LanguageModelV2,
  LanguageModelV2CallOptions,
} from 'ai';
import { z } from 'zod';

// Define the schema for the Dify API configuration
const difyConfigurationSchema = z.object({
  apiKey: z.string(),
  baseUrl: z.string().url().optional(),
});

/**
 * Creates a Dify language model that implements the `LanguageModelV2` interface.
 */
function createDify(
  config: z.infer<typeof difyConfigurationSchema>,
): LanguageModelV2 {
  const validatedConfig = difyConfigurationSchema.parse(config);

  const dynamicBaseUrl =
    validatedConfig.baseUrl ?? 'https://api.dify.ai/v1';

  return {
    specificationVersion: 'v2',
    modelId: 'dify-chat',
    provider: 'dify',
    defaultObjectGenerationMode: 'json',
    
    async doGenerate(options: LanguageModelV2CallOptions) {
      const { prompt, mode, ...settings } = options;
      
      // Extract the last user message as the query
      const lastMessage = prompt[prompt.length - 1];
      let query = '';
      
      if (lastMessage?.content) {
        if (typeof lastMessage.content === 'string') {
          query = lastMessage.content;
        } else if (Array.isArray(lastMessage.content)) {
          // Handle multimodal content
          const textContent = lastMessage.content.find(
            (part: any) => part.type === 'text'
          );
          query = textContent?.text || '';
        }
      }

      // Prepare the request body for Dify's chat-messages endpoint
      const requestBody = {
        inputs: {},
        query: query,
        user: 'admin@rmutl.ac.th', // Use actual user email
        response_mode: 'streaming', // Agent Chat App requires streaming mode
        conversation_id: ''
      };

      console.log('Dify API Request:', {
        url: `${dynamicBaseUrl}/chat-messages`,
        body: requestBody,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validatedConfig.apiKey.substring(0, 10)}...`,
        }
      });

      const response = await fetch(`${dynamicBaseUrl}/chat-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validatedConfig.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: options.abortSignal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Dify API Error Response:', errorText);
        throw new Error(`Dify API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // For streaming mode, we need to read the stream and collect the response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body available');
      }

      let fullText = '';
      let completionTokens = 0;
      let promptTokens = 0;
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                break;
              }
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.answer) {
                  fullText += parsed.answer;
                }
                // Extract token usage if available
                if (parsed.metadata?.usage) {
                  promptTokens = parsed.metadata.usage.prompt_tokens || promptTokens;
                  completionTokens = parsed.metadata.usage.completion_tokens || completionTokens;
                }
              } catch (e) {
                console.log('Skipping invalid JSON line:', data);
                // Skip invalid JSON lines
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
      
      return {
        text: fullText || 'Generated title',
        toolCalls: [],
        finishReason: 'stop' as const,
        usage: {
          promptTokens,
          completionTokens,
        },
        rawResponse: { headers: response.headers },
      };
    },

    async doStream(options: LanguageModelV2CallOptions) {
      const { prompt, mode, ...settings } = options;
      
      // Extract the last user message as the query
      const lastMessage = prompt[prompt.length - 1];
      let query = '';
      
      if (lastMessage?.content) {
        if (typeof lastMessage.content === 'string') {
          query = lastMessage.content;
        } else if (Array.isArray(lastMessage.content)) {
          const textContent = lastMessage.content.find(
            (part: any) => part.type === 'text'
          );
          query = textContent?.text || '';
        }
      }

      // Prepare the request body for Dify's chat-messages endpoint
      const requestBody = {
        inputs: {},
        query: query,
        user: 'ai-chatbot-user',
        response_mode: 'streaming',
        conversation_id: '',
      };

      const response = await fetch(`${dynamicBaseUrl}/chat-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validatedConfig.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: options.abortSignal,
      });

      if (!response.ok) {
        throw new Error(`Dify API error: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('The response body is empty.');
      }

      // Create a readable stream to process Dify's Server-Sent Events
      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body?.getReader();
          if (!reader) {
            controller.error(new Error('ReadableStream reader is not available'));
            controller.close();
            return;
          }
          const decoder = new TextDecoder();

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n');
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const jsonData = line.substring(6).trim();
                    if (jsonData === '[DONE]') {
                      controller.enqueue({
                        type: 'finish',
                        finishReason: 'stop',
                        usage: {
                          promptTokens: 0,
                          completionTokens: 0,
                        },
                      });
                      continue;
                    }
                    
                    const data = JSON.parse(jsonData);
                    if (data.event === 'message' && data.answer) {
                      controller.enqueue({
                        type: 'text-delta',
                        textDelta: data.answer,
                      });
                    }
                  } catch (e) {
                    // Ignore parsing errors for incomplete JSON chunks
                  }
                }
              }
            }
          } finally {
            try {
              reader.releaseLock();
            } catch (e) {
              // ignore if reader already released
            }
            controller.close();
          }
        },
      });

      return {
        stream,
        rawResponse: { headers: response.headers },
      };
    },
  };
}

// Export the factory function
export const dify = createDify;
