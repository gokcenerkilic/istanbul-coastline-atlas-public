
import React from 'react';

export default function Layout({ children, currentPageName }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hack:wght@400;700&display=swap');
        
        :root {
          --font-sans: 'Hack', monospace;
          --font-mono: 'Hack', monospace;
        }

        * {
          font-family: 'Hack', monospace !important;
        }

        body, html, div, span, p, h1, h2, h3, h4, h5, h6, 
        button, input, textarea, select, option, label,
        .leaflet-popup-content, .leaflet-control {
          font-family: 'Hack', monospace !important;
        }

        .hover-popup .leaflet-popup-content-wrapper {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 8px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }

        .hover-popup .leaflet-popup-tip {
          background: rgba(255, 255, 255, 0.95);
        }
      `}</style>
      {children}
    </>
  );
}
