/* Product demo video. The home hero shows a click-to-play player: the
   self-hosted `src` by default, or YouTube once `youtubeId` is pasted.
   VideoObject structured data follows whichever is in use. */
export const PRODUCT_VIDEO = {
  youtubeId: "",
  // Self-hosted cut (demo-clips/ + the 62 s ad). Used when there is no YouTube id;
  // a YouTube id, once pasted, takes over.
  src: "/assets/video/spurly-demo.mp4",
  width: 1920,
  height: 1080,
  uploadDate: "2026-10-18",
  duration: "PT1M2S",
  poster: "/assets/video/spurly-demo-poster.webp",
  name: "Spurly product demo",
  description: "One minute of Spurly: find leads with LinkedIn's own filters, let AI write the note you approve, send at a safe pace with follow-ups that stop when someone replies, put invitations on autopilot, and run it all from Claude.",
};

export function videoLd() {
  const v = PRODUCT_VIDEO;
  if (!(v.youtubeId || v.src) || !v.uploadDate) return null;
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: v.name,
    description: v.description,
    thumbnailUrl: "https://www.getspurly.com" + v.poster,
    uploadDate: v.uploadDate,
    ...(v.duration ? { duration: v.duration } : {}),
    ...(v.youtubeId
      ? { embedUrl: "https://www.youtube-nocookie.com/embed/" + v.youtubeId }
      : { contentUrl: "https://www.getspurly.com" + v.src }),
  };
}
