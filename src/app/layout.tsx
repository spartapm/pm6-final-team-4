import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { GTM_ID } from "@/lib/analytics";
import "./globals.css";

export const metadata: Metadata = {
  title: "모아성 MVP",
  description: "함께 집안일을 모아 성을 완성하는 커플 가사 관리 서비스",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#8c63ff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <Script id="gtm-init" strategy="beforeInteractive">
          {`window.dataLayer=window.dataLayer||[];`}
        </Script>
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      </head>
      <body>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="gtm"
          />
        </noscript>
        {children}
      </body>
    </html>
  );
}
