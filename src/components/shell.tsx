"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAssistant } from "../state/assistant";
import { Icon } from "./icons";
const routes = [
  ["/", "현장 가이드", "compass"],
  ["/map", "빛 지도", "map"],
  ["/planner", "시간 계획", "clock"],
  ["/gear", "내 장비", "camera"],
];
export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname(),
    { state, message, savePlan } = useAssistant();
  const navigation = routes.map(([href, label, icon]) => (
    <Link
      key={href}
      href={href}
      className={`navbtn ${path === href ? "active" : ""}`}
      aria-current={path === href ? "page" : undefined}
    >
      <Icon name={icon} />
      {label}
    </Link>
  ));
  return (
    <>
      <div className="shell">
        <aside className="sidebar">
          <nav className="sidenav" id="desktopNav" aria-label="주 메뉴">
            {navigation}
          </nav>
          <div className="sidebar-bottom" />
        </aside>
        <div className="content">
          <header className="topbar">
            <div className="mobile-brand brand">
              <div className="brandname">Photography Assistant</div>
            </div>
            <span className="breadcrumb">
              Photography Assistant / {routes.find((r) => r[0] === path)?.[1]}
            </span>
            <div className="topbar-right">
              <span className="demo-label">
                {state.source === "sample" ? "예시 좌표" : "선택 위치"} · 계산값
              </span>
              <button
                className="btn light"
                id="saveBtn"
                disabled={!state.ready}
                onClick={() => savePlan(false)}
                title="좌표를 제외하고 계획 저장"
              >
                <Icon name="bookmark" />
                저장
              </button>
            </div>
          </header>
          <main className="main">
            {state.ready ? (
              children
            ) : (
              <p role="status">촬영 조건 불러오는 중…</p>
            )}
            <noscript>
              위치·천문 계산을 사용하려면 JavaScript를 활성화하세요.
            </noscript>
          </main>
        </div>
      </div>
      <nav className="mobile-nav" id="mobileNav" aria-label="모바일 주 메뉴">
        {navigation}
      </nav>
      <div
        className={`toast ${message ? "show" : ""}`}
        id="toast"
        role="status"
        aria-live="polite"
      >
        {message}
      </div>
    </>
  );
}
