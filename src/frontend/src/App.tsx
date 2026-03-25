import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
type View = "question" | "yes";

interface FloatingHeart {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
}

interface FallingRose {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function generateHearts(count: number): FloatingHeart[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: rand(0, 100),
    size: rand(14, 30),
    duration: rand(8, 18),
    delay: rand(0, 12),
  }));
}

function generateRoses(count: number): FallingRose[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: rand(0, 100),
    size: rand(20, 48),
    duration: rand(4, 10),
    delay: rand(0, 8),
  }));
}

const HEARTS = generateHearts(18);
const ROSES = generateRoses(32);

// ── Profile Picture ────────────────────────────────────────────────────────
const PROFILE_PIC =
  "/assets/uploads/718rufvgl_l-019d23ee-cf92-7518-bc74-ee697d325dc3-1.jpg";

function ProfilePicture() {
  return (
    <div
      className="absolute top-4 left-4 z-50"
      style={{
        width: 72,
        height: 72,
        borderRadius: "50%",
        overflow: "hidden",
        border: "3px solid oklch(0.72 0.1 15)",
        boxShadow: "0 2px 16px 0 rgba(230,100,120,0.25)",
      }}
    >
      <img
        src={PROFILE_PIC}
        alt="Profile"
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );
}

// ── Romantic Music Synthesizer ─────────────────────────────────────────────
// Plays a soft romantic piano-like melody using Web Audio API
function createRomanticMusic() {
  const ctx = new AudioContext();
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.55;
  masterGain.connect(ctx.destination);

  // Soft reverb via convolver simulation with delay
  const reverbDelay = ctx.createDelay(2);
  reverbDelay.delayTime.value = 0.18;
  const reverbGain = ctx.createGain();
  reverbGain.gain.value = 0.38;
  reverbDelay.connect(reverbGain);
  reverbGain.connect(masterGain);

  // Melody notes: C major pentatonic love melody (Hz)
  const melody = [
    523.25, 659.25, 783.99, 659.25, 523.25, 392.0, 440.0, 523.25, 659.25,
    523.25, 440.0, 392.0, 349.23, 440.0, 523.25, 440.0, 349.23, 392.0, 440.0,
    523.25, 659.25, 783.99, 659.25, 523.25,
  ];

  // Bass chord progression
  const bassNotes = [130.81, 146.83, 164.81, 146.83];

  let stopped = false;
  let noteIndex = 0;
  let bassIndex = 0;
  let melodyTimeout: ReturnType<typeof setTimeout>;
  let bassTimeout: ReturnType<typeof setTimeout>;

  function playNote(
    freq: number,
    time: number,
    duration: number,
    type: OscillatorType,
    gainVal: number,
  ) {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(gainVal, time + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);
    osc.connect(gainNode);
    gainNode.connect(masterGain);
    gainNode.connect(reverbDelay);
    osc.start(time);
    osc.stop(time + duration + 0.05);
  }

  function scheduleMelody() {
    if (stopped) return;
    const now = ctx.currentTime;
    playNote(melody[noteIndex % melody.length], now, 0.55, "sine", 0.28);
    noteIndex++;
    melodyTimeout = setTimeout(scheduleMelody, 480);
  }

  function scheduleBass() {
    if (stopped) return;
    const now = ctx.currentTime;
    const freq = bassNotes[bassIndex % bassNotes.length];
    // Play a soft chord (root + fifth)
    playNote(freq, now, 1.6, "triangle", 0.16);
    playNote(freq * 1.5, now, 1.6, "triangle", 0.1);
    bassIndex++;
    bassTimeout = setTimeout(scheduleBass, 1920);
  }

  function start() {
    if (ctx.state === "suspended") ctx.resume();
    scheduleMelody();
    scheduleBass();
  }

  function stop() {
    stopped = true;
    clearTimeout(melodyTimeout);
    clearTimeout(bassTimeout);
    masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    setTimeout(() => ctx.close(), 600);
  }

  function setMuted(muted: boolean) {
    masterGain.gain.setTargetAtTime(muted ? 0 : 0.55, ctx.currentTime, 0.2);
  }

  return { start, stop, setMuted, ctx };
}

// ── Music Hook ─────────────────────────────────────────────────────────────
function useMusic() {
  const musicRef = useRef<ReturnType<typeof createRomanticMusic> | null>(null);
  const [muted, setMutedState] = useState(false);
  const [started, setStarted] = useState(false);

  const startMusic = useCallback(() => {
    if (started) return;
    setStarted(true);
    const m = createRomanticMusic();
    musicRef.current = m;
    m.start();
  }, [started]);

  const toggleMute = useCallback(() => {
    setMutedState((prev) => {
      const next = !prev;
      musicRef.current?.setMuted(next);
      return next;
    });
  }, []);

  useEffect(() => {
    return () => {
      musicRef.current?.stop();
    };
  }, []);

  return { startMusic, toggleMute, muted, started };
}

// ── Mute Button ─────────────────────────────────────────────────────────────
function MuteButton({
  muted,
  onToggle,
}: { muted: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="fixed top-4 right-4 z-50 w-11 h-11 rounded-full flex items-center justify-center text-xl shadow-md bg-white/70 backdrop-blur border border-pink-200 hover:scale-110 transition-transform cursor-pointer"
      title={muted ? "Unmute music" : "Mute music"}
    >
      {muted ? "🔇" : "🎵"}
    </button>
  );
}

// ── Question Page ──────────────────────────────────────────────────────────
function QuestionPage({
  onYes,
  onInteract,
}: { onYes: () => void; onInteract: () => void }) {
  const noRef = useRef<HTMLButtonElement>(null);
  const [noPos, setNoPos] = useState<{ x: number; y: number } | null>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });

  const teleportNo = useCallback(() => {
    const margin = 80;
    const btnW = 120;
    const btnH = 52;
    const maxX = window.innerWidth - btnW - margin;
    const maxY = window.innerHeight - btnH - margin;
    setNoPos({
      x: rand(margin, maxX),
      y: rand(margin, maxY),
    });
  }, []);

  useEffect(() => {
    teleportNo();
  }, [teleportNo]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };

      if (!noRef.current || noPos === null) return;
      const btn = noRef.current.getBoundingClientRect();
      const cx = btn.left + btn.width / 2;
      const cy = btn.top + btn.height / 2;
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
      if (dist < 110) {
        teleportNo();
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [noPos, teleportNo]);

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center bg-background"
      onClick={onInteract}
      onKeyDown={onInteract}
      role="presentation"
    >
      <ProfilePicture />

      {HEARTS.map((h) => (
        <span
          key={h.id}
          className="floating-heart select-none pointer-events-none"
          style={{
            left: `${h.left}%`,
            bottom: "-40px",
            fontSize: `${h.size}px`,
            animationDuration: `${h.duration}s`,
            animationDelay: `${h.delay}s`,
            opacity: 0,
          }}
        >
          🤍
        </span>
      ))}

      <div
        className="floral-sway absolute top-0 right-0 select-none pointer-events-none"
        style={{
          fontSize: "clamp(90px, 14vw, 180px)",
          lineHeight: 1,
          transformOrigin: "top right",
        }}
      >
        🌸🌺
      </div>
      <div
        className="floral-sway absolute bottom-0 left-0 select-none pointer-events-none"
        style={{
          fontSize: "clamp(90px, 14vw, 180px)",
          lineHeight: 1,
          animationDelay: "2s",
          transformOrigin: "bottom left",
        }}
      >
        🌹🌿
      </div>

      <motion.div
        className="relative z-10 flex flex-col items-center text-center px-6"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      >
        <span className="text-5xl mb-4 heartbeat select-none">💕</span>
        <h1
          className="font-serif text-primary"
          style={{
            fontSize: "clamp(2.8rem, 8vw, 6rem)",
            fontWeight: 900,
            lineHeight: 1.15,
          }}
        >
          Do you
          <br />
          love me?
        </h1>
        <p
          className="mt-4 font-serif italic text-muted-foreground"
          style={{ fontSize: "clamp(1rem, 2.5vw, 1.4rem)", fontWeight: 800 }}
        >
          My heart is waiting for your answer…
        </p>

        <motion.button
          data-ocid="question.yes_button"
          className="yes-btn mt-10 px-10 py-4 rounded-full font-serif font-black text-primary-foreground shadow-rose cursor-pointer select-none"
          style={{
            background: "oklch(0.72 0.1 15)",
            fontSize: "1.2rem",
            fontWeight: 900,
          }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.97 }}
          onClick={onYes}
        >
          Yes ♡
        </motion.button>
      </motion.div>

      {noPos !== null && (
        <button
          ref={noRef}
          type="button"
          data-ocid="question.no_button"
          className="fixed font-serif font-black text-base px-8 py-3 rounded-full border border-border bg-background text-foreground cursor-pointer select-none transition-none"
          style={{
            left: noPos.x,
            top: noPos.y,
            fontSize: "1rem",
            fontWeight: 900,
            zIndex: 50,
            pointerEvents: "auto",
          }}
          onClick={teleportNo}
        >
          No
        </button>
      )}

      <footer className="absolute bottom-4 left-0 right-0 text-center text-xs text-muted-foreground/60 font-serif font-bold">
        © {new Date().getFullYear()}. Built with ♡ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-primary transition-colors"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}

// ── Yes Page ───────────────────────────────────────────────────────────────
function YesPage({
  onBack,
  onInteract,
}: { onBack: () => void; onInteract: () => void }) {
  return (
    <div
      className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center bg-background"
      onClick={onInteract}
      onKeyDown={onInteract}
      role="presentation"
    >
      <ProfilePicture />

      {ROSES.map((r) => (
        <span
          key={r.id}
          className="falling-rose select-none pointer-events-none"
          style={{
            left: `${r.left}%`,
            top: "-60px",
            fontSize: `${r.size}px`,
            animationDuration: `${r.duration}s`,
            animationDelay: `${r.delay}s`,
            opacity: 0,
          }}
        >
          🌹
        </span>
      ))}

      {HEARTS.map((h) => (
        <span
          key={h.id}
          className="floating-heart select-none pointer-events-none"
          style={{
            left: `${h.left}%`,
            bottom: "-40px",
            fontSize: `${h.size}px`,
            animationDuration: `${h.duration}s`,
            animationDelay: `${h.delay}s`,
            opacity: 0,
          }}
        >
          💕
        </span>
      ))}

      <motion.div
        className="relative z-10 flex flex-col items-center text-center px-6"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <motion.span
          className="text-6xl mb-6 block"
          animate={{ scale: [1, 1.18, 1, 1.12, 1] }}
          transition={{
            duration: 1.4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        >
          💖
        </motion.span>

        <h1
          className="font-serif text-primary"
          style={{
            fontSize: "clamp(2.6rem, 7vw, 5.5rem)",
            fontWeight: 900,
            lineHeight: 1.15,
          }}
        >
          I knew it! 💕
        </h1>

        <p
          className="mt-5 font-serif font-black text-foreground/80 max-w-lg"
          style={{
            fontSize: "clamp(1rem, 2.5vw, 1.35rem)",
            lineHeight: 1.7,
            fontWeight: 900,
          }}
        >
          You have no idea how happy this makes me. My heart has been blooming
          like a garden of roses just for you. Thank you for saying yes — now,{" "}
          <strong>later</strong>, and always. 🌹
        </p>

        <motion.button
          data-ocid="yes.back_button"
          className="mt-10 px-8 py-3 rounded-full border border-border bg-background text-foreground font-serif font-black text-base cursor-pointer hover:bg-accent transition-colors"
          style={{ fontWeight: 900 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          onClick={onBack}
        >
          ← Ask me again
        </motion.button>
      </motion.div>

      <footer className="absolute bottom-4 left-0 right-0 text-center text-xs text-muted-foreground/60 font-serif font-bold">
        © {new Date().getFullYear()}. Built with ♡ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-primary transition-colors"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState<View>("question");
  const { startMusic, toggleMute, muted, started } = useMusic();

  const handleInteract = useCallback(() => {
    startMusic();
  }, [startMusic]);

  return (
    <>
      <MuteButton muted={muted} onToggle={toggleMute} />
      {!started && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white/80 backdrop-blur border border-pink-200 rounded-full px-5 py-2 text-sm font-bold text-pink-500 shadow pointer-events-none">
          🎵 Tap anywhere for music
        </div>
      )}
      <AnimatePresence mode="wait">
        {view === "question" ? (
          <motion.div
            key="question"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <QuestionPage
              onYes={() => setView("yes")}
              onInteract={handleInteract}
            />
          </motion.div>
        ) : (
          <motion.div
            key="yes"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <YesPage
              onBack={() => setView("question")}
              onInteract={handleInteract}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
