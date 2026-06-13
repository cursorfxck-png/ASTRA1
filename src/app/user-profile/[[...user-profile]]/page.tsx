import { UserProfile } from "@clerk/nextjs";

import { clerkProfileAppearance } from "@/lib/clerk-appearance";

export default function UserProfilePage() {
  return (
    <main className="auth-page auth-page--profile">
      <div className="auth-container auth-container--profile">
        <UserProfile
          appearance={clerkProfileAppearance}
          routing="path"
          path="/user-profile"
        />
      </div>
    </main>
  );
}
