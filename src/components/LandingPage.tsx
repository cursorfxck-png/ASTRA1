"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";

import { HeaderAuth } from "@/components/HeaderAuth";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ResponsiveImage } from "@/components/ResponsiveImage";
import { HeroSection } from "@/components/HeroSection";
import { hasMediaSrc } from "@/lib/content-merge";
import type { HeroSlide, ProductCard, SiteContent } from "@/lib/types";

interface LandingPageProps {
  content: SiteContent;
}

function ratioStyle(value: string): CSSProperties {
  return {
    ["--ratio-percent" as string]: value
  } as CSSProperties;
}

function ProductTile({ card }: { card: ProductCard }) {
  return (
    <a href={card.linkUrl} className="card-wrapper">
      <div className="card__media">
        <ResponsiveImage 
          src={card.imageUrl} 
          alt={card.title}
          imageRatio={card.imageRatio}
        />
      </div>
      <div className="card__content">
        <h3 className="card__heading">{card.title}</h3>
        {card.price ? <div className="price">{card.price}</div> : null}
      </div>
    </a>
  );
}

function CollageBlock({
  title,
  largeCard,
  stackedCards,
  reverse
}: SiteContent["collageOne"] & { reverse?: boolean }) {
  return (
    <section className="collage-section page-width">
      <h2 className="title collage-title">{title}</h2>
      <div className={`collage ${reverse ? "collage--right" : ""}`}>
        {!reverse ? (
          <>
            <a href={largeCard.linkUrl} className="card-wrapper collage__item--large">
              <div className="card__media">
                <ResponsiveImage 
                  src={largeCard.imageUrl} 
                  alt={largeCard.title}
                  imageRatio={largeCard.imageRatio}
                />
              </div>
            </a>
            <div className="collage-stack">
              {stackedCards.map((card) => (
                <ProductTile key={`${card.title}-${card.imageUrl}`} card={card} />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="collage-stack">
              {stackedCards.map((card) => (
                <ProductTile key={`${card.title}-${card.imageUrl}`} card={card} />
              ))}
            </div>
            <a href={largeCard.linkUrl} className="card-wrapper collage__item--large">
              <div className="card__media">
                <ResponsiveImage 
                  src={largeCard.imageUrl} 
                  alt={largeCard.title}
                  imageRatio={largeCard.imageRatio}
                />
              </div>
            </a>
          </>
        )}
      </div>
    </section>
  );
}

export default function LandingPage({ content }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState("");

  const slides = useMemo<HeroSlide[]>(() => {
    const validSlides = content.heroSlides.filter((slide) => hasMediaSrc(slide.mediaUrl));
    console.log('[Hero] Total slides:', content.heroSlides.length, 'Valid slides:', validSlides.length);
    validSlides.forEach((s, i) => console.log(`[Hero] Slide ${i}:`, s.mediaUrl));
    return validSlides;
  }, [content.heroSlides]);
  const featuredItems = useMemo(() => content.featuredSection.items.slice(0, 3), [content.featuredSection.items]);
  const showFeaturedViewAll = content.featuredSection.items.length > 3;

  const handleNewsletterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newsletterEmail.trim()) {
      setNewsletterMessage("Please enter your email address.");
      return;
    }

    setNewsletterMessage(`Thanks! ${newsletterEmail} has been noted.`);
    setNewsletterEmail("");
  };

  return (
    <main id="frontend-view">
      <div
        className={`drawer-overlay ${mobileMenuOpen ? "active" : ""}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      <div className={`mobile-drawer ${mobileMenuOpen ? "active" : ""}`}>
        <div className="drawer-header">
          <button className="drawer-close" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
            <svg viewBox="0 0 18 17">
              <path
                fill="currentColor"
                d="M.865 15.978a.5.5 0 0 0 .707.707l7.433-7.431 7.579 7.282a.501.501 0 0 0 .846-.37.5.5 0 0 0-.153-.351L9.712 8.546l7.417-7.416a.5.5 0 1 0-.707-.708L8.991 7.853 1.413.573a.5.5 0 1 0-.693.72l7.563 7.268z"
              />
            </svg>
          </button>
        </div>
        <ul className="drawer-nav">
          {content.navigation.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={item.active ? "drawer-link-active" : undefined}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="section-header">
        <header className="header">
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <svg fill="none" viewBox="0 0 18 12">
              <path
                fill="currentColor"
                d="M1 .5a.5.5 0 1 0 0 1h15.71a.5.5 0 0 0 0-1zM.5 11a.5.5 0 0 1 .5-.5h15.71a.5.5 0 0 1 0 1H1a.5.5 0 0 1-.5-.5"
              />
            </svg>
          </button>

          <h1 className="header__heading">
            <a href="/" className="header__brand">
              <img
                src="https://framerusercontent.com/images/GcFu6wYPhW1waroIjPNGnmOlYk.png?width=500&height=500"
                alt="ASTRA logo"
                className="header__heading-logo"
              />
            </a>
          </h1>

          <nav className="header__inline-menu" aria-label="Main navigation">
            <ul className="list-menu list-menu--inline">
              {content.navigation.map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="list-menu__item">
                    <span className={item.active ? "header__active-menu-item" : undefined}>{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="header__icons">
            <a href="#" className="header__icon" aria-label="Search">
              <svg width="39" height="35" viewBox="0 0 39 35" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M27.8731 22.0126H26.1115L25.4871 21.4723C27.7481 19.1191 28.9907 16.1146 28.988 13.0074C28.988 10.4348 28.1379 7.91996 26.5453 5.7809C24.9527 3.64183 22.689 1.97464 20.0406 0.990138C17.3922 0.0056359 14.4779 -0.251955 11.6664 0.24994C8.8548 0.751835 6.27222 1.99067 4.2452 3.80979C2.21818 5.62892 0.837759 7.94662 0.278505 10.4698C-0.280749 12.993 0.00628 15.6084 1.1033 17.9852C2.20031 20.362 4.05804 22.3934 6.44157 23.8227C8.82509 25.252 11.6274 26.0149 14.494 26.0149C18.0841 26.0149 21.3842 24.8342 23.9262 22.8731L24.5283 23.4334V25.0143L35.6775 35L39 32.0183L27.8731 22.0126ZM14.494 22.0126C8.94169 22.0126 4.4597 17.9903 4.4597 13.0074C4.4597 8.02459 8.94169 4.00229 14.494 4.00229C20.0463 4.00229 24.5283 8.02459 24.5283 13.0074C24.5283 17.9903 20.0463 22.0126 14.494 22.0126Z" fill="white"/>
              </svg>
            </a>
            <HeaderAuth />
            <a href="/cart" className="header__icon cart-icon" aria-label="Cart">
              <svg width="44" height="40" viewBox="0 0 44 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M13.9362 2.05128C14.5665 0.841026 15.924 0 17.4976 0H26.5024C28.0738 0 29.4312 0.841026 30.0638 2.05128C31.6014 2.06359 32.8013 2.12718 33.8729 2.50872C35.1521 2.96466 36.2646 3.73951 37.0831 4.74462C37.9093 5.7559 38.2965 7.05641 38.83 8.84308L38.9133 9.12205L40.2415 13.5672C41.1271 13.9743 41.9034 14.5542 42.5152 15.2656C43.9155 16.9005 44.1631 18.8472 43.9155 21.079C43.6723 23.2451 42.9249 25.9733 41.9884 29.3887L41.9277 29.6041C41.3356 31.7641 40.8538 33.518 40.2843 34.8862C39.6855 36.3138 38.9291 37.4831 37.6796 38.3713C36.4325 39.2595 35.003 39.6431 33.3393 39.8277C31.7432 40 29.7599 40 27.3174 40H16.6827C14.2401 40 12.2546 40 10.6607 39.8256C8.99481 39.6451 7.56755 39.2595 6.31813 38.3692C5.07097 37.4831 4.31456 36.3138 3.71574 34.8862C3.14394 33.518 2.66443 31.7641 2.07237 29.6041L2.01158 29.3887C1.07508 25.9733 0.325433 23.2451 0.0845541 21.081C-0.163078 18.8451 0.0845537 16.9005 1.48255 15.2656C2.11964 14.5231 2.8828 13.9733 3.75626 13.5672L5.08448 9.12205L5.17002 8.84308C5.70356 7.05641 6.09076 5.7559 6.91695 4.74256C7.73578 3.73822 8.84825 2.9641 10.1272 2.50872C11.1987 2.12718 12.3964 2.06154 13.9362 2.05128ZM13.9385 5.13436C12.4482 5.14872 11.8516 5.2 11.3563 5.37641C10.6674 5.62191 10.0682 6.0392 9.6274 6.58051C9.23119 7.06667 8.99706 7.74564 8.34422 9.93436L7.54729 12.5928C9.88404 12.3077 12.9007 12.3077 16.6467 12.3077H27.3511C31.0994 12.3077 34.116 12.3077 36.4505 12.5928L35.6558 9.93231C35.0007 7.74359 34.7688 7.06462 34.3726 6.57846C33.9318 6.03715 33.3326 5.61986 32.6437 5.37436C32.1484 5.19795 31.5496 5.14667 30.0593 5.13231C29.7394 5.74494 29.2354 6.26241 28.6059 6.62474C27.9763 6.98707 27.247 7.17941 26.5024 7.17949H17.4976C16.753 7.17941 16.0237 6.98707 15.3941 6.62474C14.7646 6.26241 14.2607 5.74494 13.9407 5.13231M17.4976 3.07692C17.3483 3.07692 17.2052 3.13095 17.0996 3.22712C16.9941 3.3233 16.9348 3.45374 16.9348 3.58974C16.9348 3.72575 16.9941 3.85619 17.0996 3.95236C17.2052 4.04854 17.3483 4.10256 17.4976 4.10256H26.5024C26.6517 4.10256 26.7948 4.04854 26.9004 3.95236C27.0059 3.85619 27.0652 3.72575 27.0652 3.58974C27.0652 3.45374 27.0059 3.3233 26.9004 3.22712C26.7948 3.13095 26.6517 3.07692 26.5024 3.07692H17.4976ZM7.81743 15.6636C5.76884 15.9344 4.77606 16.4267 4.14797 17.161C3.51764 17.8933 3.23624 18.8882 3.4456 20.7672C3.65946 22.6872 4.34608 25.198 5.3231 28.7672C5.94894 31.04 6.38117 32.6154 6.87643 33.7928C7.34918 34.9292 7.81518 35.5303 8.4005 35.9467C8.98356 36.361 9.73546 36.6256 11.0637 36.7713C12.4369 36.921 14.2154 36.9231 16.7907 36.9231H27.2138C29.7869 36.9231 31.5699 36.921 32.9409 36.7713C34.2691 36.6277 35.021 36.361 35.604 35.9467C36.1893 35.5303 36.6531 34.9292 37.1303 33.7928C37.6211 32.6154 38.0556 31.04 38.6792 28.7672C39.6584 25.198 40.3451 22.6872 40.5567 20.7672C40.7683 18.8882 40.4846 17.8913 39.8565 17.159C39.2285 16.4267 38.2357 15.9344 36.1848 15.6636C34.0912 15.3887 31.2502 15.3846 27.2138 15.3846H16.7907C12.7543 15.3846 9.9133 15.3887 7.81969 15.6636" fill="white"/>
              </svg>
            </a>
          </div>
        </header>
      </div>

      <HeroSection slides={slides} />

      <section className="rich-text">
        <h2>{content.richText.title}</h2>
        <p>{content.richText.subtitle}</p>
        <a href={content.richText.buttonUrl} className="button">
          {content.richText.buttonText}
        </a>
      </section>

      <section className="page-width section-space-bottom">
        <div className="title-wrapper">
          <h2 className="title">{content.collectionsHeading}</h2>
        </div>
        <div className="grid grid--4-col">
          {content.collections.map((collection) => (
            <a key={collection.id} href={collection.linkUrl} className="card-wrapper">
              <div className="card__media">
                <ResponsiveImage 
                  src={collection.imageUrl} 
                  alt={collection.title}
                  imageRatio="125%"
                />
              </div>
              <div className="card__content">
                <h3 className="card__heading">{collection.title}</h3>
              </div>
            </a>
          ))}
        </div>
      </section>

      <CollageBlock {...content.collageOne} />

      <section className="page-width">
        <div className="title-wrapper">
          <h2 className="title">{content.featuredSection.title}</h2>
        </div>
        <div className="grid grid--3-col">
          {featuredItems.map((card) => (
            <ProductTile key={`${card.title}-${card.imageUrl}`} card={card} />
          ))}
        </div>
        {showFeaturedViewAll ? (
          <div className="view-all-center">
            <a href={content.featuredSection.buttonUrl} className="button button--outline">
              {content.featuredSection.buttonText}
            </a>
          </div>
        ) : null}
      </section>

      <CollageBlock {...content.collageTwo} />

      <section className="newsletter">
        <h2>{content.newsletter.title}</h2>
        <p>{content.newsletter.subtitle}</p>
        <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
          <input
            type="email"
            placeholder="Email"
            required
            value={newsletterEmail}
            onChange={(event) => setNewsletterEmail(event.target.value)}
          />
          <button type="submit" aria-label="Subscribe">
            <svg width="14" height="10" viewBox="0 0 14 10">
              <path
                fill="currentColor"
                fillRule="evenodd"
                d="M8.537.808a.5.5 0 0 1 .817-.162l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 1 1-.708-.708L11.793 5.5H1a.5.5 0 0 1 0-1h10.793L8.646 1.354a.5.5 0 0 1-.109-.546"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </form>
        {newsletterMessage ? <p className="newsletter-message">{newsletterMessage}</p> : null}
      </section>

      <footer className="footer">
        <div className="page-width">
          <div className="footer__content-bottom-wrapper">
            <div className="footer__localization">
              <div className="localization-selector localization-text">
                <span>{content.footer.marketLabel}</span>
              </div>
              <LanguageSwitcher />
            </div>
          </div>
          <div className="footer__copyright">
            <small>
              <a href="#">{content.footer.copyrightLine}</a>
            </small>
            <small>
              <a href="#">{content.footer.companyLine}</a>
            </small>
          </div>
        </div>
      </footer>
    </main>
  );
}
 