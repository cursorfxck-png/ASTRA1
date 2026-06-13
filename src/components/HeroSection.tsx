"use client";

import { useState, useEffect } from "react";
import type { HeroSlide } from "@/lib/types";

interface HeroSectionProps {
  slides: HeroSlide[];
}

export function HeroSection({ slides }: HeroSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % slides.length);
  };

  if (slides.length === 0) {
    return (
      <section className="slideshow">
        <div className="slide active" style={{ 
          background: '#1a1a1a', 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ 
            textAlign: 'center',
            color: '#888',
            padding: '2rem'
          }}>
            <p>No hero slides available</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="slideshow">
      {slides.length > 1 && (
        <button 
          type="button" 
          className="slide-arrow slide-arrow--right" 
          onClick={goToNext}
          aria-label="Next slide"
        >
          <svg width="71" height="147" viewBox="0 0 71 147" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3L62.5659 62.1464C68.8676 68.4038 68.8676 78.5962 62.5659 84.8536L3 144" stroke="white" strokeWidth="6" strokeLinecap="round"/>
          </svg>
        </button>
      )}

      {slides.map((slide, index) => {
        const isActive = index === activeIndex;
        
        return (
          <div 
            key={slide.id} 
            className={`slide ${isActive ? "active" : ""}`}
          >
            {slide.mediaType === "video" ? (
              <video
                src={slide.mediaUrl}
                autoPlay
                loop
                muted
                playsInline
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center'
                }}
              />
            ) : (
              <img
                src={slide.mediaUrl}
                alt={slide.buttonText || `Slide ${index + 1}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center'
                }}
                loading={index === 0 ? "eager" : "lazy"}
              />
            )}
            
            {slide.buttonText && (
              <div className="slide-content">
                <a href={slide.buttonUrl} className="button">
                  {slide.buttonText}
                </a>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
