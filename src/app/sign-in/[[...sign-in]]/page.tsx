import { SignIn } from "@clerk/nextjs";

import { clerkAuthAppearance } from "@/lib/clerk-appearance";

export default function SignInPage() {
  return (
    <main className="auth-page">
      <div className="auth-container">
        <SignIn appearance={clerkAuthAppearance} />
      </div>
    </main>
  );
}
