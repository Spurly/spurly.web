/* Product demo video. The home hero shows a click-to-play player: the
   self-hosted `src` by default, or YouTube once `youtubeId` is pasted.
   VideoObject structured data follows whichever is in use. */
export const PRODUCT_VIDEO = {
  youtubeId: "8u7zXoLRlC8",
  // The VSL plays from YouTube (built in demo-clips/vsl/). Put a self-hosted file in `src`
  // only if the YouTube id is ever removed.
  src: "",
  width: 1920,
  height: 1080,
  uploadDate: "2026-10-20",
  duration: "PT4M20S",
  poster: "/assets/video/spurly-vsl-poster.webp",
  name: "Spurly in 4 minutes",
  description: "Spurly, the AI SDR for LinkedIn, in four minutes: find warm leads (profile viewers, followers, people posting about your topic, companies hiring), let AI write in your voice and approve every message, run sequences 24/7 that stop when someone replies, keep every reply in one inbox, and run it all from Claude, ChatGPT or Cursor.",
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
