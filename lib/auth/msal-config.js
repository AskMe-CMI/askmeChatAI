// msal configuration values are read from environment variables.
export const msalConfig = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_MSAL_CLIENT_ID || "",
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_MSAL_TENANT_ID || "common"}`,
    redirectUri: typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_REDIRECT_URI || ''
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false
  }
};
