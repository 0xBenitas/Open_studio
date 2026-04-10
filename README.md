# Open Studio 🌶️

A browser-based DAW (Digital Audio Workstation) and step sequencer built entirely with vanilla JavaScript. No frameworks, no runtime dependencies — just the Web Audio API and modern ES modules bundled with Vite.

## Features

- **8-track step sequencer** — 16/32/64-step modes with 8 patterns per track
- **Drum synthesis** — kick, hi-hat, clap, and open hi-hat generated procedurally (no samples)
- **Subtractive synth engine** — sawtooth, square, sine, triangle oscillators with ADSR envelope, filter cutoff, resonance, detune, and envelope modulation
- **LFO modulation** — routable to cutoff, pitch, pan, or volume with sine/square/saw/triangle shapes
- **FX chain** — distortion, convolution reverb, delay with feedback, chorus, bitcrusher, phaser (toggleable per effect)
- **Sidechain compression** — kick-to-bass ducking with adjustable amount, attack, and release
- **Master compressor** with threshold and ratio controls
- **Piano roll** — canvas-based note editor with scale lock, glide, zoom, quantize, and melody generator
- **Mixer view** — per-track faders, mute/solo, VU meters, and master channel
- **Live performance view** — macro knobs (Energy, Space, Tension, Drive), pattern launcher pads, and 3-band EQ
- **Spectrum analyzer** and **waveform display** — real-time FFT and time-domain visualizations
- **Scale lock** — Am, Cm, Dm, Em, Gm, A/D/E major, Pentatonic, Blues, Phrygian
- **Per-step velocity and probability**, global swing control
- **Pattern tools** — randomize, mutate, clear
- **Keyboard shortcuts** — Space (play/pause), Escape (stop), R (arm record)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Language | Vanilla JavaScript (ES modules) |
| Build tool | [Vite 6](https://vitejs.dev/) |
| Audio | Web Audio API |
| Rendering | HTML5 Canvas (piano roll, spectrum, waveform, knobs) |
| Styling | Plain CSS with CSS custom properties |
| Font | JetBrains Mono (Google Fonts) |
| Runtime dependencies | **None** |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm (included with Node.js)

### Install

```bash
git clone https://github.com/0xBenitas/Open_studio.git
cd Open_studio
npm install
```

### Development

```bash
npm run dev
```

Opens a local dev server with hot module replacement (default: `http://localhost:5173`).

### Production Build

```bash
npm run build
```

Outputs optimized static files to `dist/`.

### Preview Production Build

```bash
npm run preview
```

Serves the `dist/` folder locally to verify the production build.

## Project Structure

```
Open_studio/
├── index.html              # Main HTML shell (UI markup)
├── package.json            # Project metadata & scripts
├── vite.config.js          # Vite configuration
└── src/
    ├── main.js             # Entry point — imports styles, initializes modules
    ├── audio/
    │   ├── engine.js       # AudioContext, master routing, reverb/delay/distortion nodes
    │   ├── fx.js           # FX parameter updates and toggle functions
    │   ├── scheduler.js    # Step sequencer timing and playhead
    │   └── synth.js        # Sound synthesis (drums + melodic voices)
    ├── state/
    │   ├── store.js        # Central state (tracks, FX, transport, BPM, key)
    │   └── events.js       # Lightweight pub/sub event bus
    ├── ui/
    │   ├── header.js       # Transport controls, BPM, view switching
    │   ├── sequencer.js    # Step grid, track list, pattern tools
    │   ├── piano-roll.js   # Canvas piano roll, scale lock, melody generator
    │   ├── mixer.js        # Mixer channels, faders, VU meters
    │   ├── panels.js       # Synth parameter UI, FX/sidechain controls
    │   └── live.js         # Macro knobs, pattern launcher, EQ
    ├── visualization/
    │   ├── spectrum.js     # Real-time FFT spectrum analyzer
    │   ├── waveform.js     # Time-domain waveform display
    │   └── knob.js         # Canvas-drawn rotary knobs
    ├── utils/
    │   ├── constants.js    # Scales, note names, track defaults, macro definitions
    │   └── helpers.js      # Note frequency calc, pattern/grid factories
    └── styles/
        ├── main.css        # Reset, CSS variables, base layout
        ├── header.css      # Transport bar, tabs
        ├── sequencer.css   # Step grid, velocity strip
        ├── piano-roll.css  # Piano roll layout
        ├── mixer.css       # Mixer channel strips
        ├── live.css        # Live view, macro knobs, pads
        └── panels.css      # Bottom synth/FX panels
```

## Notes

- The UI is in **French**.
- 100% client-side — no backend, no API calls, no environment variables needed.
- Audio is initialized on first user interaction to comply with browser autoplay policies.
- All sounds are synthesized in real time — no audio sample files required.
