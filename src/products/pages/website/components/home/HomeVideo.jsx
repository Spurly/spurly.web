import { useState } from "react";
import { PRODUCT_VIDEO as V } from "./video.js";

/* Click-to-load facade: the YouTube iframe only mounts after a click, so the
   page's LCP and weight are untouched. With no video id yet it is a poster. */
export default function HomeVideo() {
  const [playing, setPlaying] = useState(false);
  return (
    <section id="video" className="section-pad">
      <div className="wrap">
        <div className="sec-head center reveal">
          <span className="eyebrow">Product tour</span>
          <h2 className="h2" style={{ marginTop: 14 }}>See Spurly <em>in action.</em></h2>
        </div>
        <div className="video-poster reveal d1">
          {playing && V.youtubeId ? (
            <iframe
              src={"https://www.youtube-nocookie.com/embed/" + V.youtubeId + "?autoplay=1"}
              title={V.name}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <>
              <img src={V.poster} alt="Spurly campaigns page" width="1700" height="943" loading="lazy" decoding="async" />
              {V.youtubeId ? (
                <button type="button" className="vp-play" onClick={() => setPlaying(true)} aria-label={"Play: " + V.name}>
                  <span aria-hidden="true">▶</span>
                </button>
              ) : (
                <span className="vp-badge">Video tour coming soon</span>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
