# Handoff: Recomp Games — Mobile App UI

## Overview
Recomp Games is a social fitness accountability app for small groups (8 participants). Users join a 26-week challenge where they submit weekly weigh-in check-ins (scale photo + weight + note), track progress, and compete on a leaderboard. The app is mobile-first, dark-themed, with a playful-but-clean aesthetic.

## About the Design Files
The files in this bundle are **design references created in HTML** — hi-fi prototypes showing the intended look and behavior. They are NOT production code. The task is to **recreate these designs in your target codebase** (React Native, Swift, Flutter, etc.) using its established patterns and libraries. Open `Recomp Games UI.html` in a browser to see all screens side-by-side.

## Fidelity
These are **high-fidelity (hifi)** mockups with final colors, typography, spacing, and layout. The developer should recreate the UI pixel-perfectly using the codebase's existing libraries and patterns.

---

## Navigation Structure

4-tab bottom navigation:
| Tab | Label | Icon | Description |
|-----|-------|------|-------------|
| 1 | Home | House (filled) | Personal dashboard |
| 2 | Activity | Pulse/heartbeat (stroke) | Group activity feed |
| 3 | Leaderboard | Bar chart (stroke) | Rankings |
| 4 | Profile | Person (filled) | User's own profile |

When viewing another participant's profile (navigated from leaderboard/feed), **no tab is highlighted** in the bottom nav. The user swipes back or taps a nav tab to leave.

---

## Screens / Views

### 1. Home — Pending Check-In
**Purpose:** Main dashboard when check-in window is open but not yet submitted.

**Layout:**
- App bar: ★ star icon + "RECOMP" text (accent color, Fredoka 700, 15px, letter-spacing 1.5px) on left; user avatar (30px) on right. Padding: 56px top, 18px sides.
- Greeting: "Hey, {name} 👋" (Fredoka 700, 26px). Below: "Week X of Y" (Fredoka 500, 13px, secondary text) + progress bar (3px tall, accent fill, max-width 100px).
- Check-in status card (glass card with glow): 
  - Header: ⏳ + "Week X · date range" (Fredoka 600, 13px, accent color)
  - Title: "Check-in not submitted" (Fredoka 600, 15px)
  - Subtext: "Opens Mon 12:00 AM AEST" (12px, secondary text)
  - Countdown: 3 boxes (day/hrs/min) with accent-colored numbers (Fredoka 700, 20px) on surfaceBright background, 8px border-radius
  - CTA button: "Submit Check-In" (full-width primary button)
- Photos banner: orange accent, "Add your starting photos →" with camera icon
- Mini leaderboard: "🏆 Leaderboard" header + "See all →" link. Shows top 3 with rank number (medal colors: gold/silver/bronze), avatar (28px), name, points. Below: "You're #X with Y points" accent pill.
- Past Check-Ins: List of previous weeks showing week range, weight (accent), and note.
- Bottom nav

### 2. Home — Checked In (Monday)
**Purpose:** Home screen after submitting the weekly check-in. Shown for the rest of Monday, then the check-in card hides until next Monday.

**Layout:** Same as Home, but the check-in status card is replaced with:
- Green confirmation card (accent: #66BB6A):
  - Green checkmark circle (28px) + "Week X check-in submitted" (Fredoka 600, 15px, green)
  - Summary box (surfaceBright bg, 10px radius): weight "84.5 kg" + change "↓ 0.7 kg" (green) + truncated note
  - "Next check-in opens next Monday 12:00 AM AEST" (12px, muted text)

### 3. Activity Feed — Timeline
**Purpose:** Chronological feed of group check-ins with day grouping and emoji reactions.

**Layout:**
- Header: "Activity" (Fredoka 700, 26px) + "Week X check-ins" (Fredoka 500, 13px, secondary)
- Grouped by day: "TODAY" / "YESTERDAY" / "EARLIER" (Fredoka 600, 12px, muted, uppercase, letter-spacing 1.2px)
- Each feed item:
  - Avatar (34px) on left with vertical timeline connector line (2px, separator color) between items
  - Name (Fredoka 600, 14px) + timestamp (11px, muted) on first line
  - Weight "XX.X kg" (Fredoka 700, 18px) + change badge (green for loss, neutral/secondary text color for gain — **never red/orange**)
  - Scale photo thumbnail (64×48px, surfaceBright bg, rounded 8px) showing the weight reading
  - Note text (13px, secondary, line-height 1.5)
  - Reaction pills: emoji + count in surfaceBright chips (12px, border-radius 10px) + "+" add button (24px circle)
- Bottom nav (Activity tab active)

### 4. Check-In Step 1 — Scale Photo
**Purpose:** Capture a photo of the scale reading.

**Layout:**
- Step dots indicator: 2 steps total, step 1 active (filled accent dots connected by lines)
- 📸 icon (32px) + "Scale Photo" (Fredoka 700, 22px) + "Snap a pic of the scale reading" (13px, secondary)
- Camera capture area: dashed border (2px, muted), 4:3 aspect ratio, max-width 260px, border-radius 20px. Camera icon in accent circle (56px) + "Tap to capture" (Fredoka 500, 14px)
- "or upload from library" (12px, muted) below
- Full-width "Next →" primary button

### 5. Check-In Step 2 — Weight & Note (combined)
**Purpose:** Enter weight and weekly note in a single screen.

**Layout:**
- Step dots: step 2 of 2 active
- Weight section:
  - "Your Weight" label (Fredoka 600, 15px)
  - Input card: large weight "84.5" (Fredoka 700, 44px) + "kg" (Fredoka 500, 18px, muted). Surface bg, border-radius 16px. Accent underline (60px × 2px).
  - Comparison pill: "↓ 0.7 kg less than last week (85.2)" (13px, secondary text — **always neutral color, never red for gain**)
- Note section:
  - "How'd your week go?" (Fredoka 600, 15px) + "One sentence is plenty" (12px, secondary)
  - Text area card: surface bg, accent border (22% opacity), border-radius 14px, min-height 100px. Character count "XX/280" bottom-right.
- Footer: "← Back" secondary button (flex 1) + "Submit ✓" primary button (flex 2)

### 6. Check-In Confirmation
**Purpose:** Success screen after submitting check-in.

**Layout:**
- Centered content with radial gradient background (#1a102e → #0b0f1a)
- Subtle glow circle (240px, accent 20% opacity)
- 🔥 emoji (60px) + "Locked in!" (Fredoka 700, 28px) + "Week X · date range" (Fredoka 500, 15px, accent)
- Summary card: "Summary" label + "Edit" link (accent). Photo thumbnail (56×56, radius 10px) + weight "84.5 kg" (Fredoka 700, 20px) + note (13px, secondary, 2-line clamp)
- "Back to Home" full-width primary button

### 7. Initial Photos — Pose Steps (×3: Front, Side, Back)
**Purpose:** Capture starting body photos for the challenge.

**Layout:**
- Step dots: 3 total, current step highlighted
- 📸 icon + "{Pose} Photo" title + hint text (e.g., "Face the camera, arms relaxed at sides")
- Pose guide area: dashed border (accent 44% opacity), 3:4 aspect ratio, max-width 200px. Simple body outline SVG + pose label (uppercase, accent 77%)
- Privacy note: "Viewable by other participants" (11px, muted) — **no lock emoji**
- "📷 Take Photo" full-width primary button
- "Skip for now — come back anytime" (13px, muted, centered)

### 8. Initial Photos Done
**Purpose:** Confirmation after all photos captured.

**Layout:** Similar to check-in confirmation — centered, radial gradient, glow.
- 💪 emoji (52px) + "Starting photos saved!" (Fredoka 700, 26px)
- "You can retake these anytime before the challenge starts" (14px, secondary)
- 3 photo thumbnails (80×100px each): Front/Side/Back with 📷 icon + label
- "Back to Home" full-width button

### 9. My Profile
**Purpose:** User's own profile, accessible via Profile tab.

**Layout:**
- Centered avatar (72px) with edit icon overlay (24px gold circle with pencil SVG, positioned bottom-right, 2px border matching bg)
- Name (Fredoka 700, 24px) + "Rank #X · Week Y of Z" (Fredoka 500, 13px, secondary)
- Stats row (3 equal cards): Points (accent) | Rank (medal color) | Check-ins (user color). Each: value (Fredoka 700, 20px) + label (Fredoka 500, 11px, muted). Surface bg, border-radius 14px.
- **Weight Progress** section:
  - Header: "Weight Progress" + "↓ X.X kg total" (green for loss, neutral for gain)
  - Card with sparkline SVG chart (accent color line + gradient fill, dots at data points, last dot larger with bg-color stroke). Current weight (Fredoka 700, 28px) + "Started at XX.X kg" on right. Week labels below chart.
- **Starting Photos**: "Starting Photos" header. 3 equal photo placeholders (3:4 aspect, radius 12px, surfaceBright bg). No retake button.
- **Recent Check-Ins**: Same list style as home screen
- Bottom nav (Profile tab active)

### 10. Participant Profile (Viewing Others)
**Purpose:** View another participant's profile. Navigated from leaderboard or feed by tapping name/avatar.

**Layout:**
- **No back button / header** — user swipes back or taps nav
- Same hero layout as My Profile but without edit icon
- Same stats row
- **Weight Progress** card using participant's color for the sparkline (not accent)
- **Activity grid**: 13-column CSS grid showing all 26 weeks. Checked-in weeks filled with participant color (55% opacity), missed weeks dim. Current week has accent border + dot. Legend: Checked in / Missed / Now.
- Bottom nav — **no tab highlighted** (active="")

### 11. Leaderboard — Clean (Option A)
**Purpose:** Full ranked list of all participants.

**Layout:**
- Header: ★ icon (accent with drop-shadow) + "RECOMP GAMES 2026" (Fredoka 500, 12px, muted, uppercase, letter-spacing 1.5px)
- "Leaderboard" (Fredoka 700, 26px) + "Week X of Y" (Fredoka 500, 13px, secondary)
- Participant list: rank number (medal colors for top 3, muted for rest), avatar (34px), name (Fredoka 500, 15px; 600 + accent color if isYou + "YOU" badge), progress bar (3px, participant color at 50% opacity), points (Fredoka 700, 16px) + "X/Y wks" (10px, muted)
- Bottom nav (Leaderboard tab active)

### 12. Leaderboard — Podium (Option B)
**Purpose:** Visual podium layout for top 3, list for the rest.

**Layout:**
- Header: "🏆 Leaderboard" (Fredoka 700, 26px, centered) + "Week X of Y"
- Podium: 3 columns (2nd | 1st | 3rd). Each: avatar (36/44/36px), name, points, podium bar with medal gradient fill + medal emoji. Heights: 74/100/54px.
- Divider line
- Remaining participants: same row style as clean version
- Bottom nav (Leaderboard tab active)

### 13. Not Signed In
**Purpose:** Fallback for users without a personal link.

**Layout:**
- Centered, radial gradient background with subtle glow
- ★ icon (36px, accent, drop-shadow) + "THE RECOMP GAMES" (Fredoka 700, 18px, accent, letter-spacing 2px)
- 🔗 link icon in circle (60px, surface bg, border)
- "You need a personal link" (Fredoka 600, 18px) + "Check your group chat for your unique sign-in link. No passwords needed." (14px, secondary)
- "View leaderboard →" secondary button

---

## Interactions & Behavior

- **Check-in flow**: 2-step wizard (Scale Photo → Weight & Note). Step dots show progress. Back/Next navigation between steps. Submit on step 2 leads to Confirmation.
- **Check-in window**: Opens Monday 12:00 AM AEST. After submission, home shows confirmed state for the rest of Monday. Card hidden Tuesday–Sunday.
- **Leaderboard → Profile**: Tapping a participant's name or avatar navigates to their profile page.
- **Activity feed reactions**: Users can tap existing reaction pills or the "+" button to add emoji reactions (🔥 💪 👏).
- **Profile edit**: Edit icon on avatar (My Profile only) — opens profile edit flow.
- **Initial photos**: 3-step flow (Front/Side/Back), can skip individual steps. Photos visible to other participants.
- **Navigation**: Bottom nav for primary screens. Swipe-back gesture for profile drilldowns.

---

## Design Tokens

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| accent (primary) | `#FFD700` | Buttons, highlights, active states, links |
| bg | `#0b0f1a` | Base background |
| bgGrad | `linear-gradient(180deg, #10081e 0%, #0b0f1a 50%)` | Screen backgrounds |
| surface | `rgba(255,255,255,0.05)` | Cards, inputs |
| surfaceBright | `rgba(255,255,255,0.08)` | Elevated surfaces, chips |
| border | `rgba(255,255,255,0.07)` | Card borders |
| text | `#fff` | Primary text |
| textSec | `rgba(255,255,255,0.6)` | Secondary text |
| textMut | `rgba(255,255,255,0.35)` | Muted/placeholder text |
| sep | `rgba(255,255,255,0.06)` | Dividers |
| navBg | `rgba(8,10,20,0.94)` | Bottom nav (with blur) |
| positive | `#66BB6A` | Weight loss, success |
| negative | use `textSec` | Weight gain — **neutral, never red** |
| medal-gold | `#FFD700` | 1st place |
| medal-silver | `#C0C0C0` | 2nd place |
| medal-bronze | `#CD7F32` | 3rd place |

### Participant Colors
| Name | Color |
|------|-------|
| Lachie | `#4FC3F7` |
| Jeremy | `#FFD700` |
| Brodie | `#66BB6A` |
| Tom | `#FF7043` |
| Mitch | `#AB47BC` |
| Dan | `#26C6DA` |
| Andrew | `#EF5350` |
| Sam | `#FFA500` |

### Typography
| Token | Family | Weight | Size |
|-------|--------|--------|------|
| heading-xl | Fredoka | 700 | 28px |
| heading-lg | Fredoka | 700 | 26px |
| heading-md | Fredoka | 700 | 22px |
| heading-sm | Fredoka | 600 | 15px |
| body | DM Sans | 400 | 15px |
| body-sm | DM Sans | 400 | 13px |
| caption | Fredoka | 500 | 12px |
| label | Fredoka | 500 | 11px |
| micro | Fredoka | 500 | 10px |

### Spacing & Radii
| Token | Value |
|-------|-------|
| card-radius | 16px |
| button-radius | 12px |
| chip-radius | 10-12px |
| input-radius | 14px |
| avatar-radius | 50% (circle) |
| page-padding-x | 16-20px |
| card-padding | 18px 16px |
| button-padding | 13px 24px |
| section-gap | 14px |

### Shadows
| Token | Value |
|-------|-------|
| card-shadow (dark) | `0 4px 20px rgba(0,0,0,0.3)` |
| glow | `0 0 24px {accent}10` |
| button-shadow | `0 4px 16px {accent}28` |

---

## Data Model

### Participant
```
{
  name: string,
  points: number,
  weeks: number,        // weeks checked in
  color: string,        // hex color for avatar/charts
  isYou?: boolean
}
```

### Check-In
```
{
  week: number,
  range: string,        // e.g. "5–11 Aug"
  weight: number,       // kg
  note: string,         // max 280 chars
  scalePhoto: Image     // captured in step 1
}
```

### Feed Item
```
{
  participant: Participant,
  time: string,         // relative time
  week: number,
  weight: number,
  change: number,       // negative = loss
  note: string,
  scalePhoto: Image,
  reactions: { emoji: count }
}
```

### Weight Data (per participant)
```
{
  start: number,        // starting weight
  current: number,      // latest weight
  history: [{ week: number, weight: number }]
}
```

---

## Key Design Decisions
1. **Weight gain is never shown in red/orange** — always neutral (secondary text color). Green for loss only.
2. **No "Retake" button** on profile starting photos section.
3. **No back button** on participant profile — navigation via swipe or bottom nav.
4. **No tab highlighted** when viewing someone else's profile.
5. **Check-in flow is 2 steps** (photo + combined weight/note), not 3.
6. **Check-in opens Monday 12:00 AM AEST**, confirmed state shows for rest of Monday, then hidden until next Monday.
7. **Photos are "viewable by other participants"** — no lock icon.
8. **Avatar has edit icon** only on own profile, not on others'.

---

## Files
| File | Description |
|------|-------------|
| `Recomp Games UI.html` | Main design file — open in browser to see all screens |
| `recomp-shared.jsx` | Shared data, theme, and reusable components (Avatar, Button, Card, Nav, etc.) |
| `recomp-screens.jsx` | All screen components (Home, Check-In, Photos, Leaderboard, Profile, etc.) |
| `recomp-feed.jsx` | Activity Feed components (3 variations: List, Cards, Timeline) |
| `design-canvas.jsx` | Design canvas framework (presentation scaffolding, not part of the app) |
| `ios-frame.jsx` | iOS device frame (presentation scaffolding, not part of the app) |
| `tweaks-panel.jsx` | Tweaks panel (presentation scaffolding, not part of the app) |
