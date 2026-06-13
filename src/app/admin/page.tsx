import { AdminClient } from "@/components/AdminClient";
import { getCmsContent } from "@/lib/content";

export const dynamic = "force-dynamic";

function AdminSetupError({ message }: { message: string }) {
  return (
    <main className="admin-page">
      <div className="admin-shell">
        <header className="admin-header">
          <h1>ASTRA CMS</h1>
        </header>
        <section className="admin-panel" style={{ padding: "2.4rem" }}>
          <h2 style={{ marginBottom: "1.2rem" }}>Supabase connection required</h2>
          <p style={{ marginBottom: "1.6rem", lineHeight: 1.6 }}>{message}</p>
          <ol style={{ lineHeight: 1.8, paddingLeft: "2rem" }}>
            <li>
              Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> in <code>.env.local</code>
            </li>
            <li>Run <code>scripts/supabase-full-setup.sql</code> in Supabase SQL Editor</li>
            <li>Restart the dev server</li>
          </ol>
        </section>
      </div>
    </main>
  );
}

export default async function AdminPage() {
  try {
    const content = await getCmsContent();
    return <AdminClient initialContent={content} />;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load CMS content from Supabase landing_page table.";
    return <AdminSetupError message={message} />;
  }
}
