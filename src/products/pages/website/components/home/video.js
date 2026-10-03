/* Product tour video. Paste the YouTube id and an upload date here when the
   video is ready: the home page then shows a click-to-load player and adds
   VideoObject structured data. Until then it shows a "coming soon" poster. */
export const PRODUCT_VIDEO = {
  youtubeId: "",
  uploadDate: "",
  duration: "",
  poster: "/assets/app-campaigns.webp",
  name: "Spurly product tour",
  description: "A short tour of Spurly: connect LinkedIn, build an audience, launch a sequence and reply from one inbox.",
};

export function videoLd() {
  const v = PRODUCT_VIDEO;
  if (!v.youtubeId || !v.uploadDate) return null;
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: v.name,
    description: v.description,
    thumbnailUrl: "https://www.getspurly.com" + v.poster,
    uploadDate: v.uploadDate,
    ...(v.duration ? { duration: v.duration } : {}),
    embedUrl: "https://www.youtube-nocookie.com/embed/" + v.youtubeId,
  };
}
