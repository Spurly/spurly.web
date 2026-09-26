import { useEffect, useRef } from "react";
import { armFlapSound, playFlapWhoosh } from "../sound.js";

/* SPLIT-FLAP BOARD — ported verbatim from effects.js initFlap().
   Cells are built imperatively inside the host, exactly as before. */
export default function FlapBoard({ words }) {
  const ref = useRef(null);

  useEffect(() => {
    const board = ref.current;
    if (!board) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    armFlapSound();
    function energy() {
      var e = document.body.getAttribute("data-energy");
      return e === "calm" ? 0.55 : e === "hyped" ? 1.8 : 1;
    }

    var wordList = (board.getAttribute("data-words") || "").split(",").map(function (w) { return w.trim().toUpperCase(); });
    if (!wordList.length) return;
    var cols = wordList.reduce(function (m, w) { return Math.max(m, w.length); }, 0);
    var GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    var cells = [];

    for (var i = 0; i < cols; i++) {
      var cell = document.createElement("div");
      cell.className = "flap-cell blank";
      var ch = document.createElement("span");
      ch.className = "ch";
      ch.textContent = "";
      cell.appendChild(ch);
      board.appendChild(cell);
      cells.push({ cell: cell, ch: ch, cur: "" });
    }

    function pad(w) {
      var total = cols - w.length;
      var left = Math.floor(total / 2);
      return " ".repeat(left) + w + " ".repeat(total - left);
    }

    function setChar(c, target, withFlap) {
      c.cur = target;
      var blank = target === " " || target === "";
      c.cell.classList.toggle("blank", blank);
      c.ch.textContent = blank ? "" : target;
      if (withFlap && !reduce) {
        c.ch.classList.remove("is-flap");
        void c.ch.offsetWidth;
        c.ch.classList.add("is-flap");
      }
    }

    var wi = 0, timers = [];
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    function flapToWord(word) {
      clearTimers();
      if (!reduce) playFlapWhoosh();
      var padded = pad(word);
      for (var i = 0; i < cols; i++) {
        (function (c, finalCh, col) {
          var target = finalCh;
          if (reduce) { setChar(c, target, false); return; }
          var rolls = 4 + (col % 4) + Math.floor(Math.random() * 3);
          var step = 0;
          function roll() {
            if (step < rolls) {
              var g = (target === " ") ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
              setChar(c, g === " " ? "" : g, true);
              step++;
              timers.push(setTimeout(roll, (52 + step * 9) * energy()));
            } else {
              setChar(c, target, true);
            }
          }
          timers.push(setTimeout(roll, col * 45 * energy()));
        })(cells[i], padded[i], i);
      }
    }

    function next() {
      flapToWord(wordList[wi]);
      wi = (wi + 1) % wordList.length;
    }

    var first = pad(wordList[0]);
    for (var j = 0; j < cols; j++) setChar(cells[j], first[j] === " " ? "" : first[j], false);
    wi = 1;

    var holdTimer = null;
    function schedule() {
      clearTimeout(holdTimer);
      holdTimer = setTimeout(function () { next(); schedule(); }, reduce ? 4200 : 2600 * energy());
    }

    let io = null;
    if ("IntersectionObserver" in window) {
      var seen = false;
      io = new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) { if (!seen) { seen = true; next(); } schedule(); }
        else { clearTimeout(holdTimer); clearTimers(); }
      }, { threshold: 0.2 });
      io.observe(board);
    } else { next(); schedule(); }

    return () => {
      if (io) io.disconnect();
      clearTimeout(holdTimer);
      clearTimers();
      cells.forEach((c) => { if (c.cell.parentNode) c.cell.parentNode.removeChild(c.cell); });
    };
  }, [words]);

  return <div className="flap-board" ref={ref} data-words={words} aria-hidden="true" />;
}
