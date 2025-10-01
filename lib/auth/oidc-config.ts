/**
 * OIDC Configuration for Microsoft Azure AD
 * Application: AI-Demo
 */
declare const process: any;
// โหลด environment variables ด้วย dotenv
// import { config } from 'dotenv';
// config();

export interface OIDCConfig {
  authority: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
  responseType: string;
  responseMode: string;
}


// Microsoft OIDC Configuration for AI-Demo Application
export const microsoftOIDCConfig: OIDCConfig = {
  // Authority URL for Microsoft Azure AD (without /v2.0 endpoint)
  authority: `https://login.microsoftonline.com/${ process.env.OIDC_TENANT_ID || 'NOT_FOUND_ENV_TENANT_ID'}`,
  
  // Application (client) ID from Azure App Registration
  clientId: process.env.OIDC_CLIENT_ID || 'NOT_FOUND_ENV_OIDC_CLIENT_ID',
  
  // Client Secret (เก็บใน server-side เท่านั้น)
  clientSecret: process.env.OIDC_CLIENT_SECRET || 'NOT_FOUND_ENV_OIDC_CLIENT_SECRET',
  
  // Redirect URI - อ่านจาก environment variable
  redirectUri: process.env.OIDC_CALLBACK_URL || 
    (typeof window !== 'undefined' 
      ? `${window.location.origin}/oidc/callback`
      : 'http://localhost:3000/oidc/callback'),
  
  // OIDC Scopes
  scope: 'openid profile email User.Read',
  
  // Response type for Authorization Code flow
  responseType: 'code',
  
  // Response mode
  responseMode: 'query'
};

// OIDC Endpoints
export const microsoftOIDCEndpoints = {
  authorization: `${microsoftOIDCConfig.authority}/oauth2/v2.0/authorize`,
  token: `${microsoftOIDCConfig.authority}/oauth2/v2.0/token`,
  userInfo: 'https://graph.microsoft.com/v1.0/me',
  logout: `${microsoftOIDCConfig.authority}/oauth2/v2.0/logout`,
  jwks: `${microsoftOIDCConfig.authority}/discovery/v2.0/keys`
};

// Debug function สำหรับตรวจสอบ environment variables
export function debugOIDCEnvironment() {
  if (typeof window === 'undefined') { // server-side only
    console.log('🔍 OIDC Environment Debug (with dotenv):');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- OIDC_CLIENT_ID:', process.env.OIDC_CLIENT_ID);
    console.log('- OIDC_TENANT_ID:', process.env.OIDC_TENANT_ID);
    console.log('- OIDC_CLIENT_SECRET exists:', !!process.env.OIDC_CLIENT_SECRET);
    console.log('- OIDC_CLIENT_SECRET length:', process.env.OIDC_CLIENT_SECRET?.length || 0);
    console.log('- OIDC_CLIENT_SECRET first 10:', process.env.OIDC_CLIENT_SECRET?.substring(0, 10) || 'N/A');
    console.log('- OIDC_CALLBACK_URL:', process.env.OIDC_CALLBACK_URL);
    console.log('- Config clientSecret length:', microsoftOIDCConfig.clientSecret.length);
  }
}

// OIDC Claims mapping
export const claimsMapping = {
  sub: 'sub',
  name: 'name',
  email: 'email',
  picture: 'picture',
  locale: 'locale'
};

// Generate state parameter for security
export function generateState(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Generate nonce parameter for ID token validation
export function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}