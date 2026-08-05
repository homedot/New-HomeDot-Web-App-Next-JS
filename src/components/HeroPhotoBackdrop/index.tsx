"use client";

const PHOTOS: { src: string; alt: string; anim: string }[] = [
  // {
  //   src: "https://firebasestorage.googleapis.com/v0/b/storage-d11ff.appspot.com/o/Web_Images%2FChatGPT%20Image%20Aug%205%2C%202026%2C%2003_26_25%20PM.png?alt=media&token=f2e20285-7106-4435-8563-8d02fbc44ce2",
  //   alt: "",
  //   anim: "hero-photo-a",
  // },
  {
    src: "https://firebasestorage.googleapis.com/v0/b/storage-d11ff.appspot.com/o/Web_Images%2FChatGPT%20Image%20Aug%205%2C%202026%2C%2005_01_36%20PM.png?alt=media&token=603f8e9e-e966-4801-83d5-f83eab110ce9",
    alt: "",
    anim: "hero-photo-a",
  },
  {
    src: "https://firebasestorage.googleapis.com/v0/b/storage-d11ff.appspot.com/o/Web_Images%2FChatGPT%20Image%20Aug%205%2C%202026%2C%2003_56_51%20PM.png?alt=media&token=c044f831-f830-4e57-85d3-0bfd24a93154",
    alt: "",
    anim: "hero-photo-b",
  },
  {
    src: "https://firebasestorage.googleapis.com/v0/b/storage-d11ff.appspot.com/o/Web_Images%2FChatGPT%20Image%20Aug%205%2C%202026%2C%2004_23_42%20PM.png?alt=media&token=6c300e73-3d99-42ff-a4d9-d8fe0d3976d2",
    alt: "",
    anim: "hero-photo-c",
  },
  {
    src: "https://firebasestorage.googleapis.com/v0/b/storage-d11ff.appspot.com/o/Web_Images%2FChatGPT%20Image%20Aug%205%2C%202026%2C%2003_26_25%20PM.png?alt=media&token=f2e20285-7106-4435-8563-8d02fbc44ce2",
    alt: "",
    anim: "hero-photo-d",
  },
  {
    src: "https://firebasestorage.googleapis.com/v0/b/storage-d11ff.appspot.com/o/Web_Images%2FChatGPT%20Image%20Aug%205%2C%202026%2C%2004_34_23%20PM.png?alt=media&token=7bf751af-89c5-4888-a2d8-69a7173894c8",
    alt: "",
    anim: "hero-photo-e",
  },
  {
    src: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1800&q=80",
    alt: "",
    anim: "hero-photo-f",
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
        <img
          key={p.src}
          src={p.src}
          alt={p.alt}
          className={`hero-photo ${p.anim}`}
        />
      ))}
    </div>
  );
}
