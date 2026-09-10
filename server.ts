import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import AdmZip from 'adm-zip';
import nodemailer from 'nodemailer';
import { createServer as createViteServer } from 'vite';
import { dbService, User, Order, DownloadLog, Testimonial, SimulatedEmail, PaymentClaim, SiteContent } from './src/db.js';

// Load Env variables explicitly
import dotenv from 'dotenv';
dotenv.config();

const app = express();
// Render assigns its own port via process.env.PORT — must not be hardcoded for deploy to work.
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'qa_toolkit_super_secret_for_signing_jwts_2026';

// Frontend (Vercel) and backend (Render) live on different origins once split —
// CORS_ORIGIN accepts a comma-separated list of allowed frontend URLs.
// Falls back to allow-all so local dev / same-origin deploys keep working with no setup.
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(o => o.trim()).filter(Boolean);
app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  credentials: true
}));

app.use(express.json({ limit: '8mb' })); // payment screenshots travel as base64 JSON

// Helper function to create standard logs safely
function dlog(message: string) {
  console.log(`[QA Toolkit Express] ${new Date().toISOString()} - ${message}`);
}

// Ensure database state fits what represents
dlog("Initializing database service...");

// --- EMAIL DISPATCH SYSTEM (REAL delivery ONLY — no code is ever returned to the client) ---
// Splits "Name <email@domain.com>" into parts for Brevo's sender object; falls back
// to treating the whole string as the email if there's no "Name <...>" wrapping.
function parseFromAddress(from: string): { name: string; email: string } {
  const match = from.match(/^(.*?)\s*<(.+)>$/);
  if (match) {
    return { name: match[1].trim().replace(/^"|"$/g, '') || 'QA Interview Kit', email: match[2].trim() };
  }
  return { name: 'QA Interview Kit', email: from.trim() };
}

// Brevo's HTTP API (api-key auth) — used when BREVO_API_KEY is set. Unlike SMTP AUTH,
// it isn't blocked by Brevo's IP-anti-abuse system, so it works from hosts with shared/
// dynamic outbound IPs (e.g. Render's free tier) where SMTP login gets rejected.
async function sendViaBrevoApi(to: string, subject: string, textContent: string, htmlContent: string): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY!;
  const from = process.env.SMTP_FROM || 'QA Interview Kit <no-reply@qakit.com>';
  const sender = parseFromAddress(from);

  try {
    dlog(`Dispatching mail to ${to} via Brevo HTTP API...`);
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        sender,
        to: [{ email: to }],
        subject,
        textContent,
        htmlContent
      })
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.error(`Brevo API failed to dispatch mail to ${to}: ${res.status} ${errBody}`);
      return false;
    }
    dlog(`Email dispatched successfully to ${to} (via Brevo API)`);
    return true;
  } catch (apiErr) {
    console.error(`Brevo API request failed for ${to}:`, apiErr);
    return false;
  }
}

// SendGrid's HTTP API (api-key auth) — no IP-allowlist restriction at all, unlike Brevo.
// Used when SENDGRID_API_KEY is set; takes priority over Brevo/SMTP.
async function sendViaSendGrid(to: string, subject: string, textContent: string, htmlContent: string): Promise<boolean> {
  const apiKey = process.env.SENDGRID_API_KEY!;
  const from = process.env.SMTP_FROM || 'QA Interview Kit <no-reply@qakit.com>';
  const sender = parseFromAddress(from);

  try {
    dlog(`Dispatching mail to ${to} via SendGrid HTTP API...`);
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: sender.email, name: sender.name },
        subject,
        content: [
          { type: 'text/plain', value: textContent },
          { type: 'text/html', value: htmlContent }
        ]
      })
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.error(`SendGrid API failed to dispatch mail to ${to}: ${res.status} ${errBody}`);
      return false;
    }
    dlog(`Email dispatched successfully to ${to} (via SendGrid API)`);
    return true;
  } catch (apiErr) {
    console.error(`SendGrid API request failed for ${to}:`, apiErr);
    return false;
  }
}

async function sendViaSmtp(to: string, subject: string, textContent: string, htmlContent: string): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'QA Interview Kit <no-reply@qakit.com>';

  if (!host || !user || !pass) {
    dlog(`SMTP is not configured (SMTP_HOST/SMTP_USER/SMTP_PASS missing in .env) — cannot dispatch mail to ${to}.`);
    return false;
  }

  try {
    dlog(`Dispatching mail to ${to} via ${host}:${port}...`);
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass
      }
    });

    await transporter.sendMail({
      from,
      to,
      subject,
      text: textContent,
      html: htmlContent
    });
    dlog(`Email dispatched successfully to ${to}`);
    return true;
  } catch (smtpErr) {
    console.error(`Nodemailer failed to dispatch mail to ${to}:`, smtpErr);
    return false;
  }
}

// Tries SendGrid first (no IP-allowlist restriction), then Brevo's API, then raw SMTP.
async function sendMailHelper(to: string, subject: string, textContent: string, htmlContent: string, code: string) {
  if (process.env.SENDGRID_API_KEY) {
    return sendViaSendGrid(to, subject, textContent, htmlContent);
  }
  if (process.env.BREVO_API_KEY) {
    return sendViaBrevoApi(to, subject, textContent, htmlContent);
  }
  return sendViaSmtp(to, subject, textContent, htmlContent);
}

async function sendVerificationEmail(toEmail: string, code: string, name: string) {
  const subject = `🔐 ${code} is your QA Interview Kit Activation Code`;
  const textContent = `Hello ${name},\n\nThank you for signing up for the QA Interview Kit! Use verification code ${code} to complete activation.\n\nBest wishes,\nThe QA Kit Team`;
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 550px; margin: 0 auto; padding: 25px; border: 1px solid #eef2f6; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 25px;">
        <span style="font-size: 26px; font-weight: bold; color: #10b981; letter-spacing: -0.5px;">QA Interview Kit</span>
      </div>
      <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-top: 0;">Activate Your Premium Dashboard</h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.5;">Hi <strong>${name}</strong>,</p>
      <p style="color: #475569; font-size: 14px; line-height: 1.5;">Thank you for registering. To confirm your identity and complete your login activation, please verify with the 6-digit verification code below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="display: inline-block; font-family: monospace; font-size: 32px; font-weight: 800; color: #10b981; letter-spacing: 6px; background-color: #f0fdf4; padding: 12px 28px; border-radius: 8px; border: 1px solid #bfe1ce;">${code}</span>
      </div>
      <p style="color: #ef4444; font-size: 12px; font-weight: bold; background-color: #fef2f2; padding: 8px 12px; border-radius: 6px;">NOTE: If you did not request this code, please safely ignore this communication.</p>
      <hr style="border: 0; border-top: 1px solid #eef2f6; margin: 25px 0;" />
      <span style="color: #94a3b8; font-size: 11px; display: block; text-align: center;">QA Interview Kit Masterclass © 2026. All rights reserved.</span>
    </div>
  `;
  return sendMailHelper(toEmail, subject, textContent, htmlContent, code);
}

async function sendPasswordRecoveryEmail(toEmail: string, code: string, name: string) {
  const subject = `🔑 ${code} is your QA Interview Kit Recovery Token`;
  const textContent = `Hello ${name},\n\nWe received a password reset request. Use recovery token ${code} to build a new secure password.\n\nBest regards,\nQA Kit Administration`;
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 550px; margin: 0 auto; padding: 25px; border: 1px solid #eef2f6; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 25px;">
        <span style="font-size: 26px; font-weight: bold; color: #4338ca; letter-spacing: -0.5px;">QA Interview Kit</span>
      </div>
      <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-top: 0;">Reset Your Password</h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.5;">Hi <strong>${name}</strong>,</p>
      <p style="color: #475569; font-size: 14px; line-height: 1.5;">We received a password recovery request for your SDET account. Enter the 6-digit verification code below to establish a new password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="display: inline-block; font-family: monospace; font-size: 32px; font-weight: 800; color: #4338ca; letter-spacing: 6px; background-color: #eef2ff; padding: 12px 28px; border-radius: 8px; border: 1px solid #c7d2fe;">${code}</span>
      </div>
      <p style="color: #64748b; font-size: 12px;">This code expires in 30 minutes. If you didn't trigger this password change request, please ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #eef2f6; margin: 25px 0;" />
      <span style="color: #94a3b8; font-size: 11px; display: block; text-align: center;">QA Interview Kit Masterclass © 2026. All rights reserved.</span>
    </div>
  `;
  return sendMailHelper(toEmail, subject, textContent, htmlContent, code);
}

async function sendPaymentRejectedEmail(toEmail: string, name: string, reason: string) {
  const subject = `⚠️ Your QA Interview Kit Payment Proof Was Not Verified`;
  const textContent = `Hello ${name},\n\nWe reviewed the payment screenshot you submitted, but we could not verify it. Reason: ${reason}\n\nPlease log back in and resubmit a clear screenshot of your successful payment (with the amount and transaction reference visible) to get your access unlocked.\n\nBest regards,\nQA Kit Administration`;
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 550px; margin: 0 auto; padding: 25px; border: 1px solid #eef2f6; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 25px;">
        <span style="font-size: 26px; font-weight: bold; color: #10b981; letter-spacing: -0.5px;">QA Interview Kit</span>
      </div>
      <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-top: 0;">Payment Proof Could Not Be Verified</h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.5;">Hi <strong>${name}</strong>,</p>
      <p style="color: #475569; font-size: 14px; line-height: 1.5;">We reviewed the payment screenshot you submitted for the QA Interview Kit, but unfortunately we were not able to verify it.</p>
      <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px 16px; margin: 20px 0;">
        <span style="display: block; font-size: 11px; font-weight: 700; color: #b91c1c; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Reason</span>
        <span style="color: #7f1d1d; font-size: 14px;">${reason}</span>
      </div>
      <p style="color: #475569; font-size: 14px; line-height: 1.5;">Please log back in to your dashboard and resubmit a clear screenshot of your successful payment (with the amount and transaction reference visible) — your access will unlock as soon as it's verified.</p>
      <hr style="border: 0; border-top: 1px solid #eef2f6; margin: 25px 0;" />
      <span style="color: #94a3b8; font-size: 11px; display: block; text-align: center;">QA Interview Kit Masterclass © 2026. All rights reserved.</span>
    </div>
  `;
  return sendMailHelper(toEmail, subject, textContent, htmlContent, '');
}

// --- AUTHENTICATION MIDDLEWARE ---
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    is_admin: boolean;
  };
}

function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Access denied. Generic authorization token required.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; is_admin: boolean };
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ message: 'Session expired or token is invalid. Please log in again.' });
  }
}

function adminOnly(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || !req.user.is_admin) {
    res.status(403).json({ message: 'Access restricted to administrators only.' });
    return;
  }
  next();
}

// --- TOOLKIT DOCUMENT CONTENT REPOSITORY (Dynamic Text/Markdown representation) ---
const TOOLKIT_DOCUMENTS: Record<string, { title: string; filename: string; content: string }> = {
  manual_notes: {
    title: "Manual Testing Masterclass Notes",
    filename: "manual_testing_notes.md",
    content: `# MANUAL TESTING MASTERCLASS NOTES

## 1. Fundamentals of Software Testing
Software testing is the process of evaluating and verifying that a software application or system decides whether it meets the business requirements and functions as expected.

## 2. SDLC (Software Development Life Cycle) vs STLC (Software Testing Life Cycle)
- **SDLC**: Requirement Analysis -> Design -> Coding -> Testing -> Deployment -> Maintenance.
- **STLC**: Requirement Analysis -> Test Planning -> Test Case Development -> Test Environment Setup -> Test Execution -> Test Cycle Closure.

## 3. White Box vs Black Box vs Gray Box Testing
- **Black Box**: Testing the software's functionality without knowing the internal code structure. High user-centric perspective.
- **White Box**: Testing internal structures, structural algorithms, branch coverage, and code blocks.
- **Gray Box**: Joint testing with limited knowledge of inside code blocks or databases.

## 4. Test Harnesses & Bug Life Cycle
- **Status workflow**: New -> Open -> Assigned -> In Progress -> Fixed -> Retested -> Reopened or Closed.
- **Severity**: Critical, Major, Medium, Minor.
- **Priority**: High, Medium, Low.
`
  },
  api_notes: {
    title: "API Testing & Postman Notes",
    filename: "api_testing_notes.md",
    content: `# API TESTING AND POSTMAN MASTERCLASS

## 1. Introduction to Web Services
APIs allow disparate services to securely communicate. REST (Representational State Transfer) is the dominant architecture, utilizing HTTP structures:
- **GET**: Fetch information.
- **POST**: Create resources.
- **PUT**: Fully replace resources.
- **PATCH**: Partial update of resources.
- **DELETE**: Wipe resources.

## 2. HTTP Anatomy
- **Request Headers**: Content-Type, Accept, Authorization (OAuth 2.0 / Bearer).
- **Status Codes**:
  - **2xx Success**: 200 OK, 201 Created, 204 No Content.
  - **3xx Redirects**: 301 Permanent, 302 Found.
  - **4xx Client Errors**: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found.
  - **5xx Server Errors**: 500 Internal Error, 502 Bad Gateway, 503 Service Unavailable.

## 3. Automation using Postman Scripts
Postman allows writing Javascript tests matching assertions:
\`\`\`javascript
pm.test("Status code is 200 OK", function () {
    pm.response.to.have.status(200);
});
pm.test("Return body has token", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("token");
});
\`\`\`
`
  },
  selenium_notes: {
    title: "Selenium with Java Guide",
    filename: "selenium_java_notes.md",
    content: `# SELENIUM JAVA FOR PRODUCTION AUTOMATION

## 1. Selenium WebDriver Architecture
Selenium is an automation suite interacting directly with browsers using W3C WebDriver specification.

## 2. Locator Strategies
Locators identify unique DOM objects:
- **ID**: \`By.id("username")\`
- **XPath**: \`By.xpath("\/\/input[@name='email']")\`
- **CSS Selector**: \`By.cssSelector("button.btn-primary")\`
- **Relative XPath rules**: \`\/\/tag[@attribute='value']\` or \`\/\/*[contains(text(),'Access')]\`

## 3. Synchronization (Waits)
Never use \`Thread.sleep()\`!
- **Implicit Wait**: Global wait for all elements across the driver instance context.
- **Explicit Wait**: ExpectedCondition logic matching state matches (visibility, clickability).
  \`\`\`java
  WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
  WebElement element = wait.until(ExpectedConditions.elementToBeClickable(By.id("buy-now")));
  \`\`\`

## 4. Page Object Model (POM) Design Pattern
POM groups webpage elements and custom actions inside dedicated class modules:
\`\`\`java
public class LoginPage {
    WebDriver driver;
    @FindBy(id = "user") WebElement userInput;
    
    public LoginPage(WebDriver driver) {
        this.driver = driver;
        PageFactory.initElements(driver, this);
    }
}
\`\`\`
`
  },
  playwright_notes: {
    title: "Modern Playwright automation notes",
    filename: "playwright_notes.md",
    content: `# PLAYWRIGHT MODERN WEB TESTING NOTES

## 1. Why Playwright?
Playwright is an open-source automation library designed specifically for modern web apps. It features auto-awaiting, parallel isolated test contexts, and zero configuration setup.

## 2. Core Concepts
- **Playwright Test Runner**: Command line interface running tests inside browser engines (Chromium, Firefox, WebKit).
- **Browser Contexts**: Isolated virtual profiles created per-test without browser reboot overhead. Completely isolates state, cookies, and localStorage.

## 3. Writing Assertions with Auto-Await
\`\`\`typescript
import { test, expect } from '@playwright\/test';

test('has premium access flow', async ({ page }) => {
  await page.goto('https:\/\/qakit.com\/');
  const buyBtn = page.locator('#buy-now-btn');
  await expect(buyBtn).toBeVisible();
  await buyBtn.click();
});
\`\`\`

## 4. API Testing Integration
Playwright handles fetch queries natively:
\`\`\`typescript
const response = await request.post('\/api\/auth\/login', {
  data: { email: 'user@example.com', password: 'password123' }
});
expect(response.ok()).toBeTruthy();
\`\`\`
`
  },
  sql_notes: {
    title: "SQL Mastery for QA Engineers",
    filename: "sql_notes.md",
    content: `# SQL CHAMPION NOTES FOR DATABASE VERIFICATION

## 1. Relational Database Concepts
Databases utilize tables with strict primary or foreign key connections.

## 2. Structured Queries
- **SELECT SELECTOR**: \`SELECT name, email FROM users WHERE email_verified = true ORDER BY created_at DESC;\`
- **JOINS**: Connect records.
  - **INNER JOIN**: Shared records match both tables.
  - **LEFT JOIN**: Complete left table plus active matches from right table.
  \`\`\`sql
  SELECT o.id, u.name, o.amount, o.status 
  FROM orders o 
  INNER JOIN users u ON o.user_id = u.id;
  \`\`\`

## 3. Grouping and Aggregates
- \`SELECT COUNT(*), status FROM orders GROUP BY status;\`
- \`SELECT SUM(amount) FROM orders WHERE status = 'completed';\`
`
  },
  git_notes: {
    title: "Git & Version Control for Testers Handbook",
    filename: "git_and_version_control.md",
    content: `# GIT & VERSION CONTROL FOR TEST CONTEXTUAL INTEGRITY

## 1. Git Testing Architecture
- **Working space**: Active files under change.
- **Staging area**: Manifest index storing what goes into the next commit snapshot.
- **Local git index**: Committed history timeline on your machine.
- **Remote workspace (GitHub)**: Shared tracking repository ensuring synchronization.

## 2. Dynamic Commands Checklist
- \`git init\`: Setup a clean workspace.
- \`git checkout -b feature-automation-k6-load\`: Spawn branch.
- \`git commit -am "test: write load thresholds inside k6 scripts"\`: Index and save changes.
- \`git cherry-pick <commit-id>\`: Extract precise fix commit into current test run.
- \`git stash push -m "temp-notes"\`: Save ongoing work to jump onto emergency testing.

## 3. Advanced Merge Conflict Resolution
Conflicts happen when concurrent developers change identical lines.
- Run \`git merge origin-main\`.
- Look for markers:
  \`\`\`
  <<<<<<< HEAD
  await page.locator('#username-input').fill('admin');
  =======
  await page.getByPlaceholder('Enter credentials').fill('admin');
  >>>>>>> origin-main
  \`\`\`
- Edit manual lines, keep the valid locator strategy, clean up markers, run \`git add\` and commit.
`
  },
  programming_oop_notes: {
    title: "Programming & OOP for Testers",
    filename: "oop_for_testers.md",
    content: `# OBJECT-ORIENTED PROGRAMMING FOR TEST AUTOMATION

## 1. What is OOP in Test Frameworks?
OOP is the structural paradigm enabling code reusability, modularity, and easy locator maintenance. In testing, we leverage:

- **Encapsulation**: Private page locators hidden from test scripts, accessed only via public action methods:
  \`\`\`typescript
  // TypeScript Encapsulation
  export class LoginPage {
    private usernameField = '#user';
    
    async enterUsername(username: string) {
      await page.fill(this.usernameField, username);
    }
  }
  \`\`\`

- **Inheritance**: Base page and baseline test classes holding common setups:
  \`\`\`java
  // Java Inheritance
  public class BaseTest {
      protected WebDriver driver;
      @BeforeMethod
      public void setUp() {
          driver = new ChromeDriver();
      }
  }
  public class LoginTest extends BaseTest {
      @Test
      public void testAccess() {
          driver.get("https://hospital.com");
      }
  }
  \`\`\`

- **Abstraction**: Packaging locator lookups inside simple human-facing methods:
  \`\`\`typescript
  // Test reads as natural actions
  await loginPage.loginUser('admin', 'password123');
  \`\`\`

- **Polymorphism**: Dynamic drivers running tests across different machines using the same interface methods:
  \`\`\`java
  WebDriver driver = new ChromeDriver(); // OR new FirefoxDriver()
  driver.findElement(By.id("btn")); // Polymorphic method call
  \`\`\`
`
  },
  framework_arch_notes: {
    title: "Framework Architecture & POM Patterns Notes",
    filename: "framework_architecture_pom.md",
    content: `# BATTLE-TESTED TEST AUTOMATION FRAMEWORK ARCHITECTURE

## 1. Page Object Model (POM) Design
POM isolates raw HTML selectors from your testing assertions. It houses logical actions inside dedicated page classes to keep tests clean:

\`\`\`
[ Test Script ] ---> calls ---> [ Page Class (Locators & Actions) ]
                      |
                   interacts
                      v
          [ Application Web GUI ]
\`\`\`

## 2. Thread-Safe Driver Singleton Pattern
To run parallel UI suites concurrently without state collisions, leverage ThreadLocal in Java or separate Context workers in Playwright:

\`\`\`java
public class DriverFactory {
    private static ThreadLocal<WebDriver> driver = new ThreadLocal<>();

    public static WebDriver getDriver() {
        return driver.get();
    }

    public static void setDriver(WebDriver webDriver) {
        driver.set(webDriver);
    }
}
\`\`\`

## 3. Dynamic Factory and Builder Patterns
- **Factory Pattern**: Delivers browser drivers based on target environmental parameters.
- **Builder Pattern**: Sets up modular user mock accounts cleanly:
  \`\`\`typescript
  const mockUser = new UserBuilder()
    .withVerifiedEmail()
    .hasActivePremium()
    .build();
  \`\`\`
`
  },
  cicd_notes: {
    title: "CI-CD Orchestration & GitHub Actions Manual",
    filename: "github_actions_cicd.md",
    content: `# CI-CD WORKFLOW RUNNERS WITH GITHUB ACTIONS

## 1. What is CI-CD for QA?
Ensures regression suites run autonomously on every git push or pull request, preventing broken features from landing in production.

## 2. Production GitHub Actions Blueprint
Create this YAML pipeline under \`.github\/workflows\/regression-test.yml\`:

\`\`\`yaml
name: Core Regression Automation Suites
on:
  push:
    branches: [ main, staging ]
  pull_request:
    branches: [ main ]

jobs:
  automation-runs:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
        browser: [chromium, firefox]
    steps:
      - name: Checkout Source Code
        uses: actions\/checkout@v4

      - name: Initialize Node Environment
        uses: actions\/setup-node@v4
        with:
          node-version: \`\${{ matrix.node-version }}\`

      - name: Install System Dependencies
        run: npm ci

      - name: Install Browser Engines
        run: npx playwright install --with-deps

      - name: Execute End-to-End Test Engine
        run: npm run test:e2e
        env:
          TEST_ENV: production
          API_KEY_SECRET: \`\${{ secrets.API_KEY_SECRET }}\`

      - name: Upload Logs and Reports
        if: always()
        uses: actions\/upload-artifact@v4
        with:
          name: playwright-execution-report-\`\${{ matrix.browser }}\`
          path: playwright-report\/
\`\`\`
`
  },
  performance_k6_notes: {
    title: "Performance Testing with k6 Scripting Guide",
    filename: "k6_performance_testing.md",
    content: `# PERFORMANCE AUDITS & LOAD TESTING WITH K6

## 1. Why k6 is Preferred Over JMeter
- **Developer-Centric**: JavaScript and TypeScript format allows testers to keep load scripts next to core code.
- **Low Footprint**: Written in Go, uses native OS threads with minimal memory overhead compared to JVM-based tools.
- **CI-CD Native**: Fail builds immediately if thresholds fail SLA parameters.

## 2. Core Load Test k6 Script
\`\`\`javascript
import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp-up to 20 virtual users
    { duration: '1m', target: 20 },  // Steady load phase
    { duration: '15s', target: 0 },  // Ramp-down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'], // 95% of queries must resolve under 300ms
    http_req_failed: ['rate<0.01'],    // Error rate must stay under 1%
  },
};

export default function () {
  const headers = { 'Content-Type': 'application/json' };
  const res = http.get('https:\/\/hospital.com\/api\/v1\/doctors', { headers });
  
  check(res, {
    'status resolves to 200': (r) => r.status === 200,
    'body contains lists': (r) => r.json().length > 0,
  });

  sleep(1);
}
\`\`\`
`
  },
  ai_testing_notes: {
    title: "AI in Automated Testing & Prompt Engineering Guide",
    filename: "ai_in_testing.md",
    content: `# AI-ASSISTED QA AUTOMATION & PROMPT AUDITING

## 1. Utilizing Generative AI in Test Lifecycles
Generative AI and Large Language Models are accelerating QA workflows via:
- **Test Case Generation**: Feed requirement checklists to LLMs to output edge-case scenarios.
- **Self-Healing Selectors**: Feed updated HTML elements to auto-identify dynamic modern page elements.

## 2. Testing AI App Interfaces
How to write automation suites targeting AI conversational endpoints:
- **Response Validation**: Do not perform static text matches on generative interfaces. Utilize embeddings or regular expressions to assert response semantics.
- **Structured Outputs**: Request JSON responses utilizing specific schemas and write JSON validators inside test blocks to confirm strict model answers.
- **Assertion Tone Checks**: Assert model responses contain friendly words, avoiding offensive or hallucinated links.
`
  },
  interview_qas: {
    title: "Most Important QA & SDET Interview Study Guide",
    filename: "qa_interview_questions_core.md",
    content: `# MOST IMPORTANT QA & STAFF SDET INTERVIEW QUESTIONS

## Q1: How do you design and structure a scalable test automation framework from scratch?
**Answer**:
1. **Separation of Concerns**: Page Object Model (POM) to isolate UI elements and helper actions from test script classes.
2. **Dynamic Configurations**: Support global variables (URLs, timeouts, browsers, execution modes) read from environment variables or custom config properties.
3. **Synchronization**: Enforce Explicit or Fluent Waits globally. Absolutely ban hardcoded \`Thread.sleep()\` loops.
4. **Data Isolation**: Builder patterns to generate dynamic payloads and cleanup mock DB fields after execution.
5. **CI/CD Ready**: Inject pipeline hooks like matrices (GitHub Actions or Jenkins) and configure unified, shareable reports (Allure, JUnit).

## Q2: How does Encapsulation play a critical role in Page Object Model (POM) development?
**Answer**:
Encapsulation safeguards locator selectors. Selectors (xpaths, CSS) are declared as \`private\` or \`protected\` fields at the top of the Class:
\`\`\`java
private By loginButton = By.id("submit");
\`\`\`
This ensures that external test suites cannot directly access or manipulate the selectors in random ways. If the button ID modifies, we only change the private field in *one* place, and all tests running \`loginPage.clickSubmit()\` continue to succeed without editing their actions.

## Q3: How do you configure a matrix cross-browser pipeline inside GitHub Actions?
**Answer**:
Use the \`strategy.matrix\` construct to execute workflows across multiple concurrent browser engines and OS combinations:
\`\`\`yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest]
    browser: [chromium, firefox, webkit]
\`\`\`
This launches 6 individual test environments running in parallel, fetching distinct configurations dynamically via matrix selectors.

## Q4: How do you validate an API response generated by an LLM or AI system inside an automated test suite?
**Answer**:
Since AI responses are non-deterministic, static string validation will fail. Instead:
1. **Schema Validation**: Force the model to return structured formats (like JSON) and validate JSON property types.
2. **Semantic Checkers**: Call natural language verification wrappers, or compare cosine vector similarity against standard embeddings.
3. **Sentiment & Rule Validation**: Write regex blocks ensuring that hallucinations or banned domains are 100% avoided.

## Q5: How do you handle and resolve a complex Git Merge Conflict with multiple files?
**Answer**:
1. Identify conflicting files via \`git status\`.
2. Open files and look for the conflict markers (\`<<<<<<< HEAD\`, \`=======\`, \`>>>>>>>\`).
3. Discuss the differences with corresponding developers, determine the correct master locator change, clean up markers, save files.
4. Commit files using \`git add .\` followed by \`git commit -m "chore: resolved automation conflict"\` and safely push.
`
  },
  live_interviews: {
    title: "1-on-1 Live Mock Practice Guide",
    filename: "live_one_to_one_interviews.md",
    content: `# 1-ON-1 LIVE VIRTUAL MOCK INTERVIEWS (3 SESSIONS INCLUDED)

## 1. How It Works
We provide 3 individual, face-to-face 1-on-1 live virtual mock interviews with elite principal QA and SDET architects from top-tier firms.

- **Session 1: Coding & Scripting Automation (60 Min)**: Deep dive into Java and TypeScript DSA, automation locator strategy, wait mechanics, and runtime parallel threads.
- **Session 2: Test Scenario & System Design (60 Min)**: Designing test strategies for ultra-complex real-world applications (e.g., streaming APIs, multi-currency cart transactions, microservice rate limiters).
- **Session 3: Resume Review & Behavioral Pitch (45 Min)**: Strategic critique of your resume to clear applicant tracking systems (ATS), and mock behavioral assessment to ace executive final rounds.

## 2. Dynamic Scheduling
Once enrolled, navigate to your dashboard and choose a convenient calendar slot. Your mentor will review your resume and target company before the call.

## 3. Real-Time Feedback Report
Within 2 hours after each session, receive a personalized scorecard with your structural strengths, design pitfalls, and an actionable roadmap to score high-paying SDET positions.
`
  },
  resume_template: {
    title: "Premium SDET & QA Professional Resume Templates",
    filename: "sdet_resume_template.md",
    content: `# PREMIUM SDET RESUME TEMPLATE (MARKDOWN FORMAT)

**[First Name] [Last Name], SDET and QA Engineer**
Email: contact@gmail.com | Phone: +91-9999999999 | LinkedIn: linkedin.com-in-your-profile

---

### PROFESSIONAL SUMMARY
Detail-oriented and outcome-driven Software Development Engineer in Test (SDET) with 4+ years of expertise in manual strategies and automation (Playwright, Selenium, Postman). Proven track record of lowering overall staging regressions by 40%.

### CORE COMPETENCIES
- **Automation Tools**: Selenium Webdriver (Java), Playwright (TypeScript)
- **API Capabilities**: RESTful service testing, automated Postman test-suites
- **Test Management**: STLC pipelines, Bug Tracking inside Jira, Agile workflows.
- **CI-CD**: Jenkins declarative scripting, GitHub workflows.
`
  },
  test_case_templates: {
    title: "Standard Test Case Design Spreadsheet Template",
    filename: "test_case_design_template.md",
    content: `# STANDARD TEST CASE DESIGN TEMPLATE

| Test Case ID | Feature Scope | Description | Preconditions | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|
| TC-001 | Auth flow | Register with unused email | Non-registered email | 1. Navigate to register<br>2. Fill details<br>3. Submit | Success dashboard access | User logged in dashboard | PASS |
| TC-002 | Payments | Try checkout with invalid card | Session active | 1. Trigger Razorpay checkout<br>2. Enter bad digit card<br>3. Fail pay | Gateway error message | Gateway throws payment failure | PASS |
`
  },
  bug_report_templates: {
    title: "Professional Bug Defect Report Document Template",
    filename: "bug_report_template.md",
    content: `# PROFESSIONAL DEFECT REPORT DOCUMENT

**Issue Title**: Page crash with blank payload on registration
**Defect ID**: BUG-402
**Severity**: Critical
**Priority**: High

### ENVIRONMENT
- **OS**: macOS Sequoia 15.1
- **Browser**: Google Chrome 126.3.2

### STEPS TO REPRODUCE
1. Open register page.
2. Direct-click "Register" button leaving input fields completely blank.
3. Observe network activities and client reactions.

### EXPECTED RESULT
Field validations trigger displaying "Field is required" warnings next to input fields.

### ACTUAL RESULT
Entire application throws React runtime error breaking the HTML wrapper viewport.
`
  },
  project_scenarios: {
    title: "Real Complex E-Commerce Scenario Case Studies",
    filename: "real_qa_project_scenarios.md",
    content: `# REAL QA PROJECT SCENARIOS: COMPLEX BUSINESS CASES

## Case Study 1: E-Commerce Multi-Currency Coupon Calculation
**Context**: A worldwide retailer rolls out absolute percentage coupons (e.g. "QA30" - 30% off) stackable with localized currency shipping offsets (e.g., Free shipping over 100 USD and EUR) but restricted against specific clearance category tags.
**QA Strategy**: Construct exhaustive boundary combination grids:
1. Try item pricing matching $99.99 right below $100 barrier, compute discount + shipping.
2. Try stacked non-eligible item addition, verify percent only scales down the eligible lines.

## Case Study 2: Real-time Concurrency Seat Selection
**Context**: Online theater booking where two parallel sockets locks identical row seats.
**QA Strategy**: Simulate concurrent actions using Apache JMeter or parallel Playwright sessions firing within 5 milliseconds of each other.
`
  },
  qa_roadmap: {
    title: "2026 Master SDET Career Progression Roadmap",
    filename: "qa_sdet_roadmap_2026.md",
    content: `# THE ULTIMATED SDET and INTUITIVE QA ENGINEER ROADMAP

## Phase 1: Heavy Manual Foundations (Months 1-3)
Learn core methodologies: Black box coverage, boundaries, Equivalence, STLC workflows, writing comprehensive test scenarios, and manual exploratory database validations.

## Phase 2: Web Automation Core (Months 4-7)
Learn programming basics (TypeScript or Java). Master locators, wait timers, assertions, POM schemas, and write your first Selenium or Playwright test suites.

## Phase 3: Advanced CI-CD Integration (Months 8-10)
Connect automated suites directly in pipeline schedulers like Jenkins or GitHub actions. Configure triggers sending automated Slack summaries on build regressions.
`
  }
};

// --- API ENDPOINTS ---

// 1. Health check & configuration settings
app.get('/api/health', (req, res) => {
  res.json({ message: "QA Interview Kit server running perfectly.", timestamp: new Date().toISOString() });
});

// Get pricing and expiration timer configs
app.get('/api/config', (req, res) => {
  try {
    const timer = dbService.getTimerConfig();
    const pricing = dbService.getPricingConfig();

    // Calculate countdown from start_time with timer_duration_hours (using modulo for infinite continuous loops)
    const durationMs = timer.timer_duration_hours * 60 * 60 * 1000;
    const startTimeStamp = new Date(timer.start_time).getTime();
    const nowTimeStamp = Date.now();
    const elapsedMs = nowTimeStamp - startTimeStamp;

    // Infinite 20-minute (or configured duration) looping logic
    const remainingMs = elapsedMs >= 0
      ? durationMs - (elapsedMs % durationMs)
      : durationMs;

    res.json({
      amount: pricing.amount,
      original_amount: pricing.original_amount,
      timer_duration_hours: timer.timer_duration_hours,
      start_time: timer.start_time,
      is_expired: false, // Offer never truly expires completely; it immediately restarts
      remaining_seconds: Math.max(0, Math.floor(remainingMs / 1000)),
      server_time: new Date().toISOString(),
      razorpay_key_configured: !!process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving active system configs.' });
  }
});

// 2. Authentication API Routing

// Sandbox mailbox inspection disabled: OTP/verification codes must only ever reach
// the recipient's real inbox via SMTP, never be readable back through the API.

// PASSWORDS-LESS SMTP OTP SIGN-UP & LOGIN
app.post('/api/auth/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ message: 'Email address is required to dispatch an OTP.' });
    return;
  }

  const emailLower = email.toLowerCase().trim();
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    const users = dbService.getUsers();
    let user = users.find(u => u.email === emailLower);

    if (!user) {
      // Auto-register guest if they don't have an profile yet
      const id = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
      const placeholderName = emailLower.split('@')[0];
      const password_hash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
      
      user = {
        id,
        name: placeholderName.charAt(0).toUpperCase() + placeholderName.slice(1),
        email: emailLower,
        password_hash,
        email_verified: false,
        verification_token: code,
        is_admin: false,
        created_at: new Date().toISOString()
      };
      
      dbService.saveUser(user);
      dlog(`Created new passwordless guest profile for ${emailLower} with primary code: ${code}`);
    } else {
      user.verification_token = code;
      dbService.saveUser(user);
      dlog(`Generated new passwordless entry code ${code} for existing account ${emailLower}`);
    }

    // Dispatch verification email through our robust SMTP channel helper
    const delivered = await sendVerificationEmail(emailLower, code, user.name);
    if (!delivered) {
      res.status(502).json({ message: 'Could not deliver the OTP email. Please check the address and try again shortly.' });
      return;
    }

    res.status(200).json({
      message: 'OTP verification code dispatched successfully! Check your inbox.',
      email: emailLower
    });
  } catch (err) {
    console.error("Error creating or processing instant email verification OTP:", err);
    res.status(500).json({ message: 'Failed to process email OTP request.' });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  const { email, token } = req.body;

  if (!email || !token) {
    res.status(400).json({ message: 'Email and 6-digit OTP are required.' });
    return;
  }

  const emailLower = email.toLowerCase().trim();
  const users = dbService.getUsers();
  const user = users.find(u => u.email === emailLower);

  if (!user) {
    res.status(400).json({ message: 'No profile matching this email address is waiting verification.' });
    return;
  }

  if (user.verification_token && user.verification_token === token) {
    user.email_verified = true;
    user.verification_token = null;
    dbService.saveUser(user);

    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, is_admin: user.is_admin },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    dlog(`User ${emailLower} verified OTP successfully. Dispatched JWT session token.`);

    res.json({
      message: 'Code matched! Authenticated successfully.',
      token: jwtToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_admin: user.is_admin,
        created_at: user.created_at
      }
    });
  } else {
    res.status(400).json({ message: 'Incorrect OTP code. Please verify and try again.' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ message: 'Name, email and password are all required.' });
    return;
  }

  const emailLower = email.toLowerCase().trim();
  const users = dbService.getUsers();

  if (users.some(u => u.email === emailLower)) {
    res.status(400).json({ message: 'A user with this email address already exists.' });
    return;
  }

  try {
    const password_hash = await bcrypt.hash(password, 10);
    const id = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    // Simple 6-digit email confirmation code
    const verification_token = Math.floor(100000 + Math.random() * 900000).toString();

    const newUser: User = {
      id,
      name: name.trim(),
      email: emailLower,
      password_hash,
      email_verified: false,
      verification_token,
      is_admin: false,
      created_at: new Date().toISOString()
    };

    dbService.saveUser(newUser);

    dlog(`User ${emailLower} registered successfully! Verification Code of ${verification_token} generated.`);

    // Dispatch verification email
    const delivered = await sendVerificationEmail(emailLower, verification_token, name.trim());
    if (!delivered) {
      res.status(502).json({ message: 'Account created, but the verification email could not be delivered. Please contact support.' });
      return;
    }

    res.status(201).json({
      message: 'Registration successful! Check your email for the verification code.',
      email: emailLower
    });
  } catch (err) {
    res.status(500).json({ message: 'Error generating user profile.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required.' });
    return;
  }

  const emailLower = email.toLowerCase().trim();
  const users = dbService.getUsers();
  const user = users.find(u => u.email === emailLower);

  if (!user) {
    res.status(400).json({ message: 'No registered account found with that email address.' });
    return;
  }

  try {
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      res.status(400).json({ message: 'Incorrect password details.' });
      return;
    }

    if (!user.email_verified) {
      // Re-trigger and verify code directly by emailing them a fresh code
      const verification_token = Math.floor(100000 + Math.random() * 900000).toString();
      user.verification_token = verification_token;
      dbService.saveUser(user);

      dlog(`Re-triggered verification code ${verification_token} for ${user.email} upon unverified login attempt`);
      await sendVerificationEmail(user.email, verification_token, user.name);

      res.status(403).json({
        message: 'Your email address is not verified yet. A fresh verification code has been dispatched to your email.',
        unverified: true
      });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, is_admin: user.is_admin },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_admin: user.is_admin,
        created_at: user.created_at
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server login error.' });
  }
});

app.post('/api/auth/verify-email', (req, res) => {
  const { email, token } = req.body;

  if (!email || !token) {
    res.status(400).json({ message: 'Email and verification code are required.' });
    return;
  }

  const emailLower = email.toLowerCase().trim();
  const users = dbService.getUsers();
  const user = users.find(u => u.email === emailLower);

  if (!user) {
    res.status(400).json({ message: 'No account matching this email.' });
    return;
  }

  if (user.verification_token && user.verification_token === token) {
    user.email_verified = true;
    user.verification_token = null;
    dbService.saveUser(user);

    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, is_admin: user.is_admin },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Account successfully verified!',
      token: jwtToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_admin: user.is_admin
      }
    });
  } else {
    res.status(400).json({ message: 'Invalid registration confirmation code.' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ message: 'Email address is required.' });
    return;
  }

  const emailLower = email.toLowerCase().trim();
  const users = dbService.getUsers();
  const user = users.find(u => u.email === emailLower);

  if (!user) {
    res.status(400).json({ message: 'No user registered with that email address.' });
    return;
  }

  // Generate simple 6-digit recovery token
  const reset_token = Math.floor(100000 + Math.random() * 900000).toString();
  const reset_token_expiry = Date.now() + 30 * 60 * 1000; // 30 mins

  user.reset_token = reset_token;
  user.reset_token_expiry = reset_token_expiry;
  dbService.saveUser(user);

  dlog(`Recovery code generated for ${emailLower}.`);

  // Dispatch recovery mail
  const delivered = await sendPasswordRecoveryEmail(emailLower, reset_token, user.name);
  if (!delivered) {
    res.status(502).json({ message: 'Could not deliver the recovery email. Please try again shortly or contact support.' });
    return;
  }

  res.json({
    message: 'A recovery code has been sent to your email.'
  });
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { email, token, newPassword } = req.body;

  if (!email || !token || !newPassword) {
    res.status(400).json({ message: 'Email, reset token and new password are required.' });
    return;
  }

  const emailLower = email.toLowerCase().trim();
  const users = dbService.getUsers();
  const user = users.find(u => u.email === emailLower);

  if (!user) {
    res.status(400).json({ message: 'No registered user matching this email.' });
    return;
  }

  if (!user.reset_token || user.reset_token !== token) {
    res.status(400).json({ message: 'Invalid reset token' });
    return;
  }

  if (user.reset_token_expiry && Date.now() > user.reset_token_expiry) {
    res.status(400).json({ message: 'Reset token has expired.' });
    return;
  }

  try {
    const password_hash = await bcrypt.hash(newPassword, 10);
    user.password_hash = password_hash;
    user.reset_token = null;
    user.reset_token_expiry = null;
    dbService.saveUser(user);

    res.json({ message: 'Password has been updated. Please log in.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not reset password.' });
  }
});

app.get('/api/auth/me', authenticateJWT, (req: AuthenticatedRequest, res) => {
  const userDecoded = req.user;
  if (!userDecoded) {
    res.status(401).json({ message: 'No session' });
    return;
  }

  const user = dbService.getUsers().find(u => u.id === userDecoded.id);
  if (!user) {
    res.status(404).json({ message: 'User profile not found.' });
    return;
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    is_admin: user.is_admin,
    created_at: user.created_at
  });
});

// Update Profile
app.put('/api/auth/profile', authenticateJWT, (req: AuthenticatedRequest, res) => {
  const { name, email, phone, password } = req.body;
  const userDecoded = req.user!;

  const db = dbService.read();
  const user = db.users.find(u => u.id === userDecoded.id);

  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  if (name) user.name = name.trim();
  if (phone !== undefined) {
    const phoneTrimmed = String(phone).trim();
    if (phoneTrimmed && !/^\d{10}$/.test(phoneTrimmed)) {
      res.status(400).json({ message: 'Mobile number must be exactly 10 digits.' });
      return;
    }
    user.phone = phoneTrimmed;
  }

  if (email) {
    const emailLower = email.toLowerCase().trim();
    if (emailLower !== user.email && db.users.some(u => u.email === emailLower)) {
      res.status(400).json({ message: 'Email already registered' });
      return;
    }
    user.email = emailLower;
  }

  if (password) {
    bcrypt.hash(password, 10).then((hashed) => {
      user.password_hash = hashed;
      dbService.saveUser(user);
      res.json({
        message: 'Profile and password updated successfully.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          is_admin: user.is_admin
        }
      });
    }).catch(() => {
      res.status(500).json({ message: 'Failed to update credentials.' });
    });
  } else {
    dbService.saveUser(user);
    res.json({
      message: 'Profile details updated.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        is_admin: user.is_admin
      }
    });
  }
});


// 3. Purchase & Payments Routing
app.post('/api/payments/create-order', (req, res) => {
  try {
    const pricing = dbService.getPricingConfig();
    const order_id = "order_rzp_" + crypto.randomBytes(8).toString('hex');
    
    // Send order context
    res.json({
      order_id,
      amount: pricing.amount,
      currency: "INR",
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_stub_key_123456',
      simulation: !process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    res.status(500).json({ message: 'Payment gateway connection error.' });
  }
});

app.post('/api/payments/verify-signature', authenticateJWT, (req: AuthenticatedRequest, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amountPaid } = req.body;
  const userDecoded = req.user!;

  if (!razorpay_order_id || !razorpay_payment_id) {
    res.status(400).json({ message: 'Order and Payment IDs are strictly necessary.' });
    return;
  }

  // Prevent duplicate purchases
  const orders = dbService.getOrders();
  const alreadyPurchased = orders.some(o => o.user_id === userDecoded.id && o.status === 'completed');
  if (alreadyPurchased) {
    res.status(400).json({ message: 'You have already purchased this kit! Check dashboard downloads.' });
    return;
  }

  // Create signature validation
  const secret = process.env.RAZORPAY_KEY_SECRET;
  let signatureVerified = false;

  if (secret && razorpay_signature) {
    // Real Razorpay signature check
    const text = razorpay_order_id + "|" + razorpay_payment_id;
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(text)
      .digest('hex');
    signatureVerified = (generatedSignature === razorpay_signature);
  } else {
    // Simulated Sandbox purchase verification is approved automatically
    signatureVerified = true;
  }

  if (signatureVerified) {
    const orderId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1;
    const newOrder: Order = {
      id: orderId,
      user_id: userDecoded.id,
      payment_id: razorpay_payment_id,
      razorpay_order_id: razorpay_order_id,
      amount: amountPaid || dbService.getPricingConfig().amount,
      status: 'completed',
      purchase_date: new Date().toISOString()
    };

    dbService.saveOrder(newOrder);
    res.json({
      success: true,
      message: 'Razorpay payment signature verified. Order logs successfully persisted!',
      order: newOrder
    });
  } else {
    res.status(400).json({ success: false, message: 'Razorpay payment signature validation failed.' });
  }
});

// Check if user has purchased
app.get('/api/payments/status', authenticateJWT, (req: AuthenticatedRequest, res) => {
  const userDecoded = req.user!;
  const orders = dbService.getOrders();
  const finishedOrder = orders.find(o => o.user_id === userDecoded.id && o.status === 'completed');
  
  res.json({
    purchased: !!finishedOrder,
    order: finishedOrder || null
  });
});


// 4. Sample Notes Preview Endpoint (Partial views)
app.get('/api/notes/samples', (req, res) => {
  const sampleData = [
    {
      id: "manual_notes",
      title: "Manual Testing & Scenario Designing",
      preview: "Manual testing is the core foundation of quality engineering. Mater SDLC/STLC phases, Equivalence Partitioning (EP), Boundary Value Analysis (BVA), Bug states, and functional verification strategies.",
      blur_section: "DATABASE VERIFICATION PREPARATIONS: [BLURRED] - Upgrade to unlock complex scenario logs, regression setups & bug templates."
    },
    {
      id: "programming_oop_notes",
      title: "Programming & OOP for Testers (Java/TS)",
      preview: "Learn programming concepts completely focused on automated test execution. Master Abstraction, Encapsulation, Polymorphism, Inheritance, interfaces, and collections handling in Java and TypeScript.",
      blur_section: "THREAD-LOCAL BLUEPRINTS & TYPE UTILS: [BLURRED] - Upgrade to unlock dynamic generic method patterns."
    },
    {
      id: "api_notes",
      title: "API Testing & REST Architecture",
      preview: "Build complete awareness of GET, POST, PUT, DELETE commands, status headers, payloads, query path params, and write Javascript chain scripts inside Postman.",
      blur_section: "CHAINED AUTHENTICATION REQUEST LOOPS: [BLURRED] - Upgrade to unlock bearer token scripts."
    },
    {
      id: "framework_arch_notes",
      title: "Framework Architecture & POM Patterns",
      preview: "Learn to design production frameworks from scratch. Master the Page Object Model (POM), thread-safe Driver Singleton factories, and clean Builder/Factory patterns for test data automation.",
      blur_section: "COMPLEX REGRESSION ENGINE WRAPPERS: [BLURRED] - Upgrade to unlock full ready-to-run POM structures."
    },
    {
      id: "sql_notes",
      title: "SQL & Relational Databases for QA",
      preview: "Discover how to query databases: write SELECT statement structures, INNER/LEFT query joins, grouping filters, subqueries, and organize indexing for database verification.",
      blur_section: "OUTER JOIN DATA SANITIZERS: [BLURRED] - Upgrade to unlock relational test scripts."
    },
    {
      id: "cicd_notes",
      title: "CI/CD Workflows & GitHub Actions",
      preview: "Take your local tests to the cloud. Build Declarative pipelines, triggers, matrix runs, secrets management, environment actions, browser setups, and Slack reporting pipelines with GitHub Actions.",
      blur_section: "YAML WORKFLOW GRID AND PARALLEL THREAD CONTROLLERS: [BLURRED] - Upgrade to unlock declarative configs."
    },
    {
      id: "performance_k6_notes",
      title: "Performance Testing with k6",
      preview: "Master developer-focused performance setups. Write Javascript load scripts, define Virtual Users (VUs) stages, ramp-ups, and assert SLO request response duration thresholds.",
      blur_section: "LOAD TRANSITION EXTREME MATRIX LOGS: [BLURRED] - Upgrade to unlock ready-to-run k6 load scripts."
    },
    {
      id: "ai_testing_notes",
      title: "AI in Testing & Prompt Engineering",
      preview: "Adopt generative AI inside QA pipelines. Test conversational LLM endpoints, validate semantic rules, enforce JSON schema answers, and write self-healing element lookup prompts.",
      blur_section: "AI CONVERSATIONAL ASSERTIONS CODE: [BLURRED] - Upgrade to unlock LLM temperature checkers."
    },
    {
      id: "interview_qas",
      title: "100+ Curated Key Interview Q&As",
      preview: "Exhaustive QA and SDET interview collection covering real-world scenarios, coding tests, framework architectural design, and modern version control challenges.",
      blur_section: "INTERVIEW VERDICT MAPPING BLUEPRINTS: [BLURRED] - Upgrade to unlock elite answers with diagram booklets."
    },
    {
      id: "live_interviews",
      title: "1-on-1 Live Mock Practice",
      preview: "Schedule 3 face-to-face virtual 1-on-1 mock interviews (Coding, System Design, Resume pitch) with elite staff architects. Get raw scorecards and customized feedback lists.",
      blur_section: "LIVE RESUME WRITING BLUEPRINTS & RECORDINGS: [BLURRED] - Upgrade to book your sessions."
    }
  ];
  res.json(sampleData);
});

// Get user download history logs
app.get('/api/notes/download-history', authenticateJWT, (req: AuthenticatedRequest, res) => {
  const logs = dbService.getDownloads().filter(l => l.user_id === req.user!.id);
  res.json(logs);
});

// Bookings APIs
app.get('/api/bookings', authenticateJWT, (req: AuthenticatedRequest, res) => {
  const userDecoded = req.user!;
  const userBookings = dbService.getBookings(userDecoded.is_admin ? undefined : userDecoded.id);
  res.json(userBookings);
});

app.post('/api/bookings', authenticateJWT, (req: AuthenticatedRequest, res) => {
  const userDecoded = req.user!;
  const { session_type, date_time } = req.body;

  if (!session_type || !date_time) {
    res.status(400).json({ message: 'Missing session_type or date_time.' });
    return;
  }

  // Check if they purchased the kit (or is admin)
  const isAuthorized = userDecoded.is_admin || dbService.getOrders().some(
    o => o.user_id === userDecoded.id && o.status === 'completed'
  );

  if (!isAuthorized) {
    res.status(403).json({ message: 'Access denied. Please purchase the Ultimate QA Interview Kit to schedule 1-on-1 sessions.' });
    return;
  }

  const userBookings = dbService.getBookings(userDecoded.id);
  if (userBookings.filter(b => b.status === 'scheduled').length >= 3 && !userDecoded.is_admin) {
    res.status(400).json({ message: 'You have already scheduled 3 active virtual mock interview sessions.' });
    return;
  }

  const allBookings = dbService.getBookings();
  const nextId = allBookings.length > 0 ? Math.max(...allBookings.map(b => b.id)) + 1 : 1;

  const newBooking = {
    id: nextId,
    user_id: userDecoded.id,
    session_type,
    date_time,
    status: 'scheduled' as const,
    created_at: new Date().toISOString()
  };

  dbService.saveBooking(newBooking);

  // Send a simulated email notifying the user of successful mock interview booking
  const fullUser = dbService.getUsers().find(u => u.email === userDecoded.email);
  const userName = fullUser ? fullUser.name : 'Candidate';
  const subject = `Confirmed: Your 1-on-1 Mock Interview on ${session_type.toUpperCase()}`;
  const focusLabel = session_type === 'coding' ? 'Java and TS Scripting, Locators, Waits, and DSA Coding' :
                     session_type === 'design' ? 'System Design, Framework Architecture, and QA Strategy' :
                     'ATS Professional Resume Alignment and Strategic Pitch';

  const html = '<div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eaeaea; border-radius: 12px;">' +
    '<h2 style="color: #f43f5e; font-weight: 800; margin-top: 0;">1-on-1 Virtual Live Mock Scheduled</h2>' +
    '<p>Hello <strong>' + userName + '</strong>,</p>' +
    '<p>Your premium 1-on-1 live virtual practice session with an SDET Principal Architect has been successfully scheduled!</p>' +
    '<div style="background: #fff5f5; border-left: 4px solid #f43f5e; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">' +
      '<strong style="color: #be123c;">Session Focus:</strong> ' + focusLabel + '<br/>' +
      '<strong style="color: #be123c;">Schedule Slot:</strong> ' + date_time + '<br/>' +
      '<strong style="color: #be123c;">Meeting Format:</strong> Face-to-face Video Conference (Google Meet or Zoom link will trigger 15 minutes before the call)' +
    '</div>' +
    '<p style="font-size: 13px; color: #666; line-height: 1.5;">Please prepare a quiet testing environment, make sure your microphone and camera function properly, and have your dynamic IDE or resume ready. We look forward to helping you master your engineering career goals!</p>' +
    '<hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />' +
    '<p style="font-size: 12px; color: #999; margin-bottom: 0;">Ultimate QA and SDET Interview Kit Team</p>' +
  '</div>';
  try {
    const allEmails = dbService.getSimulatedEmails();
    const nextEmailId = allEmails.length > 0 ? Math.max(...allEmails.map(e => e.id)) + 1 : 1;
    dbService.saveSimulatedEmail({
      id: nextEmailId,
      to: userDecoded.email,
      subject,
      html,
      code: "MOCK_INTERVIEW_BOOKED",
      sent_at: new Date().toISOString()
    });
  } catch (err) {
    console.error("Failed to store simulated email notification", err);
  }

  res.json({ message: 'Session successfully scheduled! Check your inbox/simulated log for confirmation detail.', booking: newBooking });
});

app.post('/api/bookings/cancel', authenticateJWT, (req: AuthenticatedRequest, res) => {
  const userDecoded = req.user!;
  const { booking_id } = req.body;

  if (!booking_id) {
    res.status(400).json({ message: 'Missing booking_id.' });
    return;
  }

  const allBookings = dbService.getBookings();
  const booking = allBookings.find(b => b.id === Number(booking_id));

  if (!booking) {
    res.status(404).json({ message: 'Booking not found.' });
    return;
  }

  if (booking.user_id !== userDecoded.id && !userDecoded.is_admin) {
    res.status(403).json({ message: 'Access denied.' });
    return;
  }

  booking.status = 'cancelled';
  dbService.saveBooking(booking);

  res.json({ message: 'Booking has been cancelled.', booking });
});

// Protected Document Download API with check
app.get('/api/notes/download/:fileKey', authenticateJWT, (req: AuthenticatedRequest, res) => {
  const { fileKey } = req.params;
  const userDecoded = req.user!;

  // Check if admin, OR user has completed purchase
  const isAuthorized = userDecoded.is_admin || dbService.getOrders().some(
    o => o.user_id === userDecoded.id && o.status === 'completed'
  );

  if (!isAuthorized) {
    res.status(403).json({ message: 'Access denied. Purchase this QA Interview Kit to download materials.' });
    return;
  }

  const document = TOOLKIT_DOCUMENTS[fileKey];
  if (!document) {
    res.status(404).json({ message: 'Document identifier not found in toolkit.' });
    return;
  }

  // Increment download counter
  const downloads = dbService.getDownloads();
  const downloadId = downloads.length > 0 ? Math.max(...downloads.map(d => d.id)) + 1 : 1;
  const newLog: DownloadLog = {
    id: downloadId,
    user_id: userDecoded.id,
    file_name: document.filename,
    downloaded_at: new Date().toISOString()
  };
  dbService.saveDownload(newLog);

  // Send Markdown or plain text attachment
  res.setHeader('Content-disposition', `attachment; filename=${document.filename}`);
  res.setHeader('Content-type', 'text/markdown; charset=utf-8');
  res.send(document.content);
});

// Download compilation of all individual components into a single in-memory ZIP
app.get('/api/notes/download-all', authenticateJWT, (req: AuthenticatedRequest, res) => {
  const userDecoded = req.user!;

  const isAuthorized = userDecoded.is_admin || dbService.getOrders().some(
    o => o.user_id === userDecoded.id && o.status === 'completed'
  );

  if (!isAuthorized) {
    res.status(403).json({ message: 'Access denied. Payment is required before downloading the full zip archive.' });
    return;
  }

  try {
    const zip = new AdmZip();

    // Loop through document templates and add as files to ZIP
    Object.keys(TOOLKIT_DOCUMENTS).forEach((key) => {
      const doc = TOOLKIT_DOCUMENTS[key];
      zip.addFile(doc.filename, Buffer.from(doc.content, 'utf-8'));
    });

    const zipBuffer = zip.toBuffer();

    // Log download counts for all files
    const downloads = dbService.getDownloads();
    let downloadId = downloads.length > 0 ? Math.max(...downloads.map(d => d.id)) : 0;

    Object.keys(TOOLKIT_DOCUMENTS).forEach((key) => {
      const doc = TOOLKIT_DOCUMENTS[key];
      downloadId++;
      dbService.saveDownload({
        id: downloadId,
        user_id: userDecoded.id,
        file_name: doc.filename,
        downloaded_at: new Date().toISOString()
      });
    });

    res.setHeader('Content-disposition', 'attachment; filename=QA_Interview_Kit_Bundle.zip');
    res.setHeader('Content-type', 'application/zip');
    res.send(zipBuffer);
  } catch (err) {
    res.status(500).json({ message: 'Error stitching zip file compilation.' });
  }
});


// Dynamic AI Advanced Notes Builder - Protected Route for Paid/Admin Users
app.post('/api/notes/generate-advanced', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  const userDecoded = req.user!;
  
  // Check if authorized (is_admin or has completed order)
  const isAuthorized = userDecoded.is_admin || dbService.getOrders().some(
    o => o.user_id === userDecoded.id && o.status === 'completed'
  );

  if (!isAuthorized) {
    res.status(403).json({ message: 'Access denied. Purchase this QA Interview Kit to unlock AI Advanced Notes!' });
    return;
  }

  const { topic } = req.body;
  if (!topic) {
    res.status(400).json({ message: 'Topic topic text is required.' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(400).json({ 
      message: 'GEMINI_API_KEY is not configured on the server. Please define GEMINI_API_KEY in the Secrets panel.' 
    });
    return;
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const prompt = "You are an elite QA automation leader, staff engineer, and technical SDET writer.\n" +
      "Generate extremely detailed, comprehensive, advanced-level technical notes, case studies, or test configurations for:\n\n" +
      "Topic: \"" + topic + "\"\n\n" +
      "Your response MUST be fully written out in clean Markdown format (no generic summaries or truncated files, provide massive technical depth). Include:\n" +
      "1. Advanced Theory, Architecture, and Best Practices (under-the-hood details)\n" +
      "2. Production-grade Automation Code (e.g., highly robust, multi-layered POM, thread-safe, or scalable test implementations with custom logging, listeners, or handlers in Java, TypeScript, custom assertions or filters)\n" +
      "3. 5-10 Advanced Test Scenarios with Mock Data and Edge-Cases\n" +
      "4. Flakiness Mitigation and Optimization (e.g. dynamic waits, stale element solutions, parallel test execution parameters, Docker container configs, or robust network proxies)\n" +
      "5. CI/CD integration (complete declarative Jenkinsfile or GitHub Actions YAML workflow block tailored to this topic)\n\n" +
      "Make it extremely rigorous, educational, and high-quality. Do not use loose mock placeholders; write real classes, real methods, and real detailed configurations.";

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a professional SDET and Principal QA Architect. Write detailed, professional, and practical advanced level QA notes.",
      }
    });

    if (!response || !response.text) {
      throw new Error("No response from AI generation model.");
    }

    res.json({
      topic,
      content: response.text,
      generated_at: new Date().toISOString()
    });

  } catch (err: any) {
    dlog(`Error inside Dynamic Notes Builder: ${err?.message || err}`);
    res.status(500).json({ 
      message: `Failed to compile advanced QA notes via Gemini API: ${err?.message || 'Unknown error'}` 
    });
  }
});

// 1:1 INTERVIEW MOCK CHAT WITH GEMINI API
app.post('/api/interview/chat', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  const userDecoded = req.user!;
  
  // Check if authorized (is_admin or has order)
  const isAuthorized = userDecoded.is_admin || dbService.getOrders().some(
    o => o.user_id === userDecoded.id && o.status === 'completed'
  );

  if (!isAuthorized) {
    res.status(403).json({ message: 'Access denied. Purchase this QA Interview Kit to unlock the Live 1:1 AI Mock Interview Simulator.' });
    return;
  }

  const { messages, track } = req.body;
  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ message: 'Chat messages history is required.' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(400).json({ 
      message: 'GEMINI_API_KEY is not configured on the server. Please define GEMINI_API_KEY in the Secrets panel.' 
    });
    return;
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    // Map last messages to GoogleGenAI chat scheme
    const mappedHistory = messages.slice(-8).map((msg: any) => {
      const roleName = msg.sender === 'interviewer' ? 'model' : 'user';
      return {
        role: roleName,
        parts: [{ text: msg.text }]
      };
    });

    const systemInstruction = "You are an elite Lead QA Architect and Senior SDET Interviewer conducting a realistic, interactive 1-to-1 live technical mock interview for the track: " + (track || "General QA Specialist") + ".\n" +
      "Conduct yourself professionally like an interview panel lead flag-bearer from top tech firms.\n" +
      "Your duties:\n" +
      "1. Speak in a sharp, realistic, conversational, and encouraging yet rigorous manner.\n" +
      "2. If the user answered the previous question, briefly analyze their response. Point out any missing details or performance bottlenecks in a constructive, professional 1-2 sentence breakdown.\n" +
      "3. Then, ask ONE high-impact follow up or new technical/scenario question.\n" +
      "4. Keep your responses concise (no more than 3-4 paragraphs) to simulate a real live conversational dialogue.\n" +
      "5. NEVER write out the entire interview or multiple questions at once.\n" +
      "6. Welcome them first when the conversation is empty, and ask a hard-hitting question to begin.";

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: mappedHistory.length > 0 ? mappedHistory : "Hello, let's start my 1-to-1 mock interview.",
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.75
      }
    });

    if (!response || !response.text) {
      throw new Error("No response from mock interview model.");
    }

    res.json({
      reply: response.text,
      generated_at: new Date().toISOString()
    });

  } catch (err: any) {
    console.error("Error in mock interview chat builder:", err);
    res.status(500).json({ 
      message: `Failed to consult AI Principal Interviewer: ${err?.message || 'Unknown error'}` 
    });
  }
});


// 5. Public Testimonials list access
app.get('/api/testimonials', (req, res) => {
  const testimonials = dbService.getTestimonials().filter(t => t.approved);
  res.json(testimonials);
});

// Submit a custom user testimonial from dashboard
app.post('/api/testimonials', authenticateJWT, (req: AuthenticatedRequest, res) => {
  const { role, comment, rating } = req.body;
  const userDecoded = req.user!;

  if (!comment || !rating) {
    res.status(400).json({ message: 'Comment and Rating level are both required.' });
    return;
  }

  const testimonials = dbService.getTestimonials();
  const tid = testimonials.length > 0 ? Math.max(...testimonials.map(t => t.id)) + 1 : 1;

  const user = dbService.getUsers().find(u => u.id === userDecoded.id);
  const user_name = user ? user.name : 'Verified Customer';

  const newTestimonial: Testimonial = {
    id: tid,
    user_name,
    role: role || 'QA Professional',
    comment,
    rating: Number(rating),
    approved: false, // Wait for admin approval
    created_at: new Date().toISOString()
  };

  dbService.saveTestimonial(newTestimonial);
  res.json({ message: 'Thank you! Your testimonial has been submitted and is awaiting administrator approval.', testimonial: newTestimonial });
});


// --- ADMIN API ENDPOINTS ---
app.get('/api/admin/analytics', authenticateJWT, adminOnly, (req, res) => {
  const users = dbService.getUsers();
  const orders = dbService.getOrders();
  const downloads = dbService.getDownloads();
  const testimonials = dbService.getTestimonials();

  const totalUsers = users.length;
  const completedOrders = orders.filter(o => o.status === 'completed');
  const totalRevenue = completedOrders.reduce((acc, current) => acc + current.amount, 0);
  const totalDownloadsCount = downloads.length;

  res.json({
    totalUsers,
    totalSalesCount: completedOrders.length,
    totalRevenue,
    totalDownloadsCount,
    salesData: completedOrders.map(o => ({
      id: o.id,
      amount: o.amount,
      date: o.purchase_date,
      payment_id: o.payment_id
    })),
    downloadStats: downloads.slice(-20).map(d => ({
      id: d.id,
      user: users.find(u => u.id === d.user_id)?.email || 'Unknown User',
      file_name: d.file_name,
      date: d.downloaded_at
    }))
  });
});

// Public visit-tracking beacon: called from the client as visitors move between pages.
// No auth required (anonymous visitors must be trackable too) — if a valid token is
// attached, the visit is linked to that user, otherwise it's recorded anonymously.
app.post('/api/analytics/track', (req: AuthenticatedRequest, res) => {
  const { session_id, path: visitedPath, duration_seconds, auth_token } = req.body;

  if (typeof session_id !== 'string' || !session_id.trim() || typeof visitedPath !== 'string' || !visitedPath.trim()) {
    res.status(400).json({ message: 'session_id and path are required.' });
    return;
  }

  const rawDuration = Number(duration_seconds);
  // Clamp to a sane range (0 to 4 hours) to guard against stuck/backgrounded tabs skewing averages
  const durationSeconds = Number.isFinite(rawDuration) ? Math.max(0, Math.min(rawDuration, 4 * 60 * 60)) : 0;

  let userId: number | null = null;
  const authHeader = req.headers.authorization;
  const bearerToken = (authHeader && authHeader.startsWith('Bearer ')) ? authHeader.substring(7) : (typeof auth_token === 'string' ? auth_token : null);
  if (bearerToken) {
    try {
      const decoded = jwt.verify(bearerToken, JWT_SECRET) as { id: number };
      userId = decoded.id;
    } catch (_) {
      // Anonymous or expired token — still record the visit anonymously
    }
  }

  const views = dbService.getPageViews();
  const nextId = views.length > 0 ? Math.max(...views.map(v => v.id)) + 1 : 1;

  dbService.savePageView({
    id: nextId,
    session_id: session_id.trim().slice(0, 100),
    user_id: userId,
    path: visitedPath.trim().slice(0, 200),
    started_at: new Date().toISOString(),
    duration_seconds: durationSeconds
  });

  res.status(204).end();
});

app.get('/api/admin/analytics/visitors', authenticateJWT, adminOnly, (req, res) => {
  const users = dbService.getUsers();
  const adminUserIds = new Set(users.filter(u => u.is_admin).map(u => u.id));

  // Exclude the admin's own visits from every stat below — both belt (the client never
  // sends them, see useVisitTracking's isAdmin flag) and suspenders (filtered again here
  // so any already-recorded admin traffic, e.g. from before that fix, doesn't skew reports).
  const views = dbService.getPageViews().filter(v => !v.user_id || !adminUserIds.has(v.user_id));

  const uniqueSessions = new Set(views.map(v => v.session_id));
  const withDuration = views.filter(v => v.duration_seconds > 0);
  const avgDurationSeconds = withDuration.length > 0
    ? Math.round(withDuration.reduce((acc, v) => acc + v.duration_seconds, 0) / withDuration.length)
    : 0;

  const pageStatsMap = new Map<string, { visits: number; totalDuration: number; durationSamples: number }>();
  views.forEach(v => {
    const entry = pageStatsMap.get(v.path) || { visits: 0, totalDuration: 0, durationSamples: 0 };
    entry.visits += 1;
    if (v.duration_seconds > 0) {
      entry.totalDuration += v.duration_seconds;
      entry.durationSamples += 1;
    }
    pageStatsMap.set(v.path, entry);
  });
  const topPages = Array.from(pageStatsMap.entries())
    .map(([path, stat]) => ({
      path,
      visits: stat.visits,
      avgDurationSeconds: stat.durationSamples > 0 ? Math.round(stat.totalDuration / stat.durationSamples) : 0
    }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 12);

  // Visits per day for the last 7 days
  const dailyMap = new Map<string, number>();
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dailyMap.set(d.toISOString().split('T')[0], 0);
  }
  views.forEach(v => {
    const dateKey = v.started_at.split('T')[0];
    if (dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + 1);
    }
  });
  const dailyVisits = Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count }));

  const todayKey = today.toISOString().split('T')[0];
  const todayViews = views.filter(v => v.started_at.split('T')[0] === todayKey);
  const todayVisits = todayViews.length;
  const todayUniqueVisitors = new Set(todayViews.map(v => v.session_id)).size;

  const recentVisits = views.slice(-30).reverse().map(v => ({
    id: v.id,
    path: v.path,
    duration_seconds: v.duration_seconds,
    started_at: v.started_at,
    user: v.user_id ? (users.find(u => u.id === v.user_id)?.email || 'Registered User') : 'Anonymous Visitor'
  }));

  res.json({
    totalVisits: views.length,
    uniqueVisitors: uniqueSessions.size,
    avgDurationSeconds,
    todayVisits,
    todayUniqueVisitors,
    topPages,
    dailyVisits,
    recentVisits
  });
});

app.get('/api/admin/users', authenticateJWT, adminOnly, (req, res) => {
  const users = dbService.getUsers();
  res.json(users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone || '',
    email_verified: u.email_verified,
    is_admin: u.is_admin,
    created_at: u.created_at
  })));
});

// Update single user (toggle admin/verify, delete etc)
app.put('/api/admin/users/:id', authenticateJWT, adminOnly, (req, res) => {
  const userId = Number(req.params.id);
  const { email_verified } = req.body;

  const db = dbService.read();
  const user = db.users.find(u => u.id === userId);

  if (!user) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }

  // Admin rights are locked to ADMIN_EMAIL and cannot be granted/revoked through this endpoint.
  if (typeof email_verified === 'boolean') user.email_verified = email_verified;

  dbService.saveUser(user);
  res.json({ message: 'User updated successfully', user });
});

// Admin: permanently delete a user account (and everything tied to it — orders,
// downloads, bookings, payment claims). The admin's own account can never be deleted.
app.delete('/api/admin/users/:id', authenticateJWT, adminOnly, (req, res) => {
  const userId = Number(req.params.id);
  const user = dbService.getUsers().find(u => u.id === userId);

  if (!user) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }
  if (user.is_admin) {
    res.status(400).json({ message: 'The admin account cannot be deleted.' });
    return;
  }

  dbService.deleteUser(userId);
  dlog(`Admin permanently deleted user ${user.email} (id ${userId}).`);
  res.json({ message: `${user.email} was permanently deleted.` });
});

// Admin: directly grant or revoke kit access for a specific user, independent of any payment claim
app.post('/api/admin/users/:id/access', authenticateJWT, adminOnly, (req, res) => {
  const userId = Number(req.params.id);
  const { grant } = req.body;

  if (typeof grant !== 'boolean') {
    res.status(400).json({ message: '"grant" must be true or false.' });
    return;
  }

  const user = dbService.getUsers().find(u => u.id === userId);
  if (!user) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }

  const orders = dbService.getOrders();

  if (grant) {
    const alreadyPurchased = orders.some(o => o.user_id === userId && o.status === 'completed');
    if (alreadyPurchased) {
      res.status(400).json({ message: 'This user already has access.' });
      return;
    }
    const orderId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1;
    const newOrder: Order = {
      id: orderId,
      user_id: userId,
      payment_id: `admin_manual_grant_${orderId}`,
      razorpay_order_id: `admin_grant_${Date.now()}`,
      amount: dbService.getPricingConfig().amount,
      status: 'completed',
      purchase_date: new Date().toISOString()
    };
    dbService.saveOrder(newOrder);
    dlog(`Admin manually granted kit access to ${user.email}.`);
    res.json({ message: `Access granted to ${user.email}.`, order: newOrder });
  } else {
    const userOrders = orders.filter(o => o.user_id === userId && o.status === 'completed');
    if (userOrders.length === 0) {
      res.status(400).json({ message: 'This user does not currently have access.' });
      return;
    }
    userOrders.forEach(o => {
      o.status = 'failed';
      dbService.saveOrder(o);
    });
    dlog(`Admin manually revoked kit access from ${user.email}.`);
    res.json({ message: `Access revoked from ${user.email}.` });
  }
});

app.get('/api/admin/orders', authenticateJWT, adminOnly, (req, res) => {
  const orders = dbService.getOrders();
  const users = dbService.getUsers();

  const enrichedOrders = orders.map(o => {
    const shopper = users.find(u => u.id === o.user_id);
    return {
      ...o,
      user_name: shopper ? shopper.name : 'Unknown',
      user_email: shopper ? shopper.email : 'Unknown',
      user_phone: shopper?.phone || ''
    };
  });

  res.json(enrichedOrders);
});

app.get('/api/admin/testimonials', authenticateJWT, adminOnly, (req, res) => {
  const testimonials = dbService.getTestimonials();
  res.json(testimonials);
});

// Approve/Reject testimonial toggle
app.put('/api/admin/testimonials/:id/approve', authenticateJWT, adminOnly, (req, res) => {
  const id = Number(req.params.id);
  const { approved } = req.body;

  const db = dbService.read();
  const testimonial = db.testimonials.find(t => t.id === id);

  if (!testimonial) {
    res.status(404).json({ message: 'Testimonial not found.' });
    return;
  }

  testimonial.approved = !!approved;
  dbService.saveTestimonial(testimonial);

  res.json({ message: `Testimonial approval state updated to ${approved}`, testimonial });
});

app.delete('/api/admin/testimonials/:id', authenticateJWT, adminOnly, (req, res) => {
  const id = Number(req.params.id);
  const success = dbService.deleteTestimonial(id);
  if (success) {
    res.json({ message: 'Testimonial deleted successfully.' });
  } else {
    res.status(404).json({ message: 'Testimonial not found' });
  }
});

// Config timing and pricing update from Admin
app.post('/api/admin/config', authenticateJWT, adminOnly, (req, res) => {
  const { amount, original_amount, timer_duration_hours } = req.body;

  if (amount) {
    dbService.updatePricingConfig(Number(amount), Number(original_amount || 1999));
  }

  if (timer_duration_hours) {
    dbService.updateTimerConfig(Number(timer_duration_hours));
  }

  res.json({
    message: 'Pricing and Timer configs updated instantly on backend!',
    pricing: dbService.getPricingConfig(),
    timer: dbService.getTimerConfig()
  });
});


// --- MANUAL UPI QR PAYMENT PROOF WORKFLOW ---

// Public: buy page needs to render your QR + UPI id + current price
app.get('/api/payments/upi-config', (req, res) => {
  const upi = dbService.getUpiConfig();
  const pricing = dbService.getPricingConfig();
  res.json({
    upi_id: upi.upi_id,
    qr_image: upi.qr_image,
    amount: pricing.amount,
    configured: !!upi.qr_image
  });
});

// Admin: set/replace the QR code image shown to buyers (UPI ID text is optional)
// The QR image is entirely optional — the admin can remove it at any time to stop
// showing a payment option to buyers, with no requirement to have one configured.
app.post('/api/admin/upi-config', authenticateJWT, adminOnly, (req, res) => {
  const { upi_id, qr_image } = req.body;

  const updated = dbService.updateUpiConfig(String(upi_id || '').trim(), String(qr_image || ''));
  res.json({
    message: qr_image ? 'QR code uploaded — now visible to buyers.' : 'QR code removed — payments are hidden from buyers until a new one is uploaded.',
    upi: updated
  });
});

// Buyer: submit a screenshot + optional UTR after paying via UPI
app.post('/api/payments/submit-proof', authenticateJWT, (req: AuthenticatedRequest, res) => {
  const userDecoded = req.user!;
  const { screenshot, utr } = req.body;

  if (!screenshot || typeof screenshot !== 'string' || !screenshot.startsWith('data:image/')) {
    res.status(400).json({ message: 'A valid payment screenshot image is required.' });
    return;
  }

  const orders = dbService.getOrders();
  if (orders.some(o => o.user_id === userDecoded.id && o.status === 'completed')) {
    res.status(400).json({ message: 'You already have full access to this kit.' });
    return;
  }

  const claims = dbService.getPaymentClaims(userDecoded.id);
  if (claims.some(c => c.status === 'pending')) {
    res.status(400).json({ message: 'You already have a payment proof under review. Please wait for it to be approved.' });
    return;
  }

  const user = dbService.getUsers().find(u => u.id === userDecoded.id);
  if (!user) {
    res.status(404).json({ message: 'User profile not found.' });
    return;
  }

  const allClaims = dbService.getPaymentClaims();
  const id = allClaims.length > 0 ? Math.max(...allClaims.map(c => c.id)) + 1 : 1;
  const pricing = dbService.getPricingConfig();

  const claim: PaymentClaim = {
    id,
    user_id: user.id,
    user_name: user.name,
    user_email: user.email,
    amount: pricing.amount,
    utr: utr ? String(utr).trim() : null,
    screenshot,
    status: 'pending',
    admin_note: null,
    submitted_at: new Date().toISOString(),
    reviewed_at: null
  };

  dbService.savePaymentClaim(claim);
  dlog(`Payment proof submitted by ${user.email} (claim #${id}), awaiting admin review.`);

  res.status(201).json({ message: 'Payment proof submitted! We will verify and unlock your access shortly.' });
});

// Buyer: check the status of their own latest payment claim
app.get('/api/payments/my-claim', authenticateJWT, (req: AuthenticatedRequest, res) => {
  const userDecoded = req.user!;
  const claims = dbService.getPaymentClaims(userDecoded.id);
  const latest = claims.length > 0 ? claims[claims.length - 1] : null;
  res.json({
    claim: latest ? {
      id: latest.id,
      status: latest.status,
      amount: latest.amount,
      submitted_at: latest.submitted_at,
      admin_note: latest.admin_note
    } : null
  });
});

// Admin: list every submitted payment claim, newest first (includes screenshot for review)
app.get('/api/admin/payment-claims', authenticateJWT, adminOnly, (req, res) => {
  const claims = dbService.getPaymentClaims();
  res.json([...claims].reverse());
});

// Admin: approve a claim -> grants access by creating a completed order
app.post('/api/admin/payment-claims/:id/approve', authenticateJWT, adminOnly, (req, res) => {
  const id = Number(req.params.id);
  const claims = dbService.getPaymentClaims();
  const claim = claims.find(c => c.id === id);

  if (!claim) {
    res.status(404).json({ message: 'Payment claim not found.' });
    return;
  }
  if (claim.status !== 'pending') {
    res.status(400).json({ message: `This claim was already ${claim.status}.` });
    return;
  }

  claim.status = 'approved';
  claim.reviewed_at = new Date().toISOString();
  dbService.savePaymentClaim(claim);

  const orders = dbService.getOrders();
  const orderId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1;
  const newOrder: Order = {
    id: orderId,
    user_id: claim.user_id,
    payment_id: `upi_claim_${claim.id}`,
    razorpay_order_id: claim.utr || `manual_upi_${claim.id}`,
    amount: claim.amount,
    status: 'completed',
    purchase_date: new Date().toISOString()
  };
  dbService.saveOrder(newOrder);

  dlog(`Admin approved payment claim #${claim.id} for ${claim.user_email}. Access granted.`);
  res.json({ message: 'Payment approved. User access unlocked.', claim, order: newOrder });
});

// Admin: reject a claim (fake/wrong-amount screenshot, etc.)
app.post('/api/admin/payment-claims/:id/reject', authenticateJWT, adminOnly, async (req, res) => {
  const id = Number(req.params.id);
  const { reason } = req.body;
  const claims = dbService.getPaymentClaims();
  const claim = claims.find(c => c.id === id);

  if (!claim) {
    res.status(404).json({ message: 'Payment claim not found.' });
    return;
  }
  if (claim.status !== 'pending') {
    res.status(400).json({ message: `This claim was already ${claim.status}.` });
    return;
  }

  const rejectionReason = reason ? String(reason).trim() : 'The screenshot could not be verified.';
  claim.status = 'rejected';
  claim.admin_note = rejectionReason;
  claim.reviewed_at = new Date().toISOString();
  dbService.savePaymentClaim(claim);

  dlog(`Admin rejected payment claim #${claim.id} for ${claim.user_email}.`);

  // Best-effort notification — the rejection itself is already saved, so a failed
  // email dispatch here shouldn't fail the whole request or block the admin.
  const emailDelivered = await sendPaymentRejectedEmail(claim.user_email, claim.user_name, rejectionReason);
  if (!emailDelivered) {
    dlog(`Could not email rejection notice to ${claim.user_email} (claim #${claim.id}).`);
  }

  res.json({ message: 'Payment claim rejected.', claim, notified: emailDelivered });
});

// --- EDITABLE SITE CONTENT (admin CMS-lite for Home / Syllabus / Contact copy) ---

// Public: every page fetches the current editable copy from here
app.get('/api/site-content', (req, res) => {
  res.json(dbService.getSiteContent());
});

// Admin: update any subset of home / toolkitItems / contact
app.post('/api/admin/site-content', authenticateJWT, adminOnly, (req, res) => {
  const { home, toolkitItems, contact } = req.body;

  const partial: Partial<SiteContent> = {};
  if (home) partial.home = home;
  if (Array.isArray(toolkitItems)) partial.toolkitItems = toolkitItems;
  if (contact) partial.contact = contact;

  if (!partial.home && !partial.toolkitItems && !partial.contact) {
    res.status(400).json({ message: 'No content fields were provided to update.' });
    return;
  }

  const updated = dbService.updateSiteContent(partial);
  dlog('Admin updated editable site content.');
  res.json({ message: 'Site content updated.', siteContent: updated });
});

// Admin: directly author a new testimonial (auto-approved since staff-authored)
app.post('/api/admin/testimonials', authenticateJWT, adminOnly, (req, res) => {
  const { user_name, role, comment, rating } = req.body;

  if (!user_name || !role || !comment || !rating) {
    res.status(400).json({ message: 'Name, role, comment and rating are all required.' });
    return;
  }

  const testimonials = dbService.getTestimonials();
  const id = testimonials.length > 0 ? Math.max(...testimonials.map(t => t.id)) + 1 : 1;

  const testimonial: Testimonial = {
    id,
    user_name: String(user_name).trim(),
    role: String(role).trim(),
    comment: String(comment).trim(),
    rating: Math.min(5, Math.max(1, Number(rating))),
    approved: true,
    created_at: new Date().toISOString()
  };

  dbService.saveTestimonial(testimonial);
  res.status(201).json({ message: 'Testimonial added.', testimonial });
});

// Admin: fully edit an existing testimonial's text/rating/approval
app.put('/api/admin/testimonials/:id', authenticateJWT, adminOnly, (req, res) => {
  const id = Number(req.params.id);
  const { user_name, role, comment, rating, approved } = req.body;

  const db = dbService.read();
  const testimonial = db.testimonials.find(t => t.id === id);
  if (!testimonial) {
    res.status(404).json({ message: 'Testimonial not found.' });
    return;
  }

  if (user_name !== undefined) testimonial.user_name = String(user_name).trim();
  if (role !== undefined) testimonial.role = String(role).trim();
  if (comment !== undefined) testimonial.comment = String(comment).trim();
  if (rating !== undefined) testimonial.rating = Math.min(5, Math.max(1, Number(rating)));
  if (approved !== undefined) testimonial.approved = !!approved;

  dbService.saveTestimonial(testimonial);
  res.json({ message: 'Testimonial updated.', testimonial });
});

// --- INTEGRATING VITE DEV MIDDLEWARE OR PRODUCTION SERVING ---
async function startServer() {
  // Block on the DB (Neon or local file) being fully loaded before accepting any traffic.
  await dbService.waitUntilReady();
  dlog("Database service ready.");

  // Rolling DB backups — one on boot, then hourly, keeping the last 24 (~1 day of history).
  dbService.backup();
  setInterval(() => dbService.backup(), 60 * 60 * 1000);

  if (process.env.NODE_ENV !== 'production') {
    dlog("Enabling Vite Development hot-rebuilding server middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    // This feeds express requests to Vite parser
    app.use(vite.middlewares);
  } else {
    dlog("Setting production static content headers and paths...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    dlog(`Unified Server effectively listening at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("FATAL ERROR: Could not launch main express full-stack server", err);
});
