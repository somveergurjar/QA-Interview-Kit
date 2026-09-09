# QA Interview Kit - Modern Sales Platform

Crack your software testing rounds with style! The **QA Interview Kit** selling platform is a high-performance full-stack web application designed to present, highlight, promote, sell, and deliver an elite study kit for manual/automated QA candidates transitioning into SDET-rich engineering roles.

**Active Live Preview URL**: `https://qakit.com`

---

## 🎨 Design Concept & Aesthetic Mood

- **Theme Mode**: Unified high-contrast Light & Slate Dark theme switcher.
- **Color Scales**: Rich Emerald accents (`#10b981`) paired with Indigo highlights (`#6366f1`) and soft off-white/deep anthracite backgrounds representing modern SaaS portals.
- **Bento Card Rhythm**: Cards detailing kit contents animate gracefully with hover translates and subtle background glares.
- **User Trust Focus**: Transparent countdown timers highlighting the ₹199 price drops, interactive FAQ collapsibles, and verified corporate testimonials.

---

## 🛠️ Unified Full-Stack Architecture

Unlike complex distributed networks that crash during network timeouts, this platform operates on a single-port model where Express servers handle both backend endpoints and serve the compiled React SPA.

### 📁 Technical Blueprint directory

- `/server.ts` - Unified Express entry-point compiling automatically to `/dist/server.cjs` via `esbuild`. Handles routing, session checks, and Razorpay integrations.
- `/src/App.tsx` - Main Client state manager, page router listen, and modal triggers.
- `/src/db.ts` - Robust transaction-safe, synchronous local JSON database implementing relational mimics (Users, Orders, Downloads, Testimonials, Timer Configurations).
- `/src/types.ts` - Standard TypeScript typing structures.
- `/src/components/*` - Split, modular, token-safe React sub-components:
  - `Navbar.tsx` - Responsive menu triggers.
  - `Footer.tsx` - Legal terms, Privacy statements, and Refund policies.
  - `HomeView.tsx` - Promo timer, test form submitters, and landing grids.
  - `SampleNotesView.tsx` - Free preview paragraphs with premium blurs.
  - `DashboardView.tsx` - Active downloads histories and file compilations.
  - `AdminView.tsx` - KPI Cards, sales metrics, and testimonial review boards.
  - `RazorpayModal.tsx` - Interactive Razorpay Payment-Gateway simulator.

---

## 🔐 Administrative Staff Logins

Administrators can configure timer constraints, adjust prices, edit candidate test submissions, and view sales details.

- **Admin Login email**: `admin@qakit.com`
- **Password**: `admin123`

---

## ⚡ Setup & Local Execution Guide

### Prerequisite Checklist
- **Node.js**: Version 18.x or newer
- **NPM Package Manager**

### 1. Close Dev Server & Install Packages
```bash
npm install
```

### 2. Configure Environment variables
Duplicate `.env.example` as `.env` and set parameters:
```env
JWT_SECRET="qa_custom_token_signing_secret_2026"
# Leave Razorpay credentials blank to activate simulated sandbox transaction mode!
RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""
```

### 3. Start Development Mode
```bash
npm run dev
```
The server will boot up at `http://localhost:3000`.

---

## 🐳 Container Docker Deployments

Construct local light images:
```bash
docker build -t qa-interview-kit .
docker run -p 3000:3000 qa-interview-kit
```

---

## 🚀 Cloud Providers Shipping Configurations

### Railway / Render / Caprover (Recommended for Node)
This stack features continuous integration files ready for Railway and Render immediately.
1. Connect your Github Repository.
2. Railway and Render will evaluate the root folder, parsing the `start` and `build` commands automatically inside our package specifications.
3. Configure your production environment variables (`JWT_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`).

---

## 🔒 Security Operations
- **Secure Hashing**: Password lines hashed utilizing `bcryptjs` with 10 salt rounds.
- **XSS & SQL Isolation**: Parameterized JSON queries prevent script injections and route hijackings entirely.
- **Simulators Isolation**: Complete decoupling of sandbox payment processes from production-grade secrets, giving double-blind sandbox safety checks during system reviews!
