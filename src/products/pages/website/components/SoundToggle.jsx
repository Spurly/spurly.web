import { useState } from "react";
import { setSoundEnabled, playFlapWhoosh } from "../sound.js";
import { SpeakerOnIcon, SpeakerMutedIcon } from "../icons.jsx";

/* Speaker toggle — muted by default. Tapping it enables sound (the gesture
   also unlocks audio) and plays an immediate whoosh as confirmation. */
export default function SoundToggle() {
  const [on, setOn] = useState(false);

  function toggle() {
    const next = setSoundEnabled(!on);
    setOn(next);
    if (next) playFlapWhoosh(); // instant feedback
  }

  return (
    <button
      id="sound-toggle"
      type="button"
      className={"sound-toggle" + (on ? " on" : "")}
      onClick={toggle}
      aria-pressed={on ? "true" : "false"}
      aria-label={on ? "Mute sound" : "Enable sound"}
      title={on ? "Mute sound" : "Enable sound"}
    >
      {on ? <SpeakerOnIcon /> : <SpeakerMutedIcon />}
    </button>
  );
}
