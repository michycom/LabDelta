# Self-running Contest Demo Walkthrough

Status: **implemented on the real read-only application surface**

The walkthrough is a central, deterministic UI state machine. It does not
contain medical rules, fixture values, a duplicate dashboard, a video, or an
import path. It navigates the existing React views backed by the approved local
SQLite seed and highlights real elements after their asynchronous data has
loaded.

## Controls

Play, Pause, Stop, Restart, English, and Deutsch are available in the persistent
walkthrough controller and the native Tauri Demo menu. Pause preserves the
current step. Stop returns the state machine to step one. Restart begins step one
immediately. Reset Demo Data remains disabled because the walkthrough does not
mutate the approved seed.

Animated subtitles are always visible while playing or paused. When supported
by the local WebView and operating system, `window.speechSynthesis` reads the
same centralized English or German text. No network or runtime AI is involved.

## Ten steps

1. Introduction and permanent synthetic-data marker.
2. SQLite-driven dashboard and deterministic ordering.
3. The fully synthetic Dirk Mayer dashboard card.
4. Confirmed report values and supplied references.
5. Compact mathematical explanation with rule versions.
6. Static, versioned profile assignments.
7. Three dated reports as longitudinal data.
8. Original text, source document, and stored provenance locator.
9. Disabled manual-import boundary.
10. Conclusion and project limitations.

Every narration states data behavior and deterministic calculations only. It
does not add diagnosis, prognosis, risk, recommendation, or medical direction.
