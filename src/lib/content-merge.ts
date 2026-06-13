import type {
  CollageSection,
  CollectionItem,
  FeaturedSection,
  FooterContent,
  HeroSlide,
  NavItem,
  NewsletterContent,
  ProductCard,
  RichTextContent,
  SiteContent,
} from "@/lib/types";
import defaultLandingContent from "@/data/site-content.json";

const DEFAULT_CONTENT = defaultLandingContent as SiteContent;

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function pickText(value: unknown, fallback: string): string {
  return hasText(value) ? value.trim() : fallback;
}

function mergeNavItems(db: NavItem[] | undefined, fallback: NavItem[]): NavItem[] {
  if (!db?.length) return fallback;
  return db.map((item, index) => {
    const fb = fallback[index] ?? fallback[fallback.length - 1];
    return {
      label: pickText(item.label, fb.label),
      href: pickText(item.href, fb.href),
      active: item.active ?? fb.active,
    };
  });
}

function mergeHeroSlide(db: HeroSlide): HeroSlide {
  return {
    id: hasText(db.id) ? db.id.trim() : `slide-${Date.now()}`,
    mediaType: db.mediaType === "video" ? "video" : "image",
    mediaUrl: hasText(db.mediaUrl) ? db.mediaUrl.trim() : "",
    mobileMediaUrl: hasText(db.mobileMediaUrl) ? db.mobileMediaUrl.trim() : undefined,
    buttonText: hasText(db.buttonText) ? db.buttonText.trim() : "",
    buttonUrl: hasText(db.buttonUrl) ? db.buttonUrl.trim() : "#",
    aspectRatio: hasText(db.aspectRatio) ? db.aspectRatio.trim() : undefined,
  };
}

function mergeHeroSlides(db: HeroSlide[] | undefined, fallback: HeroSlide[]): HeroSlide[] {
  const dbSlides = (db ?? [])
    .map((slide) => mergeHeroSlide(slide))
    .filter((slide) => hasText(slide.mediaUrl));

  if (dbSlides.length > 0) {
    return dbSlides;
  }

  return fallback.filter((slide) => hasText(slide.mediaUrl));
}

function mergeRichText(db: RichTextContent | undefined, fallback: RichTextContent): RichTextContent {
  const value = db ?? fallback;
  return {
    title: pickText(value.title, fallback.title),
    subtitle: pickText(value.subtitle, fallback.subtitle),
    buttonText: pickText(value.buttonText, fallback.buttonText),
    buttonUrl: pickText(value.buttonUrl, fallback.buttonUrl),
  };
}

function mergeCollection(db: CollectionItem, fallback: CollectionItem): CollectionItem {
  return {
    id: pickText(db.id, fallback.id),
    title: pickText(db.title, fallback.title),
    imageUrl: pickText(db.imageUrl, fallback.imageUrl),
    mobileImageUrl: hasText(db.mobileImageUrl) ? db.mobileImageUrl : fallback.mobileImageUrl,
    linkUrl: pickText(db.linkUrl, fallback.linkUrl),
  };
}

function mergeCollections(db: CollectionItem[] | undefined, fallback: CollectionItem[]): CollectionItem[] {
  if (!db?.length) return fallback;
  return db.map((item, index) => mergeCollection(item, fallback[index] ?? fallback[fallback.length - 1]));
}

function mergeProductCard(db: ProductCard | undefined, fallback: ProductCard): ProductCard {
  const value = db ?? fallback;
  return {
    title: pickText(value.title, fallback.title),
    imageUrl: pickText(value.imageUrl, fallback.imageUrl),
    mobileImageUrl: hasText(value.mobileImageUrl) ? value.mobileImageUrl : fallback.mobileImageUrl,
    price: hasText(value.price) ? value.price : fallback.price,
    linkUrl: pickText(value.linkUrl, fallback.linkUrl),
    imageRatio: pickText(value.imageRatio, fallback.imageRatio),
  };
}

function mergeProductCards(db: ProductCard[] | undefined, fallback: ProductCard[]): ProductCard[] {
  if (!db?.length) return fallback;
  return db.map((card, index) => mergeProductCard(card, fallback[index] ?? fallback[fallback.length - 1]));
}

function mergeCollage(db: CollageSection | undefined, fallback: CollageSection): CollageSection {
  const value = db ?? fallback;
  return {
    title: pickText(value.title, fallback.title),
    reverse: value.reverse ?? fallback.reverse,
    largeCard: mergeProductCard(value.largeCard, fallback.largeCard),
    stackedCards: mergeProductCards(value.stackedCards, fallback.stackedCards),
  };
}

function mergeFeatured(db: FeaturedSection | undefined, fallback: FeaturedSection): FeaturedSection {
  const value = db ?? fallback;
  return {
    title: pickText(value.title, fallback.title),
    items: mergeProductCards(value.items, fallback.items),
    buttonText: pickText(value.buttonText, fallback.buttonText),
    buttonUrl: pickText(value.buttonUrl, fallback.buttonUrl),
  };
}

function mergeNewsletter(db: NewsletterContent | undefined, fallback: NewsletterContent): NewsletterContent {
  const value = db ?? fallback;
  return {
    title: pickText(value.title, fallback.title),
    subtitle: pickText(value.subtitle, fallback.subtitle),
  };
}

function mergeFooter(db: FooterContent | undefined, fallback: FooterContent): FooterContent {
  const value = db ?? fallback;
  return {
    marketLabel: pickText(value.marketLabel, fallback.marketLabel),
    languageLabel: pickText(value.languageLabel, fallback.languageLabel),
    copyrightLine: pickText(value.copyrightLine, fallback.copyrightLine),
    companyLine: pickText(value.companyLine, fallback.companyLine),
  };
}

/** Fill only missing/empty Supabase fields with local defaults for public display. */
export function mergeSiteContentWithDefaults(
  dbContent: SiteContent,
  defaults: SiteContent = DEFAULT_CONTENT
): SiteContent {
  return {
    navigation: mergeNavItems(dbContent.navigation, defaults.navigation),
    heroSlides: mergeHeroSlides(dbContent.heroSlides, defaults.heroSlides),
    richText: mergeRichText(dbContent.richText, defaults.richText),
    collectionsHeading: pickText(dbContent.collectionsHeading, defaults.collectionsHeading),
    collections: mergeCollections(dbContent.collections, defaults.collections),
    collageOne: mergeCollage(dbContent.collageOne, defaults.collageOne),
    featuredSection: mergeFeatured(dbContent.featuredSection, defaults.featuredSection),
    collageTwo: mergeCollage(dbContent.collageTwo, defaults.collageTwo),
    newsletter: mergeNewsletter(dbContent.newsletter, defaults.newsletter),
    footer: mergeFooter(dbContent.footer, defaults.footer),
  };
}

export function getDefaultSiteContent(): SiteContent {
  return DEFAULT_CONTENT;
}

export function hasMediaSrc(src: unknown): src is string {
  return hasText(src);
}
