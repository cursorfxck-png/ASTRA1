import type { Appearance } from "@clerk/types";

export const clerkAuthAppearance: Appearance = {
  variables: {
    colorPrimary: "#111111",
    colorBackground: "#ffffff",
    colorText: "#111111",
    colorTextSecondary: "#666666",
    borderRadius: "1.2rem",
    fontSize: "1.6rem",
    spacingUnit: "1rem",
  },
  elements: {
    rootBox: "auth-root",
    card: "auth-card",
    cardBox: "auth-card-box",
    headerTitle: "auth-header-title",
    headerSubtitle: "auth-header-subtitle",
    socialButtonsBlockButton: "auth-social-button",
    formButtonPrimary: "auth-primary-button",
    footerActionLink: "auth-footer-link",
    formFieldInput: "auth-input",
    formFieldLabel: "auth-label",
    identityPreviewText: "auth-identity-text",
    identityPreviewEditButton: "auth-identity-edit",
    page: "auth-profile-page",
    profilePage: "auth-profile-page-inner",
    navbar: "auth-profile-navbar",
    navbarButtons: "auth-profile-navbar-buttons",
    navbarButton: "auth-profile-nav-button",
    navbarMobileMenuRow: "auth-profile-mobile-menu-row",
    navbarMobileMenuButton: "auth-profile-mobile-menu-button",
    pageScrollBox: "auth-profile-scroll",
    scrollBox: "auth-profile-scroll-inner",
    profileSection: "auth-profile-section",
    profileSectionTitle: "auth-profile-section-title",
    profileSectionContent: "auth-profile-section-content",
    profileSectionItem: "auth-profile-section-item",
    formFieldAction: "auth-field-action",
    dividerLine: "auth-divider-line",
    dividerText: "auth-divider-text",
    alertText: "auth-alert-text",
    otpCodeFieldInput: "auth-otp-input",
  },
};

export const clerkProfileAppearance: Appearance = {
  ...clerkAuthAppearance,
  variables: {
    ...clerkAuthAppearance.variables,
    fontSize: "1.5rem",
  },
};

export const clerkModalAppearance: Appearance = {
  ...clerkAuthAppearance,
  elements: {
    ...clerkAuthAppearance.elements,
    overlay: "clerk-overlay",
    modalContent: "clerk-modal",
    card: "clerk-card",
    headerTitle: "clerk-header-title",
    headerSubtitle: "clerk-header-subtitle",
    socialButtonsBlockButton: "clerk-social-button",
    formButtonPrimary: "clerk-primary-button",
    footerActionLink: "clerk-footer-link",
    formFieldInput: "clerk-input",
  },
};
