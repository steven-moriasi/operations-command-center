import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import "./globals.css";

export const metadata: Metadata = {
  description: "Automation workflow monitoring and control console",
  title: "Operations Command Center",
};

const navigation = [
  "Overview",
  "Executions",
  "Workflows",
  "Incidents",
  "Audit log",
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <aside aria-label="Primary navigation" className="sidebar">
            <Link className="brand" href="/">
              <Image
                alt=""
                height={36}
                priority
                src="/mark.svg"
                width={36}
              />
              <span>Ops Command</span>
            </Link>
            <nav aria-label="Operations">
              <p className="nav-label">Workspace</p>
              <ul className="nav-list">
                {navigation.map((item, index) => (
                  <li key={item}>
                    <Link
                      aria-current={index === 0 ? "page" : undefined}
                      className="nav-item"
                      href={index === 0 ? "/" : `/#${item.toLowerCase()}`}
                    >
                      <i aria-hidden="true" className="nav-dot" />
                      <span>{item}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="environment">
              <strong>Reference environment</strong>
              <span>Local integration mode</span>
            </div>
          </aside>
          <main className="main">
            <header className="topbar">
              <span className="crumbs">Operations / Overview</span>
              <div className="operator">
                <div className="operator-copy">
                  <strong>Platform operator</strong>
                  <span>Fixture authentication</span>
                </div>
                <span aria-hidden="true" className="avatar">
                  PO
                </span>
              </div>
            </header>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
