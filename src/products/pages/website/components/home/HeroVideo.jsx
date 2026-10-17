import { useState } from "react";
import { PRODUCT_VIDEO as V } from "./video.js";

const PlayGlyph = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" /></svg>
);

/* Demo video frame in the hero: a poster with a play button. Nothing loads
   until the click (the <video> / iframe mounts then), so page weight and LCP
   are untouched. YouTube is used when video.js has an id, else the
   self-hosted file; with neither it is a "coming soon" frame. */
export default function HeroVideo() {
  const [playing, setPlaying] = useState(false);
  const ready = Boolean(V.youtubeId || V.src);

  return (
    <div className="hero-video">
      <div className="hv-bar" aria-hidden="true"><i /><i /><i /></div>
      <div className="hv-stage">
        {playing && V.youtubeId ? (
          <iframe
            src={"https://www.youtube-nocookie.com/embed/" + V.youtubeId + "?autoplay=1"}
            title={V.name}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : playing && V.src ? (
          <video src={V.src} poster={V.poster} controls autoPlay playsInline preload="auto" aria-label={V.name} />
        ) : ready ? (
          <>
            <img src={V.poster} alt="" width={V.width || 1700} height={V.height || 943} loading="lazy" decoding="async" />
            <button type="button" className="hv-center hv-play-btn" onClick={() => setPlaying(true)} aria-label={"Play: " + V.name}>
              <span className="hv-play"><PlayGlyph /></span>
            </button>
          </>
        ) : (
          <div className="hv-center" role="img" aria-label="Product demo video, coming soon">
            <span className="hv-play"><PlayGlyph /></span>
            <strong>Product demo</strong>
            <small>Coming soon</small>
          </div>
        )}
      </div>
    </div>
  );
}
