import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AssistantProvider } from "../state/assistant";
import { Shell } from "../components/shell";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Photography Assistant",
    template: "%s | Photography Assistant",
  },
  description: "미러리스 촬영자를 위한 위치·시간·천문 계산 도구",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f5f4ef",
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AssistantProvider>
          <Shell>{children}</Shell>
        </AssistantProvider>
      </body>
    </html>
  );
}
