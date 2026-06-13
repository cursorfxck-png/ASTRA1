import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";

export default function CartPage() {
  return (
    <main className="cart-page">
      <div className="cart-card">
        <h1>ASTRA Cart</h1>
        <SignedOut>
          <>
            <p>Sign up to check your cart and continue to checkout.</p>
            <div className="cart-actions">
              <SignUpButton mode="modal">
                <button type="button" className="button">
                  Sign Up To Check Cart
                </button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button type="button" className="button button--outline">
                  I Already Have An Account
                </button>
              </SignInButton>
            </div>
          </>
        </SignedOut>
        <SignedIn>
          <>
            <p>Your ASTRA cart is ready. Connect your product flow here next.</p>
            <div className="cart-placeholder">Cart items will appear here for signed-in users.</div>
          </>
        </SignedIn>
      </div>
    </main>
  );
}
