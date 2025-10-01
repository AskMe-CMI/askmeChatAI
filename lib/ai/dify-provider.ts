// Declare Node.js globals
declare const process: any;
declare const require: any;

// Temporary workaround for TypeScript module resolution issues
const createDifyProvider = (require('dify-ai-provider') as any)
  .createDifyProvider;

// Validate environment variables
function validateDifyConfig() {
  const apiKey = process.env.DIFY_API_KEY;
  const baseUrl = process.env.DIFY_BASE_URL;
  const appId = process.env.DIFY_APP_ID;

  if (!apiKey) {
    throw new Error('DIFY_API_KEY environment variable is required');
  }

  if (!apiKey.startsWith('app-')) {
    throw new Error(
      'DIFY_API_KEY must start with "app-" (format: app-xxxxxxxxxxxxxxxxxxxxxxxx)',
    );
  }

  if (!appId) {
    throw new Error('DIFY_APP_ID environment variable is required');
  }

  if (!appId.startsWith('app-')) {
    throw new Error(
      'DIFY_APP_ID must start with "app-" (format: app-xxxxxxxxxxxxxxxxxxxxxxxx)',
    );
  }

  return { apiKey, baseUrl, appId };
}

// Custom fetch with detailed error handling
async function customFetch(
  input: URL | RequestInfo,
  init?: RequestInit,
): Promise<Response> {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : 'Unknown';

  console.log('🌐 Dify API Request:', {
    url,
    method: init?.method || 'GET',
    headers: init?.headers,
    bodyLength: init?.body ? String(init.body).length : 0,
  });

  try {
    // Create AbortController for timeout (compatible with older Node.js versions)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });

    clearTimeout(timeoutId); // Clear timeout if request succeeds

    console.log('📡 Dify API Response:', {
      url,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      ok: response.ok,
    });

    return response;
  } catch (error) {
    console.error('❌ Dify API Fetch Error:', {
      url,
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
    });
    throw error;
  }
}

// Create Dify provider instance for self-hosted Dify
export const difyProvider = createDifyProvider({
  baseURL: process.env.DIFY_BASE_URL || 'https://dify.askme.co.th/v1',
  fetch: customFetch, // Use custom fetch for debugging
});

// Create model instance with validation
export function createDifyModel(appId?: string) {
  try {
    const config = validateDifyConfig();
    const finalAppId = appId || config.appId;

    console.log('🔧 ENV:', {
      CLIENT_ID: process.env.OIDC_CLIENT_ID || 'undefined',
      TENANT_ID: process.env.OIDC_TENANT_ID || 'undefined',
      CALLBACK_URL: process.env.OIDC_CALLBACK_URL || 'undefined'
    });

    console.log('🔧 Creating Dify Model:', {
      appId: `${finalAppId.substring(0, 10)}...`,
      baseURL: process.env.DIFY_BASE_URL,
      responseMode: 'streaming',
    });

    return difyProvider(finalAppId, {
      responseMode: 'streaming' as const, // Type-safe response mode
      apiKey: config.apiKey,
    });
  } catch (error) {
    console.error('Dify configuration error:', error);
    throw error;
  }
}

// Default model using environment variables
export const difyModel = createDifyModel();
