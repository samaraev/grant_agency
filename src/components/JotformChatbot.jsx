import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const EMBED_URL = 'https://cdn.jotfor.ms/agent/embedjs/01a1c56d15d8700089923d6ff1f4e9df5bcc/embed.js';
const ROOT_ID = 'JotformAgent-01a1c56d15d8700089923d6ff1f4e9df5bcc';

export default function JotformChatbot() {
  const { pathname } = useLocation();

  useEffect(() => {
    const isHomepage = pathname === '/';
    const updateVisibility = () => {
      const root = document.getElementById(ROOT_ID);
      if (root) root.style.display = isHomepage ? '' : 'none';
    };

    updateVisibility();
    const observer = new MutationObserver(updateVisibility);
    observer.observe(document.body, { childList: true });

    if (isHomepage && !Array.from(document.scripts).some((script) => script.src === EMBED_URL)) {
      const script = document.createElement('script');
      script.src = EMBED_URL;
      script.async = true;
      script.addEventListener('error', () => {
        console.error('Failed to load the Jotform chatbot embed:', EMBED_URL);
        script.remove();
      }, { once: true });
      document.head.appendChild(script);
    }

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
