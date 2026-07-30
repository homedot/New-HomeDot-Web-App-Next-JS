"use client";

const PHOTOS: { src: string; alt: string; anim: string }[] = [
  {
    src: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1800&q=80",
    alt: "",
    anim: "hero-photo-a",
  },
  {
    src: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1800&q=80",
    alt: "",
    anim: "hero-photo-b",
  },
  {
    src: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1800&q=80",
    alt: "",
    anim: "hero-photo-c",
  },
  {
    src: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1800&q=80",
    alt: "",
    anim: "hero-photo-d",
  },
];

/** Slow crossfading, Ken-Burns-zooming stack of home/property/professional
 * photos behind the hero copy — painted under Hero's gradient overlay and
 * HeroScene blobs so the tint and sparkle still read on top of the photos.
 * Freezes on the first photo under prefers-reduced-motion (handled in CSS),
 * same convention as HeroScene/AmbientBackground. */
export default function HeroPhotoBackdrop() {
  return (
    <div className="hero-photo-backdrop" aria-hidden="true">
      {PHOTOS.map((p) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={p.src} src={p.src} alt={p.alt} className={`hero-photo ${p.anim}`} />
      ))}
    </div>
  );
}
