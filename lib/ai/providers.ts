import { customProvider } from 'ai';
import { dify } from './dify';
import { createDifyModel } from './dify-provider';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import { isTestEnvironment } from '../constants';

// Declare Node.js globals
declare const process: any;

// Dify configuration with error handling
function createDifyModels() {
  try {
    // Use the enhanced createDifyModel function
    const difyModel = createDifyModel();

    return {
      'chat-model': difyModel,
      'chat-model-reasoning': difyModel,
      'title-model': difyModel,
      'artifact-model': difyModel,
    };
  } catch (error) {
    console.error('Failed to create Dify models:', error);
    console.warn('Falling back to custom Dify implementation');

    // Fallback to custom dify implementation
    const difyApiKey = process.env.DIFY_API_KEY || '';
    const difyBaseUrl = process.env.DIFY_BASE_URL || 'https://api.dify.ai/v1';

    const fallbackModel = dify({
      apiKey: difyApiKey,
      baseUrl: difyBaseUrl,
    });

    return {
      'chat-model': fallbackModel,
      'chat-model-reasoning': fallbackModel,
      'title-model': fallbackModel,
      'artifact-model': fallbackModel,
    };
  }
}

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: createDifyModels(),
    });
