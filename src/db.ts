import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

// Types representing the database tables requested
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  password_hash: string;
  email_verified: boolean;
  verification_token?: string | null;
  reset_token?: string | null;
  reset_token_expiry?: number | null;
  is_admin: boolean;
  created_at: string;
}

export interface Order {
  id: number;
  user_id: number;
  payment_id: string; // Razorpay payment details
  razorpay_order_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  purchase_date: string;
}

export interface DownloadLog {
  id: number;
  user_id: number;
  file_name: string;
  downloaded_at: string;
}

export interface Testimonial {
  id: number;
  user_name: string;
  role: string;
  comment: string;
  rating: number; // 1-5
  approved: boolean;
  created_at: string;
}

export interface TimerConfig {
  timer_duration_hours: number;
  start_time: string; // ISO String of when timer was set / reset
  last_reset_date: string; // YYYY-MM-DD
}

export interface PricingConfig {
  amount: number; // default 199
  original_amount: number; // default 1999
}

export interface Booking {
  id: number;
  user_id: number;
  session_type: string; // 'coding', 'design', or 'resume'
  date_time: string;
  status: 'scheduled' | 'cancelled' | 'completed';
  created_at: string;
}

export interface SimulatedEmail {
  id: number;
  to: string;
  subject: string;
  html: string;
  code: string;
  sent_at: string;
}

// Manual UPI QR payment proof, reviewed by the admin before access is granted
export interface PaymentClaim {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  amount: number;
  utr?: string | null; // optional UPI transaction reference the buyer typed in
  screenshot: string; // base64 data URL of the payment screenshot
  status: 'pending' | 'approved' | 'rejected';
  admin_note?: string | null;
  submitted_at: string;
  reviewed_at?: string | null;
}

export interface UpiConfig {
  upi_id: string;
  qr_image: string; // base64 data URL, empty string until admin uploads one
}

// --- EDITABLE SITE CONTENT (admin-managed, reflected live on the public pages) ---
export interface FaqItem {
  q: string;
  a: string;
}

export interface PersonaCard {
  title: string;
  level: string;
  pain_point: string;
  gain: string;
}

export interface ToolkitItemContent {
  id: string;
  title: string;
  category: 'Manual' | 'Automation' | 'Templates' | 'Career';
  description: string;
}

export interface HomeContent {
  hero_tag: string;
  hero_title: string;
  hero_subtitle: string;
  faqs: FaqItem[];
  personas: PersonaCard[];
}

export interface ContactInfo {
  support_email: string;
  phone: string;
  address: string;
  website: string;
}

export interface SiteContent {
  home: HomeContent;
  toolkitItems: ToolkitItemContent[];
  contact: ContactInfo;
}

export interface PageView {
  id: number;
  session_id: string;
  user_id: number | null;
  path: string;
  started_at: string;
  duration_seconds: number;
}

export interface DatabaseSchema {
  users: User[];
  orders: Order[];
  downloads: DownloadLog[];
  testimonials: Testimonial[];
  timerConfig: TimerConfig;
  pricingConfig: PricingConfig;
  bookings?: Booking[];
  simulatedEmails?: SimulatedEmail[]; // Optional for backward compatibility with existing databases
  paymentClaims?: PaymentClaim[];
  upiConfig?: UpiConfig;
  siteContent?: SiteContent;
  pageViews?: PageView[];
}

const DB_FILE_PATH = path.join(process.cwd(), 'qa_interview_kit_db.json');

// Neon/Postgres connection — the whole app state is stored as a single JSONB
// blob (same shape this file always used in memory), so all the getX/saveX
// methods below stay untouched; only how that blob is loaded/saved changes.
const DATABASE_URL = process.env.DATABASE_URL || '';
const pool = DATABASE_URL
  ? new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : null;

// Initial baseline data for a clean launch
const initialDatabase: DatabaseSchema = {
  users: [
    {
      id: 1,
      name: "Admin User",
      email: "admin@qakit.com",
      // admin123 hashed with bcrypt
      password_hash: "$2b$10$s7pTBPFAZlvohkddGfTYj.f3cP.exbk.m5vHveHywdzir/sOKw0Ne",
      email_verified: true,
      is_admin: true,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      name: "John Doe",
      email: "john@example.com",
      // password123
      password_hash: "$2b$10$uNYQGm/xBeHaPZ74/uYoRuOagdsSvseOGNAU1UTvN3ENADi.mf46S",
      email_verified: true,
      is_admin: false,
      created_at: new Date().toISOString()
    }
  ],
  orders: [
    {
      id: 1,
      user_id: 2,
      payment_id: "pay_sample_123456",
      razorpay_order_id: "order_sample_123456",
      amount: 499,
      status: "completed",
      purchase_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  downloads: [
    {
      id: 1,
      user_id: 2,
      file_name: "manual_testing_notes_sample.pdf",
      downloaded_at: new Date().toISOString()
    }
  ],
  testimonials: [
    {
      id: 1,
      user_name: "Amit Sharma",
      role: "Associate QA Specialist at TCS",
      comment: "This kit is unbelievable! The Playwright and API testing sections are extremely precise and practically focused. Cleared my technical rounds in just 2 weeks!",
      rating: 5,
      approved: true,
      created_at: "2026-05-10T12:00:00Z"
    },
    {
      id: 2,
      user_name: "Sarah Jenkins",
      role: "QA Engineer at Cognizant",
      comment: "The 100+ interview questions cover almost everything! Test case templates saved me hours during practical interview assignments.",
      rating: 5,
      approved: true,
      created_at: "2026-05-15T14:30:00Z"
    },
    {
      id: 3,
      user_name: "Rohit Verma",
      role: "SDET-II at Flipkart",
      comment: "Highly structured. The Git, Jenkins, and CI/CD integration guide makes absolute sense for high-paying QA roles today.",
      rating: 5,
      approved: true,
      created_at: "2026-05-20T08:15:00Z"
    },
    {
      id: 4,
      user_name: "Priyanka Patel",
      role: "Junior QA Engineer",
      comment: "As a beginner transitioning into software testing, finding comprehensive notes on manual testing with real bug report examples saved my life.",
      rating: 4,
      approved: true,
      created_at: "2026-06-01T10:00:00Z"
    }
  ],
  timerConfig: {
    timer_duration_hours: 0.3333333333333333, // default 20 minutes (20/60)
    start_time: new Date().toISOString(),
    last_reset_date: new Date().toISOString().split('T')[0]
  },
  pricingConfig: {
    amount: 199,
    original_amount: 1999
  },
  bookings: [],
  paymentClaims: [],
  pageViews: [],
  upiConfig: {
    upi_id: "",
    qr_image: ""
  },
  siteContent: {
    home: {
      hero_tag: "Crack Your Software QA Rounds",
      hero_title: "The Ultimate QA Interview Kit",
      hero_subtitle: "Master software testing step-by-step. Access pristine notes, resume structures, bug report sheets, and 100+ curated code snippets matching senior tester recruitment bars.",
      faqs: [
        {
          q: "What is included inside this QA Interview Kit?",
          a: "The kit contains 13 detailed items, including Manual and API testing notes, automation scripts for Selenium/Java and Playwright/Typescript, Git cheatsheets, Jenkins pipelines, high-conversion resume layouts, bug reports models, spreadsheets, and 100+ interview Q&As."
        },
        {
          q: "How will I receive the notes and templates?",
          a: "Once payment is verified, you are immediately routed to your secure customer dashboard where you can single-click download individual PDF/Markdown notes or assemble all items into a single, comprehensive ZIP bundle."
        },
        {
          q: "Is standard payment secure?",
          a: "Yes! Rest assured, our checkout integrations operate over TLS using full encryption and standard verification matching international banking safety frameworks."
        },
        {
          q: "I am transitioning from manual to automation. Will this fit?",
          a: "Absolutely. We designed our SDET roadmap specifically to solve this gap, breaking down complex code models into simple, digestible guides with side-by-side Java and TypeScript equivalents."
        },
        {
          q: "What is your refund policy?",
          a: "We offer a 7-day, 100% money-back guarantee. If you are unsatisfied with the study kit depth, drop an email to support@qakit.com and we'll process your refund instantly."
        }
      ],
      personas: [
        {
          title: "Manual Functional Tester",
          level: "Entry to Mid Level",
          pain_point: "Feeling stuck in execution-only cycles, worried about manual roles being automated away, and struggling to decode complex codebases.",
          gain: "A step-by-step parallel roadmap bridging Java and TypeScript automation so you can effortlessly transition to writing script pipelines and command instant respect."
        },
        {
          title: "Junior SDET / QA Automation Engineer",
          level: "Mid Level",
          pain_point: "Drowning in flaky test suites, struggling with slow parallel runners, and unable to articulate advanced systems or observability concepts with authority.",
          gain: "High-tier patterns (Pact contract tests, Sentry alerts, Grafana logs, JWT security validation) that allow you to step into senior architect or lead roles."
        },
        {
          title: "Senior Lead / QA Process Manager",
          level: "Senior / Lead Architect",
          pain_point: "Building massive frameworks from scratch is tedious, and training manual teams on modern CI/CD or quality assurance automation takes too much time.",
          gain: "A complete library of battle-tested templates, Jenkins declarative pipelines, dynamic risk sheets, and ready-to-deploy blueprints to accelerate your engineering standards immediately."
        }
      ]
    },
    toolkitItems: [
      { id: "manual_notes", title: "Manual Testing & Scenario Designing", category: "Manual", description: "Deep-dive explanations on SDLC, STLC, Bug Life Cycle, Defect triage metrics, and comprehensive functional test designs." },
      { id: "programming_oop_notes", title: "Programming & OOP for Testers (Java/TS)", category: "Automation", description: "Tailored object-oriented instruction in Java and TypeScript: Abstraction, Polymorphism, Inheritance, Encapsulation, and collections handling." },
      { id: "api_notes", title: "API Testing & Postman Guides", category: "Automation", description: "Learn HTTP methods, response states, bearer authentication, chaining variable runs, and scripting automated JavaScript assertions." },
      { id: "selenium_notes", title: "Selenium UI Automation (Java)", category: "Automation", description: "Production-grade code blocks explaining WebDriver commands, sync wait types, custom locators, and dynamic interaction scripts." },
      { id: "playwright_notes", title: "Modern Playwright UI Automation (TS)", category: "Automation", description: "Clean automation guides covering auto-waits, page fixture configs, trace viewers, network mocks, and parallel grid orchestration." },
      { id: "framework_arch_notes", title: "Framework Architecture & POM Patterns", category: "Automation", description: "Master Page Object Model (POM), Singleton drivers, Factory pattern, Builder schemas, and clean architectural test-runners." },
      { id: "sql_notes", title: "SQL & Relational Database Verification", category: "Manual", description: "Select queries, inner/left outer joins, grouping filters, subqueries, table indexing, and database assertion checks." },
      { id: "git_notes", title: "Git & Version Control for Testers", category: "Manual", description: "Git commands, trunk-based branching, commit standards, resolving complex merge conflicts, and code review pull requests." },
      { id: "cicd_notes", title: "CI/CD Workflows & GitHub Actions", category: "Automation", description: "Configure modern GitHub workflows, declarative secrets management, parallel execution matrices, and Slack telemetry integrations." },
      { id: "performance_k6_notes", title: "Performance Testing with k6", category: "Automation", description: "JavaScript-based performance execution: Virtual Users (VUs), ramp-up/cooling phases, SLO thresholds, and dashboard metric pipes." },
      { id: "ai_testing_notes", title: "AI in Testing & Prompt Engineering", category: "Automation", description: "Leverage generative AI for test-case expansion, LLM prompt templates, response temperature validation, and self-healing test automation." },
      { id: "interview_qas", title: "100+ Curated Key Interview Q&As", category: "Career", description: "Complete database of actual QA & SDET interview questions with verified tactical answers covering OOP, CI/CD, k6, and architecture." },
      { id: "live_interviews", title: "1-on-1 Live Mock Practice", category: "Career", description: "Get 3 live, face-to-face virtual 1-on-1 mock interviews (60 mins each) with principal QA/SDET architects. Gain actionable scorecards, live coding critique, and direct resume review." }
    ],
    contact: {
      support_email: "support@qakit.com",
      phone: "",
      address: "",
      website: "https://qakit.com"
    }
  }
};

class FileDatabase {
  private cache: DatabaseSchema | null = null;
  private ready: Promise<void>;

  constructor() {
    this.ready = this.init();
  }

  // Resolves once the initial DB state has been loaded (from Postgres if
  // DATABASE_URL is set, otherwise from the local JSON file). server.ts awaits
  // this before accepting traffic so no request ever sees a half-initialized DB.
  public async waitUntilReady(): Promise<void> {
    await this.ready;
  }

  private async init() {
    if (pool) {
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS app_state (
            id INT PRIMARY KEY DEFAULT 1,
            data JSONB NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT now()
          )
        `);
        await pool.query(`
          CREATE TABLE IF NOT EXISTS app_state_backups (
            id SERIAL PRIMARY KEY,
            data JSONB NOT NULL,
            created_at TIMESTAMPTZ DEFAULT now()
          )
        `);

        const result = await pool.query('SELECT data FROM app_state WHERE id = 1');
        if (result.rows.length === 0) {
          // Fresh Neon database — seed it. If a local JSON file from a previous
          // (pre-Postgres) run exists, migrate its data in instead of the blank defaults.
          let seed = initialDatabase;
          if (fs.existsSync(DB_FILE_PATH)) {
            try {
              seed = JSON.parse(fs.readFileSync(DB_FILE_PATH, 'utf-8'));
              console.log("Migrated existing local qa_interview_kit_db.json into Neon on first boot.");
            } catch (_) { /* fall back to initialDatabase */ }
          }
          await pool.query('INSERT INTO app_state (id, data) VALUES (1, $1)', [JSON.stringify(seed)]);
          this.cache = seed;
        } else {
          this.cache = result.rows[0].data;
        }
        return;
      } catch (err) {
        console.error("Postgres (Neon) connection failed — falling back to local JSON file for this run.", err);
      }
    }

    // No DATABASE_URL configured, or Postgres was unreachable — fall back to the local file.
    try {
      if (!fs.existsSync(DB_FILE_PATH)) {
        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initialDatabase, null, 2), 'utf-8');
        this.cache = initialDatabase;
      } else {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        this.cache = JSON.parse(raw);
      }
    } catch (err) {
      console.error("Database initialization failed. Reverting to initial state in-memory.", err);
      this.cache = initialDatabase;
    }
  }

  private persist() {
    if (!this.cache) return;

    if (pool) {
      // Fire-and-forget upsert — callers of saveX()/write() are synchronous, matching
      // the original file-based behavior, so we don't block them on the network round-trip.
      pool.query(
        'INSERT INTO app_state (id, data, updated_at) VALUES (1, $1, now()) ON CONFLICT (id) DO UPDATE SET data = $1, updated_at = now()',
        [JSON.stringify(this.cache)]
      ).catch(err => console.error("Neon persistence failed:", err));
      return;
    }

    try {
      // Write to a temp file first, then rename over the real one — a rename is
      // atomic, so a crash or restart mid-write can never leave a corrupted/half-written DB file.
      const tempPath = `${DB_FILE_PATH}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.cache, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE_PATH);
    } catch (err) {
      console.error("Database persistence failed:", err);
    }
  }

  // Snapshots the current state for point-in-time recovery, pruning older
  // backups beyond `keep`. Safe to call on a timer — used by server.ts.
  public async backup(keep: number = 24) {
    if (!this.cache) return;

    if (pool) {
      try {
        await pool.query('INSERT INTO app_state_backups (data) VALUES ($1)', [JSON.stringify(this.cache)]);
        await pool.query(`
          DELETE FROM app_state_backups
          WHERE id IN (
            SELECT id FROM app_state_backups ORDER BY created_at DESC OFFSET $1
          )
        `, [keep]);
      } catch (err) {
        console.error("Neon backup snapshot failed:", err);
      }
      return;
    }

    try {
      if (!fs.existsSync(DB_FILE_PATH)) return;
      const backupsDir = path.join(process.cwd(), 'backups');
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
      }
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      fs.copyFileSync(DB_FILE_PATH, path.join(backupsDir, `db-${stamp}.json`));

      const files = fs.readdirSync(backupsDir)
        .filter(f => f.startsWith('db-') && f.endsWith('.json'))
        .sort();
      const excess = files.length - keep;
      if (excess > 0) {
        files.slice(0, excess).forEach(f => fs.unlinkSync(path.join(backupsDir, f)));
      }
    } catch (err) {
      console.error("Database backup failed:", err);
    }
  }

  // Read whole database
  public read(): DatabaseSchema {
    if (!this.cache) {
      // Synchronous fallback only hit if something reads before waitUntilReady() resolved
      this.cache = initialDatabase;
    }
    return this.cache!;
  }

  // Save/Replace whole database
  public write(data: DatabaseSchema) {
    this.cache = data;
    this.persist();
  }

  // Helper APIs mimic SQL methods
  public getUsers(): User[] {
    // Admin rights are strictly derived from ADMIN_EMAIL (single-admin lock) —
    // never trust a stored is_admin flag, so toggling it in the DB has no effect.
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
    const users = this.read().users;
    if (!adminEmail) return users;
    return users.map(u => ({ ...u, is_admin: u.email.toLowerCase() === adminEmail }));
  }

  public saveUser(user: User): User {
    const db = this.read();
    const existingIndex = db.users.findIndex(u => u.id === user.id);
    if (existingIndex > -1) {
      db.users[existingIndex] = user;
    } else {
      db.users.push(user);
    }
    this.write(db);
    return user;
  }

  // Removes a user and cascades cleanup across everything tied to them
  // (orders, downloads, bookings, payment claims) — a clean, complete deletion.
  public deleteUser(id: number): boolean {
    const db = this.read();
    const initialLen = db.users.length;
    db.users = db.users.filter(u => u.id !== id);
    if (db.users.length === initialLen) return false;

    db.orders = db.orders.filter(o => o.user_id !== id);
    db.downloads = db.downloads.filter(d => d.user_id !== id);
    if (db.bookings) db.bookings = db.bookings.filter(b => b.user_id !== id);
    if (db.paymentClaims) db.paymentClaims = db.paymentClaims.filter(c => c.user_id !== id);

    this.write(db);
    return true;
  }

  public getOrders(): Order[] {
    return this.read().orders;
  }

  public saveOrder(order: Order): Order {
    const db = this.read();
    const existingIndex = db.orders.findIndex(o => o.id === order.id);
    if (existingIndex > -1) {
      db.orders[existingIndex] = order;
    } else {
      db.orders.push(order);
    }
    this.write(db);
    return order;
  }

  public getDownloads(): DownloadLog[] {
    return this.read().downloads;
  }

  public saveDownload(download: DownloadLog): DownloadLog {
    const db = this.read();
    db.downloads.push(download);
    this.write(db);
    return download;
  }

  public getTestimonials(): Testimonial[] {
    return this.read().testimonials;
  }

  public saveTestimonial(testimonial: Testimonial): Testimonial {
    const db = this.read();
    const existingIndex = db.testimonials.findIndex(t => t.id === testimonial.id);
    if (existingIndex > -1) {
      db.testimonials[existingIndex] = testimonial;
    } else {
      db.testimonials.push(testimonial);
    }
    this.write(db);
    return testimonial;
  }

  public deleteTestimonial(id: number): boolean {
    const db = this.read();
    const initialLen = db.testimonials.length;
    db.testimonials = db.testimonials.filter(t => t.id !== id);
    if (db.testimonials.length !== initialLen) {
      this.write(db);
      return true;
    }
    return false;
  }

  public getTimerConfig(): TimerConfig {
    const db = this.read();
    // Ensure timer always defaults to 20 minutes (0.3333333333333333 hours)
    if (db.timerConfig.timer_duration_hours === 1) {
      db.timerConfig.timer_duration_hours = 0.3333333333333333;
      this.write(db);
    }
    // Daily reset check from backend
    const todayStr = new Date().toISOString().split('T')[0];
    if (db.timerConfig.last_reset_date !== todayStr) {
      db.timerConfig.last_reset_date = todayStr;
      db.timerConfig.start_time = new Date().toISOString();
      this.write(db);
    }
    return db.timerConfig;
  }

  public updateTimerConfig(durationHours: number) {
    const db = this.read();
    db.timerConfig.timer_duration_hours = durationHours;
    db.timerConfig.start_time = new Date().toISOString();
    db.timerConfig.last_reset_date = new Date().toISOString().split('T')[0];
    this.write(db);
    return db.timerConfig;
  }

  public getPricingConfig(): PricingConfig {
    return this.read().pricingConfig;
  }

  public updatePricingConfig(amount: number, original_amount: number) {
    const db = this.read();
    db.pricingConfig.amount = amount;
    db.pricingConfig.original_amount = original_amount;
    this.write(db);
    return db.pricingConfig;
  }

  public getSimulatedEmails(): SimulatedEmail[] {
    const db = this.read();
    if (!db.simulatedEmails) {
      db.simulatedEmails = [];
    }
    return db.simulatedEmails;
  }

  public saveSimulatedEmail(email: SimulatedEmail): SimulatedEmail {
    const db = this.read();
    if (!db.simulatedEmails) {
      db.simulatedEmails = [];
    }
    db.simulatedEmails.push(email);
    if (db.simulatedEmails.length > 40) {
      db.simulatedEmails = db.simulatedEmails.slice(-40);
    }
    this.write(db);
    return email;
  }

  public getBookings(userId?: number): Booking[] {
    const db = this.read();
    if (!db.bookings) {
      db.bookings = [];
    }
    if (userId !== undefined) {
      return db.bookings.filter(b => b.user_id === userId);
    }
    return db.bookings;
  }

  public saveBooking(booking: Booking): Booking {
    const db = this.read();
    if (!db.bookings) {
      db.bookings = [];
    }
    const idx = db.bookings.findIndex(b => b.id === booking.id);
    if (idx !== -1) {
      db.bookings[idx] = booking;
    } else {
      db.bookings.push(booking);
    }
    this.write(db);
    return booking;
  }

  public getPaymentClaims(userId?: number): PaymentClaim[] {
    const db = this.read();
    if (!db.paymentClaims) {
      db.paymentClaims = [];
    }
    if (userId !== undefined) {
      return db.paymentClaims.filter(c => c.user_id === userId);
    }
    return db.paymentClaims;
  }

  public savePaymentClaim(claim: PaymentClaim): PaymentClaim {
    const db = this.read();
    if (!db.paymentClaims) {
      db.paymentClaims = [];
    }
    const idx = db.paymentClaims.findIndex(c => c.id === claim.id);
    if (idx !== -1) {
      db.paymentClaims[idx] = claim;
    } else {
      db.paymentClaims.push(claim);
    }
    this.write(db);
    return claim;
  }

  public getUpiConfig(): UpiConfig {
    const db = this.read();
    if (!db.upiConfig) {
      db.upiConfig = { upi_id: "", qr_image: "" };
      this.write(db);
    }
    return db.upiConfig;
  }

  public updateUpiConfig(upi_id: string, qr_image: string): UpiConfig {
    const db = this.read();
    db.upiConfig = { upi_id, qr_image };
    this.write(db);
    return db.upiConfig;
  }

  public getSiteContent(): SiteContent {
    const db = this.read();
    if (!db.siteContent) {
      db.siteContent = initialDatabase.siteContent;
      this.write(db);
    }
    return db.siteContent!;
  }

  public updateSiteContent(partial: Partial<SiteContent>): SiteContent {
    const db = this.read();
    const current = db.siteContent || initialDatabase.siteContent!;
    db.siteContent = {
      home: partial.home ? { ...current.home, ...partial.home } : current.home,
      toolkitItems: partial.toolkitItems || current.toolkitItems,
      contact: partial.contact ? { ...current.contact, ...partial.contact } : current.contact
    };
    this.write(db);
    return db.siteContent;
  }

  public getPageViews(): PageView[] {
    return this.read().pageViews || [];
  }

  public savePageView(view: PageView): PageView {
    const db = this.read();
    if (!db.pageViews) db.pageViews = [];
    db.pageViews.push(view);
    // Cap stored history so the JSON file doesn't grow unbounded over time
    if (db.pageViews.length > 5000) {
      db.pageViews = db.pageViews.slice(-5000);
    }
    this.write(db);
    return view;
  }
}

export const dbService = new FileDatabase();
