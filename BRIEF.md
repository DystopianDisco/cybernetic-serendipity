# Schotter, Conducted — an audio-reactive, participatory generative artwork

**For:** an interactive data-viz / creative-coding developer (p5.js / canvas).
**Repo:** this repo. Working prototype in `sketch.js` + `index.html`. Reference frames in `reference/`.
**Deploys to:** cyberneticserendipity.com (Vercel, static site).

---

## 1. What this is

A single web artwork. It **opens as an exact replica of Georg Nees' _Schotter_ (1968)** — the canonical order→disorder computer artwork — and then, driven by **uploaded music** and by a **viewer manipulating on-screen controls**, that order is **destroyed and re-formed** in real time. The piece is a living play on **order ⇄ destruction**.

Three intentions, in priority order:
1. **Fidelity** — the resting state is a true Nees _Schotter_. Non-negotiable initial view.
2. **The elegant destruction** — the art is in *how the ordered squares break apart and re-order*, set to music.
3. **Participation** — the viewer shapes it. Controls are part of the piece, not dev chrome.

## 2. Lineage / inspiration (please absorb these — they're the brief)

- **Georg Nees, _Schotter_ (1968)** — the ground truth. A 12×22 grid of squares, pristine at the top, progressively rotated and displaced into chaos toward the bottom. Plotter art: black line on white. Google it and study the plate. THE INITIAL VIEW MUST BE THIS.
- **Order → Disorder** — the conceptual spine. Nees' piece is a static gradient from order to chaos; ours makes that gradient *breathe and perform* to sound.
- **GRAV (Groupe de Recherche d'Art Visuel, Paris 1960s)** — Le Parc, Morellet, Yvaral, Sobrino. Doctrine: the individual artist dissolves; the **spectator becomes co-creator** ("interdit de ne pas participer" — forbidden not to participate). This is why the controls are surfaced, unlabeled, open-ended: the viewer makes the art.
- **Cybernetic Serendipity (ICA London, 1968)** — the show this whole project honours; it was hands-on and participatory. The site will also host the _Cybernetic Serendipity Music_ album (see §7).
- **Manfred Mohr** — the algorists' rigor: the program is the artwork; deterministic systems; the line as the medium.
- **The Nature of Code (Daniel Shiffman)** — the motion model. The destruction must feel **physical**: Perlin flow-field forces + spring-back-to-order (easing/inertia), not boxes on fixed sine waves.

## 3. THE INITIAL VIEW — an exact Schotter (hard requirement)

On load, before any sound, the canvas **is** Schotter — see `reference/01-nees-initial-view.png`:
- 12 columns × 22 rows of squares, **black outline only**, on near-white (#f8f8f8). Plotter line weight ~1.2px.
- Top ~3 rows pristine and aligned. Disorder **grows steadily downward** — rotation-led, with restrained displacement so squares mostly **hold their lanes** (Nees is orderly, not mush). Bottom rows heavily rotated, displaced, overlapping, spilling.
- **Deterministic** (fixed seed) — the resting image is always the same recognisable _Schotter_.
- A whisper of "breathing" is OK (keeps it alive) but must NOT muddy the still image.
- Any performance must **resolve back to this exact frame** in silence/rest. Order is always regained.

## 4. The core loop — a play on order ⇄ destruction

- The field mostly **holds its order**. **Destruction is reserved for significant musical moments** — a "surge" that spikes on strong onsets/swells and decays, sending a graceful wave of dissolution through the squares (flow-field tumble), which then **re-forms** to Schotter. Restraint between events is the point.
- Destruction is **physical**: flow-field push + angular inertia + a spring pulling each square home. Squares don't teleport; they break and settle like gravel (_Schotter_ = gravel).
- The viewer's controls modulate all of this live (see §6).

## 5. THE MAGIC — what makes it sing (read carefully; this is where prototypes failed)

The single most important lesson from prototyping. **The magic is multi-colour WITH white space, plus motif/flash moments where order emerges from disorder.** Two failure modes to avoid on either side:

**✅ THE MAGIC (do this):**
- **Multi-colour from the full palette, with white space** — coloured squares scattered among black outlines (~40–55% filled at peak, never 100%). Vibrant but breathing. See `reference/02-magic-multicolour-peak.png`.
- **Motif resolutions** — the scattered chaos periodically **snaps into a recognisable multi-colour pattern**: a checkerboard, vertical stripes, or a clean grid — *with white space* (alternating/partial cells coloured, the rest white outline). See `reference/03-magic-motif-checker.png`. This "order emerging from disorder" is the dopamine hit — the brain loves it.
- **Flashes / blooms** of colour on strong musical moments — a burst of multi-colour ignition tied to the beat, then decays.
- Restraint lives in the **TIMING** — motifs and blooms are *events*, reserved for musical moments — not in muting the colour.

**❌ NOT THE MAGIC (avoid):**
- **Solid-fill every cell** (100%, no white space) — reads as OTT/garish. See `reference/05-ott-solid-fill-avoid.png`. This is the thing to never do.
- **Random strobe / "Chinese light show"** — flashing that's trying to impress. Blooms should be musical and cohesive, not seizure-inducing scatter.
- **Over-austere single-accent monochrome** — stripping to one colour kills the magic. See `reference/04-too-austere-single-accent.png`. Elegant, but *not* what this wants.

**The palette** (extracted from the reference artwork — keep it):
`#E2D248 #57A8A3 #DE9D45 #342372 #264C92 #509EDE #D53075 #D13531 #B2644E #D36292`

## 6. Participation — the controls ARE the piece (GRAV)

- **Surfaced, permanent, UNLABELED, open-ended.** No "colour/sensitivity/intensity" labels. The viewer discovers what each does by playing. Each handle should be on-brand (e.g. a small Nees square you drag along a line).
- They should shape the live behaviour — colour amount, how sensitive the destruction is to the music, how violent it is, how far up the grid it climbs — but the *mapping is hidden*; the point is play, not precision.
- The piece should be **playable immediately** (gentle autonomous life even before music), and richly responsive with music.
- Author dissolves; the viewer + the music generate the specific instance.

## 7. The music player (Phase 2 — after the visuals are nailed)

- The site will ship with **_Cybernetic Serendipity Music_ (1968 ICA LP)** — 10 tracks (Hiller & Isaacson _Illiac Suite_, Cage _Cartridge Music_, Xenakis _Strategie_, etc.) + cover art. Source files are FLAC (~270MB); **transcode to MP3 ~192k** (~40–50MB total) for browser playback.
- Build a minimal player: track list + play/pause + now-playing (**title / composer / year**) + cover. Pressing play feeds the same visual engine. The player is chrome *around* the art; the art's own controls stay as §6.
- Also keep the **upload-any-audio** path (drop your own track).
- Rights note: these are 1968 recordings — sanity-check licensing before shipping the album publicly. Upload-only path is unaffected.

## 8. Easter egg (keep it)

Press **R**: the squares snap face-on and assemble a walking **robot** (a nod to Paik's _Robot K-456_, CS '68), arms/legs marching to the beat. Undocumented on the page.

## 9. Tech constraints

- **Self-contained static site** — `index.html` + vendored `p5.min.js` + `p5.sound.min.js` + `sketch.js`. No build step. Deploys to Vercel as-is.
- **Deterministic where possible** — same track + same control positions → same performance (prefer seeded PRNG over `noise()`/`Math.random()` in the render loop; the current prototype ties its clock to the track's playback time).
- Solid frame rate at 264 cells. Fullscreen-friendly. Keys: F fullscreen · S save PNG · D dev meter · R robot.
- Cache note during dev: bump the `?v=` on the `sketch.js` script tag each change (browsers cache hard).

## 10. What exists to build from

- **`sketch.js`** — a working prototype with the full architecture already in place: exact Schotter ground state, a `MOVEMENTS` registry (pluggable), a `pickMovement` conductor sequencing a `SEQ`, a Nature-of-Code physics layer (ease + spring), surge-gated destruction, multi-colour + motif rendering, unlabeled draggable controls, and the robot. **It is a strong scaffold but has not sustained "the magic" through tuning** — the developer's job is to take these ingredients and make it *sing*, using §5 and the `reference/` frames as the target.
- **git history** — named checkpoints: elegant (single-accent), participatory (controls), and multi-colour+motif versions. `git log --oneline`.
- **`reference/`** — the visual targets and anti-targets described in §5.

## 11. Definition of done

A stranger lands on cyberneticserendipity.com, sees a faithful **Nees _Schotter_**, plays a track (or the CS Music album), and watches that order **break apart and re-form to the music** — multi-colour with white space, punctuated by motif/flash moments where order emerges from disorder — while **dragging the unlabeled controls to shape it themselves**. It feels like a gallery installation, not a screensaver. It always returns to Schotter.
