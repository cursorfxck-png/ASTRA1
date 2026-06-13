import type { SiteContent } from "@/lib/types";
import { unstable_noStore as noStore } from "next/cache";
import {
  getLandingPageFromSupabase,
  updateLandingPageInSupabase,
  isSupabaseConfigured,
  SupabaseContentError,
} from "@/lib/supabase";
import { getSupabaseConfigError } from "@/lib/supabase-env";
import {
  getDefaultSiteContent,
  mergeSiteContentWithDefaults,
} from "@/lib/content-merge";

function parseRawContent(raw: unknown): unknown {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      throw new SupabaseContentError("NOT_FOUND", "landing_page.content is invalid JSON");
    }
  }
  return raw;
}

function normalizeSiteContent(raw: unknown): SiteContent {
  const parsed = parseRawContent(raw);

  if (!parsed || typeof parsed !== "object") {
    throw new SupabaseContentError("NOT_FOUND", "landing_page.content is empty or invalid JSON");
  }

  const content = parsed as SiteContent;
  if (!Array.isArray(content.heroSlides)) {
    content.heroSlides = [];
  }

  return content;
}

async function fetchRawSiteContent(): Promise<SiteContent> {
  const raw = await getLandingPageFromSupabase();
  return normalizeSiteContent(raw);
}

/**
 * CMS-only loader — always reads raw content from Supabase landing_page table.
 */
export async function getCmsContent(): Promise<SiteContent> {
  noStore();

  const configError = getSupabaseConfigError();
  if (configError) {
    throw new Error(configError);
  }

  return fetchRawSiteContent();
}

/**
 * Public site loader — Local defaults FIRST, then merge with Supabase if available.
 */
export async function getSiteContent(): Promise<SiteContent> {
  noStore();

  const defaults = getDefaultSiteContent();

  if (!isSupabaseConfigured) {
    console.warn("[CMS]", getSupabaseConfigError() ?? "Supabase not configured");
    console.log("[CMS] Using local defaults with", defaults.heroSlides.length, "hero slides");
    return defaults;
  }

  try {
    const raw = await fetchRawSiteContent();
    
    // If Supabase has no hero slides, use defaults entirely
    if (!raw.heroSlides || raw.heroSlides.length === 0) {
      console.log("[CMS] Supabase has no hero slides, using local defaults");
      return defaults;
    }
    
    const merged = mergeSiteContentWithDefaults(raw, defaults);
    console.log("[CMS] Loaded from Supabase:", merged.heroSlides.length, "hero slides");
    console.log("[CMS] Hero URLs:", merged.heroSlides.map(s => s.mediaUrl));
    return merged;
  } catch (error: unknown) {
    if (error instanceof SupabaseContentError) {
      console.warn(`[CMS] ${error.message}${error.details ? ` (${error.details})` : ""}`);
    } else {
      console.warn("[CMS] Supabase fetch failed:", error);
    }
    console.log("[CMS] Falling back to defaults with", defaults.heroSlides.length, "hero slides");
    return defaults;
  }
}

export async function saveSiteContent(content: SiteContent): Promise<void> {
  const configError = getSupabaseConfigError();
  if (configError) {
    throw new Error(configError);
  }

  try {
    await updateLandingPageInSupabase(content);
  } catch (error) {
    if (error instanceof SupabaseContentError) {
      throw new Error(error.message);
    }

    console.error("Failed to save landing page:", error);
    throw new Error("Failed to save content to Supabase");
  }
}
