"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement?: new (
          options: {
            pageLanguage: string;
            includedLanguages: string;
            autoDisplay?: boolean;
            layout?: unknown;
          },
          elementId: string
        ) => unknown;
      };
    };
  }
}

type LanguageCode = "en" | "hi";

function applyGoogleLanguage(language: LanguageCode) {
  const translateSelect = document.querySelector<HTMLSelectElement>(".goog-te-combo");

  if (!translateSelect) {
    return false;
  }

  translateSelect.value = language;
  translateSelect.dispatchEvent(new Event("change"));
  return true;
}

export function LanguageSwitcher() {
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) {
        return;
      }

      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "en,hi",
          autoDisplay: false
        },
        "google_translate_element"
      );

      setReady(true);
    };
  }, []);

  const onChange = (value: LanguageCode) => {
    setLanguage(value);

    const applied = applyGoogleLanguage(value);

    if (!applied) {
      window.setTimeout(() => {
        applyGoogleLanguage(value);
      }, 700);
    }
  };

  return (
    <>
      <div id="google_translate_element" className="google-translate-hidden" />
      <Script
        id="google-translate-script"
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
      <label className="language-switcher" htmlFor="footer-language-select">
        <span>Language</span>
        <select
          id="footer-language-select"
          value={language}
          onChange={(event) => onChange(event.target.value as LanguageCode)}
          disabled={!ready}
        >
          <option value="en">English</option>
          <option value="hi">Hindi</option>
        </select>
      </label>
    </>
  );
}
