import { SignUp } from "@clerk/nextjs";

import { clerkAuthAppearance } from "@/lib/clerk-appearance";

export default function SignUpPage() {
  return (
    <main className="auth-page">
      <div className="auth-container">
        <SignUp appearance={clerkAuthAppearance} />
      </div>
    </main>
  );
}
