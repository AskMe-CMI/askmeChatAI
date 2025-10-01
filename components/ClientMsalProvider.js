import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from '../lib/auth/msal-config';

// This component is dynamically imported client-side only from _app.js to avoid
// importing msal-browser on the server.
const pca = new PublicClientApplication(msalConfig);

export default function ClientMsalProvider({ children }) {
  return <MsalProvider instance={pca}>{children}</MsalProvider>;
}
