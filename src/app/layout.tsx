import type { Metadata } from "next";
import ClientClerkProvider from "@/components/ClientClerkProvider";
import type { ReactNode } from "react";

import { clerkModalAppearance } from "@/lib/clerk-appearance";

import "./globals.css";

export const metadata: Metadata = {
  title: "ASTRA",
  description: "ASTRA landing page with a built-in CMS, language switching, and auth-gated cart access."
  ,
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {/* Client-side error reporter (dev only) */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            if (location.hostname === 'localhost' || location.hostname.endsWith('.app.github.dev')) {
              function send(payload){
                try{navigator.sendBeacon && navigator.sendBeacon('/api/client-error', JSON.stringify(payload)) || fetch('/api/client-error',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});}catch(e){}
              }
              window.addEventListener('error', function(e){
                send({type:'error',message:e.message,filename:e.filename,lineno:e.lineno,colno:e.colno,stack:e.error && e.error.stack});
              });
              window.addEventListener('unhandledrejection', function(e){
                send({type:'unhandledrejection',message: (e.reason && e.reason.message) || String(e.reason),stack: (e.reason && e.reason.stack) || null});
              });
              var old = console.error; console.error = function(){ try{ send({type:'console.error',args: Array.from(arguments)}); }catch(e){} old && old.apply(console, arguments); };
            }
          })();
        ` }} />
        <ClientClerkProvider>
          {children}
        </ClientClerkProvider>
      </body>
    </html>
  );
}
