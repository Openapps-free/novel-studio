import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import * as Sentry from "@sentry/react";

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: "YOUR_SENTRY_DSN_HERE", // Replace with actual DSN
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 1.0,
  });
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<p>An error occurred. Please restart the app.</p>}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
);
