// add this import
import Link from "next/link";
import HeaderUser from "@/components/HeaderUser";
import HeaderNav from "@/components/HeaderNav";

export const metadata = { title: "ResearchNett" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif" }}>
        <header style={{ borderBottom: "1px solid #eee", background: "#fafafa" }}>
          <nav
            style={{
              maxWidth: 1000,
              margin: "0 auto",
              padding: "0.75rem 1rem",
              display: "flex",
              gap: "1rem",
              alignItems: "center",
            }}
          >
            {/* was: <a href="/" ...> */}
            <Link href="/" style={{ fontWeight: 600 }}>ResearchNett</Link>

            <HeaderNav />

            <div style={{ marginLeft: "auto" }}>
              <HeaderUser />
            </div>
          </nav>
        </header>

        <main style={{ maxWidth: 1000, margin: "0 auto", padding: "1.25rem" }}>{children}</main>
        <footer style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem 1rem", color: "#666", fontSize: 12 }}>
          © {new Date().getFullYear()} ResearchNett (Pilot)
        </footer>
      </body>
    </html>
  );
}
