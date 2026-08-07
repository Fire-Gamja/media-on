import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta name="application-name" content="MEDIA ON 관리자" />
        <meta name="theme-color" content="#182366" />
        <meta
          name="description"
          content="서원대학교 미디어콘텐츠학부 관리자 업무 시스템"
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/pwa-icon-192.png" />
        <title>MEDIA ON 관리자</title>
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root { width: 100%; height: 100%; margin: 0; }
              body { background: #f2f4f8; overflow: hidden; }
              * { box-sizing: border-box; }
              button, input, textarea { font: inherit; }
              ::selection { background: rgba(24, 35, 102, 0.18); }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
