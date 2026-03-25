  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  // Diagnostic logging for Netlify
  console.log('App initialization started...');
  console.log('Environment:', import.meta.env.MODE);

  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    console.error('Failed to find the root element');
  } else {
    try {
      createRoot(rootElement).render(<App />);
      console.log('App rendered successfully');
    } catch (error) {
      console.error('App render failed:', error);
      rootElement.innerHTML = `
        <div style="padding: 20px; color: red; font-family: sans-serif;">
          <h1>Initialization Error</h1>
          <p>The application failed to start correctly. Please check the console for details.</p>
          <pre>${error instanceof Error ? error.message : String(error)}</pre>
        </div>
      `;
    }
  }