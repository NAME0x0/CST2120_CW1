# Sky Lanes – Technical Development Master Plan (Version 2.0)

> Elevated, production-style design + academically compliant implementation blueprint. All features strictly honor coursework constraints: **pure HTML/CSS/Vanilla JS**, **localStorage only**, **no third‑party frameworks**, **no backend**, **no external tracking**, fully demonstrable in a short video.

---

## 1. Executive Vision

Sky Lanes is a high–polish, lane‑based aerial navigation & reaction game wrapped inside a cinematic, storytelling, parallax‑driven website. The experience blends:

1. Narrative onboarding (scroll storytelling) that transitions seamlessly into gameplay.
2. Advanced yet framework‑free game systems (dynamic difficulty, procedural events, achievement meta‑loop).
3. A richly instrumented, performance‑aware Canvas engine delivering consistent 60 FPS on mid‑range hardware.
4. Robust local account + ranking ecosystem (JSON in `localStorage`) with validation, data integrity guards, export & purge controls.
5. Accessibility & usability-first UX patterned after award‑winning interactive sites (e.g., Awwwards / CSS Design Awards inspirations) but rebuilt originally and minimally to meet academic authenticity.

Outcome: A site & game that “feels” like months of iteration—cohesive art direction, layered depth, micro‑interactions, adaptive systems—yet remains academically transparent and reviewable.

---

## 2. Narrative Parallax Storytelling UX

The landing page (Home) becomes a multi‑chapter interactive scroll journey (“Atmospheric Descent → Turbulence → Mastery → Launch Game”). Each chapter uses layered parallax + progressive disclosure patterns.

### 2.1 Section Architecture

| Chapter | Purpose | Interaction Cue | Transition Technique |
|---------|---------|-----------------|----------------------|
| 0. Hero Aperture | Brand identity, start CTA | Subtle kinetic logo & orbiting particle ring | Timed fade + scale-in |
| 1. Atmospheric Layers | Introduce altitude & lanes concept | Scroll speed influences cloud drift | Multi-depth parallax transform Z-index |
| 2. Threat Emergence | Convey obstacle archetypes | Scroll triggers obstacle silhouettes sliding in | IntersectionObserver + CSS clip-path reveal |
| 3. Pilot Systems | Explain controls & lanes | Key press demo animation (A / D / ← / →) | Canvas sprite tutorial overlay |
| 4. Progression & Rewards | Show achievements & ranks | Hover over badge to flip card | 3D transform w/ reduced motion fallback |
| 5. Call to Action | Seamless shift to playable state | “Enter Flight Mode” button pulses once | Cross-fade + game canvas focus trap |

### 2.2 Parallax Implementation (Performance-Safe)

Layers: `background-stars`, `mid-clouds`, `foreground-debris`, `hud-elements`. Each layer uses a data attribute `data-depth` consumed by a lightweight parallax controller throttled to animation frames.

```javascript
// parallax.js (excerpt)
export class ParallaxController {
  constructor(root) {
    this.layers = [...root.querySelectorAll('[data-depth]')];
    this.handleScroll = this.handleScroll.bind(this);
    this.lastY = 0;
    window.addEventListener('scroll', () => requestAnimationFrame(this.handleScroll));
  }
  handleScroll() {
    const y = window.scrollY;
    const delta = y - this.lastY;
    this.layers.forEach(el => {
      const depth = parseFloat(el.dataset.depth);
      // GPU-friendly: translateZ omitted; use translate3d for compositing.
      el.style.transform = `translate3d(0, ${-(y * depth)}px, 0)`;
    });
    this.lastY = y;
  }
}
```

### 2.3 Storytelling Enhancements

- **Sequential Ambient Audio (Optional & Muted by Default)**: Local short loops (wind → engine hum → alert pings) fade in per chapter (user consent toggle stored in `localStorage: skyLanes_audio_optin`).
- **Progress Dots + Scroll Spy**: Minimal vertical rail with accessible buttons (`role="navigation"`).
- **Reduced Motion Mode**: When `prefers-reduced-motion` or user toggles “Simplify Experience”, parallax offsets clamp & heavy animations swap for opacity fades.

---

## 3. Game Design Deep Dive

### 3.1 Core Loop

Evade dynamic obstacles across 3–5 adaptive lanes, collect energy shards, maintain streak multipliers, survive timed event waves, and chase leaderboard supremacy.

```text
Enter → Navigate Lanes → Avoid / Collect → Build Combo → Trigger Events → Level Up → Bank Score → Persist / Share
```

### 3.2 Systems Overview

| System | Purpose | Key Techniques | Storage Impact |
|--------|---------|---------------|----------------|
| Lane Manager | Track lane occupancy & transitions | Temporal easing curves; lane cooldown flags | None (runtime) |
| Obstacle Spawner | Procedurally schedules hazards | Weighted probability tables; dynamic pacing curve | Seed persisted for deterministic replays |
| Dynamic Difficulty (DDC) | Scale challenge responsively | Difficulty Index (DI) computed from survival time + error rate | `skyLanes_ddc` snapshot for debugging |
| Event Engine | Inject “Meteor Shower”, “Ion Storm” waves | Timed state machine | Last event timestamp persisted for daily challenge gating |
| Combo / Multiplier | Reward flawless runs | Linear → exponential curve after threshold | Part of current session object |
| Achievement Tracker | Meta progression & motivation | Rule evaluation DSL (simple predicate objects) | Array in user profile |
| Ghost Replay (Optional Bonus) | Let player race previous best | Stores compressed action frames (RLE) | Add `ghostData` to best run |
| Analytics Overlay (Dev only) | Debug performance live | Off-screen canvas sparkline for frame times | Disabled in prod by default flag |

### 3.3 Obstacle & Collectible Archetypes

- Standard Drone (baseline pace)
- Pulsing Mine (radius expansion telegraph)
- Phase Rift (blinks invisible every N frames)
- Energy Shard (score + streak booster)
- Shield Core (temporary invulnerability window)
- Velocity Stream (auto-shifts lane – risk/reward)

### 3.4 Scoring Model

Formula (executed post-frame):  
`baseGain = shardValue * (1 + (comboMultiplier * 0.25)) + survivalTick`  
`eventBonus = (activeEvent ? difficultyTier * 15 : 0)`  
`finalFrameScore = (baseGain + eventBonus) * difficultyScalar`

Difficulty Scalar: piecewise scaling to keep early onboarding gentle then sharply reward mastery.

### 3.5 Dynamic Difficulty Controller (DDC)

`DI = normalize(survivalTime) + weight(comboStability) - penalty(hitEvents) + bonus(perfectSegments)` → clamps into tier (0–7). Tiers feed spawn density, obstacle substitution ratio, and event injection probability.

### 3.6 Achievement System

Sample JSON DSL for predicate evaluation:

```json
{
  "id": "first_flight",
  "label": "First Flight",
  "condition": {"type": "gamesPlayed", "gte": 1},
  "reward": {"xp": 25}
}

```

Evaluator walks all unlocked conditions each end-of-run tick → persists achievements array in user profile.

### 3.7 Ghost Replay Encoding (Optional Stretch)

- Record discrete lane changes + timestamps instead of every frame.
- Run-Length Encode consecutive lane frames.
- Store under `user.bestRun.ghost = { seed, actions: [[tIndex, lane], ...] }`.
- Replay by reseeding obstacle RNG + injecting recorded actions.

### 3.8 Failure & Recovery Experience

- Slow‑mo frame window (clamped to 250ms) with desaturated shader pass (Canvas globalCompositeOperation overlay pattern) before presenting results panel.
- Instant “Retry” anchored to performance heuristics (if frame time < threshold) ensures rapid iteration.

---

## 4. Architecture (High Fidelity)

### 4.1 Layered Responsibility Model

| Layer | Module Clusters | Description |
|-------|-----------------|-------------|
| Presentation | `ui/`, `parallax.js`, `hud.js` | DOM + Canvas overlays, accessibility roles, responsive layout |
| Interaction | `input.js` | Normalizes keyboard/touch, debounced gestures |
| Game Domain | `game.js`, `spawner.js`, `events.js`, `difficulty.js` | Deterministic rules & state machines |
| Data & Profile | `storage.js`, `validation.js`, `achievements.js` | localStorage CRUD, JSON schema checking |
| Diagnostics | `performance.js`, `devOverlay.js` | Frame timing, memory hints, optional overlay |
| Utility | `math.js`, `rng.js` | Pure functions, seeded random, easing |

### 4.2 Module Contract Conventions

- Each exported class/function includes JSDoc: params, returns, side‑effects.
- Public surface minimized; internal helpers suffixed `_internal`.
- Deterministic functions stay pure for easier test harness instrumentation.

### 4.3 Seeded Randomness

Custom XORShift variant → ensures reproducible obstacle patterns (seed saved with high score). Supports ghost & fairness debugging.

### 4.4 Rendering Strategy

| Concern | Technique | Rationale |
|---------|-----------|-----------|
| Background Scroll | Pre-baked tileable layers; translate3d | Avoid Canvas overdraw |
| Entities | Single Canvas draw list sorted by y-depth | Minimize context state changes |
| Particles | Object pooling + deferred removal queue | Stable GC profile |
| UI Overlay | Separate DOM (HUD) | Faster iteration + accessibility semantics |
| Post Effects (subtle) | Composite operations & alpha gradients | Maintain performance w/o shaders |

### 4.5 Performance Budgets

- Max draw calls/frame: 250 (target typical ~120)
- JS main thread frame budget: < 12ms (16.6ms total frame @ 60 FPS)
- Memory transient allocations per frame: < 30KB (object pooling ensures reuse)
- Initial total JS payload: < 180KB uncompressed (well under typical academic constraints)

### 4.6 Internal Dev Console

Activated via hash `#dev` or `localStorage.skyLanes_devMode = true`. Provides overlay toggles: collision boxes, DI tier, spawn queue preview, frame graph micro chart.

---

## 5. Data & Storage Architecture (Local Only)

### 5.1 localStorage Keys

| Key | Contents | Notes |
|-----|----------|-------|
| `skyLanes_users` | Master user map `{ username: UserProfile }` | JSON stringified |
| `skyLanes_activeUser` | Current session username | Cleared on logout |
| `skyLanes_settings` | Audio, motion, contrast preferences | Merged updates |
| `skyLanes_dailySeed` | Daily challenge RNG seed | Resets per day |
| `skyLanes_version` | Data schema version | Migration gate |

### 5.2 User Profile Shape

```json
{
  "username": "pilot01",
  "email": "pilot01@example.com",
  "extra": {"phone": "optional", "address": "optional"},
  "highScore": 183450,
  "scores": [183450, 162000, 150500],
  "achievements": ["first_flight", "streak_master"],
  "settings": {"audio": false, "reducedMotion": false},
  "bestRun": {"seed": 918273, "ghost": {"actions": [[12,2],[48,3]]}},
  "created": 1695822339000,
  "updated": 1695825401000
}
```

### 5.3 Validation Pipeline

1. Synchronous structural check (field presence, types).  
2. Semantic validation (email regex, password strength rule, phone numeric).  
3. Sanitization (trim, collapse whitespace, escape for injection contexts when reading back into DOM).  
4. Persist only after schema pass; maintain clone for rollback if serialization fails.

### 5.4 Data Integrity & Versioning

`skyLanes_version` increments on schema evolution. Simple in‑place migration function runs at load (e.g., add `achievements` array if missing).

### 5.5 Export & Purge (User Control)

JSON export button (downloads `sky_lanes_profile_<username>.json`). Purge triggers confirm modal (non-blocking custom dialog) → removes profile + session key.

---

## 6. Accessibility & Inclusive Design

| Aspect | Implementation |
|--------|----------------|
| Landmarks | `<header> <nav> <main> <footer>` + ARIA roles where needed |
| Focus Management | Trap inside modal/game states; restore prior focus on exit |
| Visual Contrast | Tokenized palette tested via tooling; all interactive elements > 4.5:1 |
| Motion Reduction | Parallax + particle density halved; large shifts replaced with fades |
| Input Flexibility | Keyboard (← → / A D), touch swipe lanes, optional on‑screen controls |
| Live Regions | Announce score milestones & achievement unlocks to screen readers |
| Instruction Clarity | Dedicated “Controls & Accessibility” panel accessible from nav |

---

## 7. Advanced Visual & Interaction Systems

### 7.1 Design Tokens (CSS Custom Properties)

```css
:root {
  --color-bg-deep: #060713;
  --color-accent: #ff6b35;
  --color-accent-alt: #00d4ff;
  --color-surface-glass: rgba(255,255,255,0.08);
  --color-outline: rgba(255,255,255,0.25);
  --radius-sm: 4px; --radius-md: 10px; --radius-pill: 999px;
  --elev-1: 0 2px 6px -1px rgba(0,0,0,0.4);
  --elev-2: 0 8px 28px -4px rgba(0,0,0,0.5);
  --transition-fast: 120ms cubic-bezier(.4,.0,.2,1);
  --transition-slow: 400ms cubic-bezier(.22,.61,.36,1);
}
```

### 7.2 Micro‑Interactions

- Button hover: subtle lateral parallax shimmer.
- Achievement unlock: particle burst emitter at HUD coordinate → accessible toast with text alt.
- Lane shift: squish & rebound easing (gives physicality) with haptic (touch vibrate API if available & accepted—**optional**; gracefully ignored otherwise).

### 7.3 Atmospheric Layers

Procedurally tinted gradient sky evolves as DI increases: low intensity = calm blues; high intensity = energized violet/orange halo.

### 7.4 Particle Optimization

Pool size capped (e.g., 120). When saturated, oldest inactive replaced (ring buffer). Ensures steady memory.

---

## 8. Security & Academic Integrity

| Vector | Mitigation |
|--------|-----------|
| XSS (Stored) | Escape dynamic content when injecting into DOM; never eval user input |
| Form Abuse | Length limits, pattern checks |
| Credential Guessing | Simple incremental delay after 5 failed attempts (client only) |
| Data Tampering | Basic checksum of serialized profile (optional) to detect accidental corruption (not a real security barrier) |
| Cheating (Score) | Store layered score components (ticks, shard count, multiplier trace) enabling plausibility scan; mark suspicious runs |

Transparent disclaimers clarify client‑side only environment cannot guarantee strong security—acceptable under coursework constraints.

---

## 9. Testing & Quality Engineering

### 9.1 Test Matrix (Representative)

| Category | Cases |
|----------|-------|
| Validation | Empty fields, malformed email, weak password, duplicate username |
| Auth Flow | Register → login → logout → re-login persistence |
| Storage | Score append, leaderboard sort stability, migration path |
| Gameplay | Lane boundary clamp, collision accuracy, DI tier escalation |
| Performance | Frame budget under stress (max particles + events) |
| Accessibility | Keyboard-only run, screen reader announcements, reduced motion toggle |

### 9.2 Automated Harness (Lightweight)

Pure logic modules (e.g., `difficulty.js`, `achievements.js`, `rng.js`) include minimal assertion blocks executed when `#dev` hash present to output PASS/FAIL summary to console.

### 9.3 Manual QA Scripts

Step-by-step scripts enumerated in `QA_CHECKLIST.md` (not required by rubric but strengthens credibility) for video demonstration reproducibility.

### 9.4 Performance Telemetry

`performance.js` captures: frame time rolling average, DI trend, object counts. In dev mode draws tiny overlay sparkline (Canvas 120x30) with green/yellow/red thresholds.

---

## 10. Leaderboard & Ranking Logic

### 10.1 Aggregation

Leaderboard computed on demand: iterate users map → flatten all `highScore` values with username → sort descending → slice top N (default 10). O(N log N) with small dataset negligible.

### 10.2 Tie Handling

Stable sort with secondary key = earliest achievement timestamp (reward early pioneers). Display rank numbers with tie grouping (e.g., two #2s then #4).

### 10.3 Client Rendering

Progressive enhancement: base `<table>` with semantic headers; JS enhances with sortable columns (score/date) via click toggles. ARIA live region announces resorts.

---

## 11. Video Demonstration Mapping (Rubric Alignment)

| Rubric Item | Video Action |
|-------------|--------------|
| Navigation & Pages | Show nav bar → click Registration → Login → Game → Rankings |
| Consistent Styling | Scroll narrative sections & show shared components token usage |
| Usability | Demonstrate real-time validation messages & clear instructions panel |
| Basic Game | Start game → survive short run → show score tally |
| Modules & Classes | Brief code peek: `import` lines & class headers |
| Graphics | Showcase layered parallax + animated entities |
| Advanced Functionality | Trigger event wave + show DI overlay (dev toggle) |
| Storage (Basic & Extended) | Open DevTools → localStorage keys expanded |
| Validation | Attempt invalid email / short password → error surfaces inline |
| Login Errors | Wrong username → specific error; wrong password → alternate error |
| Ranking Table | Show sorted leaderboard; add new score; refresh view |
| Code Quality | Show commented module + consistent formatting (ESLint) |
| File Organization | Reveal project tree quickly |
| Report Evidence | Reference screenshot collection (prepared externally) |

---

## 12. Performance Optimization Strategy (Expanded)

| Layer | Optimization | Justification |
|-------|--------------|---------------|
| JS Execution | Defer non-critical modules (achievements parsing after first frame idle) | Faster First Interaction |
| Rendering | Batched draw calls; avoid per-entity context save/restore | Minimizes overhead |
| Layout/Style | Contain animations to transform/opacity | Prevent layout thrash |
| Images | Vector or programmatic shapes for most entities | Shrinks payload |
| Memory | Pools + ring buffers for particles & obstacles | GC stability |
| Input | Throttle scroll, unify keydown repeat suppression | Responsiveness |

Fallback detection gracefully disables high-cost visuals if frame time > 25ms sustained (adaptive downgrade: fewer particles, skip bloom overlay, simplify parallax depth).

---

## 13. Implementation Roadmap (Refined Weeks)

| Week | Focus | Key Deliverables |
|------|-------|------------------|
| 1 | Foundations & Narrative Shell | Parallax scaffolding, navigation, registration + validation baseline |
| 2 | Core Game Mechanics | Lane system, obstacle spawner v1, scoring prototype |
| 3 | Dynamic Difficulty & Achievements | DDC tiers, achievement evaluator, streak system |
| 4 | Advanced Events & Visual Polish | Event waves, particle tuning, atmospheric gradients, accessibility refinements |
| 5 | Hardening & Evidence | Leaderboard final, QA passes, dev overlay polish, video & report assets |

Daily micro-cycles: Plan (15m) → Implement (2–3h blocks) → Instrument/test (30m) → Polish (15m) → Log progress.

---

## 14. Risk Register & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Over-scoping features | Delivery delay | Feature flag stretch systems (ghost, audio) so core gameplay shippable earlier |
| Performance dips on low-end devices | Reduced playability | Adaptive downgrade path + early profiling |
| Accessibility regressions | Mark loss | Include a11y checks in weekly QA checklist |
| Data corruption (manual localStorage edits) | Crash / display errors | Defensive parsing + fallback defaults |
| Time overrun on visuals | Incomplete advanced game | Prioritize mechanics before polish (Week ordering) |

---

## 15. Code Quality & Conventions

| Aspect | Rule |
|--------|------|
| Naming | camelCase for funcs/vars, PascalCase for classes, CONSTANT_CASE for config |
| File Size | Soft limit ~400 lines per module; split when exceeding cohesion |
| Comments | JSDoc + high-level section banners |
| Linting | ESLint (no unused vars, no implicit globals) |
| Formatting | Prettier defaults except 100 char wrap.|
| Error Handling | Throw only in domain boundaries, else return result objects |

---

## 16. Sample Module Skeletons

```javascript
// game.js
import { RNG } from './modules/rng.js';
import { Difficulty } from './modules/difficulty.js';

export class Game {
  constructor(seed) {
    this.rng = new RNG(seed);
    this.difficulty = new Difficulty();
  }
  update(dt) {
    // advance entities, evaluate difficulty
  }
  render(ctx) {
    // batched draws
  }
}
```

```javascript
// achievements.js
export function evaluateAchievements(profile, context) {
  // run predicates, add new unlocks, return diff
  return [];
}
```

```javascript
// difficulty.js
export class Difficulty {
  constructor() { this.index = 0; }
  tick(metrics) { /* adjust this.index */ }
}
```

---

## 17. Future-Safe (Within Academic Limits)

Clearly flagged stretch goals (NOT required for grade but architecturally prepped):

- Service Worker shell (commented out stub only – not active)
- WebGL experimental renderer fallback (placeholder file with notes)
- Multiplayer concept doc (no implementation)

All separated to avoid inflating core complexity while showcasing forward planning.

---

## 18. Success Metrics (Refined KPIs)

| Dimension | Metric | Target |
|----------|--------|--------|
| Load | First Interaction | < 2000ms on mid device |
| Runtime | Avg Frame Time | < 12ms |
| Stability | Crash-free sessions | > 99% |
| Accessibility | Axe automated checks | 0 critical |
| Engagement | Avg session length | > 2 mins (local heuristic) |
| Replayability | Return within 24h (local flag) | > 30% (simulated locally) |

---

## 19. Video & Report Preparation Aids

- Pre-seeded demo profile with varied scores for leaderboard richness.
- “Debug overlay” toggle briefly enabled to evidence technical sophistication (then disabled to show aesthetic purity).
- Clean DevTools localStorage inspection planned timestamp-wise early in video to conserve runtime.

---

## 20. Compliance Checklist (Inline)

| Coursework Requirement | Plan Fulfilment |
|------------------------|----------------|
| Separate pages (nav, game, register, login, rankings) | Defined multi-page + narrative sections |
| Advanced JS (500+ LOC) | Multi-system engine (difficulty, events, achievements, ghost) |
| Storage JSON only | All persistence via structured JSON keys |
| Validation JS-driven | Multi-stage pipeline + real-time feedback |
| Rankings sorted | Deterministic sort + ties handling |
| Code quality | Lint, structure, docs, modularity |
| Report clarity | Dedicated mapping & evidence references |

---

## 21. Intellectual Property & Originality

All gameplay code, narrative copy, visual implementation, and architectural patterns authored uniquely for coursework. Inspirations from industry award‑winning trends (parallax layering, chaptered narrative, micro‑interactions) reinterpreted with original assets & logic. No cloning of third-party source.

---

**Document Version**: 2.0  
**Last Updated**: September 28, 2025  
**Author / Maintainer**: Sky Lanes Development Team  
**Status**: Enhanced – Ready for Implementation

This master plan supersedes Version 1.0 and provides an exhaustive yet academically compliant blueprint to deliver an elevated, polished experience demonstrating technical depth, design maturity, and rubric alignment.
