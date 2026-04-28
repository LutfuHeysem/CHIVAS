# Handoff: CHIVAS — Veterinary Management System

## Overview
CHIVAS (Central Health Inventory & Veterinary Appointment System) is a multi-role veterinary clinic management platform for the Turkish market. It serves three distinct user types — Pet Owners, Veterinarians, and Clinic Managers — each with their own dashboard, navigation, and feature set.

---

## About the Design Files
The file `CHIVAS Prototype.html` in this bundle is a **high-fidelity design reference created in HTML**. It is a prototype showing the intended look, navigation, and interactive behavior — **not production code to copy directly**. Your task is to **recreate these designs in your target codebase** (React, Next.js, Vue, etc.) using its established patterns, routing, and libraries, while matching the visual and interaction fidelity described below.

---

## Fidelity
**High-fidelity.** Colors, typography, spacing, component shapes, shadows, and interactions are all defined. The developer should aim for pixel-accurate recreation using the design tokens listed in this document.

---

## Authentication Flow

### Login Screen (`/login`)
**Layout:** Two-column full-viewport split. Left panel (~45% width): dark green brand panel. Right panel (~55%): form area.

**Left Panel (`.auth-side`)**
- Background: `linear-gradient(160deg, #1a5742 0%, #0f3d2e 100%)` with dot-grid overlay mask
- Brand mark: 40×40px rounded square (`border-radius: 12px`), `rgba(255,255,255,.12)` bg, 🐾 emoji
- Brand name: `Fraunces` serif, 24px, white
- Tagline headline: `Fraunces` serif, 48px, weight 400, white; italic part colored `#f4d8c9`
- Feature cards: `rgba(255,255,255,.05)` bg, `1px solid rgba(255,255,255,.08)` border, `border-radius: 14px`, `backdrop-filter: blur(8px)`

**Right Panel (`.auth-form-wrap`)**
- Background: `#f4f8f5`
- Centered form, max-width: 420px

**Role Selection (NEW — added to login)**
Three card buttons displayed in a 3-column grid before email/password fields:
- Default state: `border: 1.5px solid #d8e0db`, `background: white`, text `#5b6963`
- Active/selected state: `border-color: #2d7a5f`, `background: #f1f7f3`, `box-shadow: 0 0 0 3px rgba(45,122,95,.1)`
- Each card: emoji icon (18px) + label text (11.5px, weight 600)
- Roles: 🐾 Pet Owner · 🩺 Veterinarian · 📊 Manager

**Behavior:**
- Selecting a role card highlights it; only one can be active at a time
- On "Giriş yap" click → navigate to that role's dashboard, show correct sidebar nav, set user info in sidebar

**Tab switcher (Giriş / Kayıt):**
- Pill-style: `background: white`, `border: 1px solid #d8e0db`, `border-radius: 12px`, `padding: 4px`
- Active tab: `background: #226a52`, `color: white`, `border-radius: 8px`

---

## App Shell

### Sidebar
- Width: 272px, fixed/sticky, full viewport height
- Background: `linear-gradient(180deg, #1a5742 0%, #0f3d2e 100%)`
- Padding: 28px 18px

**Nav items:**
- Default: transparent bg, `color: #e3efe9`, `font-size: 13.5px`, `border-radius: 10px`, `padding: 10px 12px`
- Active: `background: rgba(255,255,255,.1)`, `color: white`, `border: 1px solid rgba(255,255,255,.08)`
- Hover: `background: rgba(255,255,255,.05)`

**Sidebar footer (user info):**
- Avatar: 32×32px circle, `linear-gradient(135deg, #d97757, #b89968)`
- User name: 13px white, weight 500
- Role label: 11px `#a3c8b6`

**No role switcher inside the app** — role is determined at login only.
Logout button at bottom of nav: simple button styled like a nav item.

### Main Content Area
- Left margin from sidebar (272px)
- Padding: `32px 40px 60px`
- Background: `#f4f8f5`

**Topbar:**
- Breadcrumb: `CHIVAS / {Role} / {Page}`, font-size 12px, `color: #5b6963`
- Action buttons (search, notifications, settings): 36×36px, `border-radius: 10px`, `border: 1px solid #d8e0db`, white bg

---

## Role: Pet Owner

### Pages
1. **Dashboard** (`owner-dashboard`) — Stats grid + appointments table + notifications
2. **My Pets** (`owner-pets`) — Pet profile cards grid
3. **Book Appointment** (`owner-book`) — Multi-step booking form + available vets list
4. **Medical History** (`owner-history`) — Timeline view of visit records
5. **Bills** (`owner-bills`) — Invoice list with plan discount display
6. **Health Plans** (`owner-plans`) — Pricing cards (Basic / Premium / VIP)
7. **Notifications** (`owner-notifications`) — Notification feed

### Stats Cards (`.stats-grid`, 4-column grid)
Each card: white bg, `border-radius: 14px`, `border: 1px solid #d8e0db`, `padding: 20px 22px`
Left accent stripe: 3px wide, full height
- Default stripe: `#3d8e72` (green)
- `.warm`: `#d97757` (orange)
- `.sky`: `#5a8aa8` (blue)
- `.gold`: `#b89968` (gold)

Stat value: `Fraunces` serif, 32px, weight 500
Stat label: 11px, uppercase, `letter-spacing: 0.1em`, `color: #5b6963`
Trend: 12px, weight 600, green for positive (`#3d8e72`), red for negative (`#b54848`)

### Pet Cards
Grid: 3 columns, `gap: 16px`
Card: white, `border-radius: 16px`, `border: 1px solid #d8e0db`, `padding: 20px`
Hover: `border-color: #2d7a5f`, `box-shadow: 0 4px 12px rgba(15,61,46,.06)`
Pet avatar: 52×52px, `border-radius: 16px`
- Dog: `linear-gradient(135deg, #f4d8c9, #e8b89a)`
- Cat: `linear-gradient(135deg, #e3efe9, #b8d6c5)`
- Bird: `linear-gradient(135deg, #f3e8d2, #ddc488)`

Meta grid: 2-column inside each card, `background: #f1f7f3`, `border-radius: 10px`, `padding: 12px`

### Health Plans (Pricing Cards)
3-column grid
- Current plan card: `border: 2px solid #2d7a5f`, green top gradient, shadow `0 8px 24px rgba(45,122,95,.12)`
- "Aktif Plan" badge: absolute positioned, centered on top border, `background: #226a52`, pill shape
- Price number: `Fraunces`, 48px, `color: #226a52`

### Medical History Timeline
Left timeline line: 2px, `linear-gradient(180deg, #a3c8b6, #d8e0db)`
Timeline dot: 14×14px circle, `border: 3px solid #2d7a5f`, white fill, outer glow `0 0 0 3px #f1f7f3`
Timeline card bg: `#f1f7f3`

---

## Role: Veterinarian

### Pages
1. **Today's Schedule** (`vet-dashboard`) — Daily appointments + patient header
2. **Patient Records** (`vet-patient`) — Detailed patient view with green hero header
3. **Prescriptions** (`vet-prescribe`) — Pending prescriptions table
4. **Vaccination Plans** (`vet-vaccinate`) — Active plan progress + new plan form
5. **Referrals** (`vet-referrals`) — Open referral cases

### Patient Header (Vet view)
Full-width banner: `linear-gradient(135deg, #1a5742, #226a52)`, `border-radius: 20px`, `padding: 28px 32px`
Decorative radial warm glow top-right: `rgba(217,119,87,.2)`
Patient avatar: 76×76px, `border-radius: 22px`, `rgba(255,255,255,.15)` bg, `backdrop-filter: blur(10px)`
Patient name: `Fraunces`, 30px, white
Stats inside banner: 3-column grid, `background: rgba(0,0,0,.15)`, `border-radius: 14px`

---

## Role: Clinic Manager

### Pages
1. **Manager Hub** (`manager-dashboard`) — KPI stats + branch performance bars + urgent actions
2. **Health Plan Analytics** (`manager-plans`) — Subscriber table + marketing targets
3. **Stock & Waste** (`manager-stock`) — Inventory table with stock meters
4. **Staff Management** (`manager-staff`) — Vet list with branch/rating data
5. **Reports** (`manager-reports`) — Report card grid + PDF export buttons

### Bar Chart (Branch Performance)
Custom bar: `height: 26px`, `border-radius: 6px`, `background: #f1f7f3`
Fill colors:
- Green: `linear-gradient(90deg, #2d7a5f, #3d8e72)`
- Warm/orange: `linear-gradient(90deg, #d97757, #e89274)`
- Gold: `linear-gradient(90deg, #b89968, #d4b682)`

### Stock Meter
Inline mini bar: `width: 80px`, `height: 6px`, `border-radius: 3px`, `background: #ecf1ee`
Fill: green `#3d8e72` (healthy), `#c98c2c` (warn), `#b54848` (critical)

---

## Design Tokens

### Colors
```
--green-900: #0f3d2e
--green-800: #1a5742
--green-700: #226a52
--green-600: #2d7a5f
--green-500: #3d8e72
--green-400: #6ba88f
--green-300: #a3c8b6
--green-100: #e3efe9
--green-50:  #f1f7f3

--ink-900: #0c1410
--ink-700: #2e3a34
--ink-500: #5b6963
--ink-400: #8a9690
--ink-300: #b8c3be
--ink-200: #d8e0db
--ink-100: #ecf1ee
--paper:   #f4f8f5
--white:   #ffffff

--warm:      #d97757
--warm-soft: #f4d8c9
--gold:      #b89968
--berry:     #8c3a52
--sky:       #5a8aa8
--sky-soft:  #d6e3eb

--ok:     #3d8e72
--warn:   #c98c2c
--danger: #b54848
```

### Typography
```
--display: 'Fraunces', Georgia, serif       /* headings, prices, names */
--body:    'Inter Tight', system-ui, sans-serif  /* all UI text */
--mono:    'JetBrains Mono', monospace      /* codes, IDs */
```

Recommended Google Fonts import:
```
Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700
Inter+Tight:wght@400;500;600;700
JetBrains+Mono:wght@400;500
```

### Spacing & Radius
```
--radius-sm: 8px
--radius-md: 14px
--radius-lg: 20px
--sidebar-w: 272px
```

### Shadows
```
--shadow-sm: 0 1px 2px rgba(15,61,46,.04), 0 1px 3px rgba(15,61,46,.06)
--shadow-md: 0 4px 12px rgba(15,61,46,.06), 0 2px 6px rgba(15,61,46,.04)
--shadow-lg: 0 12px 32px rgba(15,61,46,.08), 0 4px 12px rgba(15,61,46,.06)
```

### Pills / Badges
```
pill-green:  bg #e3efe9, color #1a5742
pill-warm:   bg #f4d8c9, color #8a3d20
pill-sky:    bg #d6e3eb, color #2c5670
pill-gold:   bg #f3e8d2, color #6a5328
pill-gray:   bg #ecf1ee, color #2e3a34
pill-danger: bg #f4dede, color #b54848
```
All pills: `border-radius: 999px`, `padding: 4px 10px`, `font-size: 11.5px`, `font-weight: 600`

---

## Interactions & Behavior

- **Login → App:** Selecting a role card + clicking "Giriş yap" routes to that role's main dashboard and activates the corresponding sidebar nav section
- **Logout:** "Çıkış yap" button in sidebar footer → returns to login screen
- **Page navigation:** Clicking sidebar nav items transitions content; active item highlighted; breadcrumb updates
- **Stat cards:** Subtle lift on hover (`transform: translateY(-2px)`, shadow increases)
- **Pet cards:** Border becomes green on hover
- **Page transitions:** `opacity 0→1` + `translateY(8px→0)`, duration ~300ms
- **Buttons hover:** Primary button lifts slightly (`translateY(-1px)`)
- **Tables:** Row background becomes `#f1f7f3` on hover

---

## Files in This Package
- `CHIVAS Prototype.html` — Full hi-fi interactive prototype (all screens, all roles)

---

## Language Note
The UI copy is in **Turkish**. All labels, buttons, and page titles should be **English** first and then optionally in Turkish.
