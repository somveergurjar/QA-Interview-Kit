import React, { useState, useEffect } from 'react';
import { 
  Download, FileSpreadsheet, FileText, CheckCircle2, History, UserCheck, 
  MessageSquare, Star, Plus, ShieldCheck, Loader2, Sparkles, BookOpen, AlertCircle, Save,
  Copy, Check, Terminal, Calendar, Send, Award, Users, RefreshCw, Play, ArrowRight
} from 'lucide-react';
import { User, Order } from '../types.js';

const AI_PRESETS = [
  { key: 'manual_testing', name: 'Manual Testing Masterclass', defaultTopic: 'Detailed Advanced Study Notes on SDLC, STLC, Test Case Design Matrix, and Defect Lifecycles with real Severity vs Priority parameters.' },
  { key: 'selenium_java', name: 'Selenium Java Automation', defaultTopic: 'Advanced Selenium Java architecture guide focusing on thread-safe WebDrivers, custom Waits, Actions class workflows, robust POM framework, and TestNG listeners.' },
  { key: 'api_testing', name: 'API Testing & Rest Assured', defaultTopic: 'Advanced REST API test matrix with HTTP methods, auth strategies, Postman variable chaining, and production-grade REST Assured custom filters/assertions.' },
  { key: 'git_github', name: 'Git & GitHub Workflows', defaultTopic: 'CI Git branching strategies (GitFlow vs Trunk-based), conflict resolution, pull request guidelines, and deep-dive git commands.' },
  { key: 'cicd_jenkins', name: 'CI/CD Jenkins Pipelines', defaultTopic: 'Production Jenkins declaratives and GitHub Actions advanced pipelines with Dockerized test agents, parallel execution groups, and telemetry logs.' },
  { key: 'qa_interviews', name: 'Staff SDET Interview Questions', defaultTopic: 'Master checklist of 25 hardest technical scenario-based QA interview questions with exhaustive architect-level responses.' }
];

const AI_STEPS = [
  "Consulting Principal QA Architect intelligence...",
  "Drafting thread-safe POM automation classes...",
  "Stitching together detailed SDLC & STLC matrices...",
  "Generating professional deflecting report mockups...",
  "Assembling Jenkins declarative pipeline stages...",
  "Refining edge-case checklists & mock parameters...",
  "Injecting robust flakiness mitigation layers...",
  "Finalizing beautiful markdown document formatting..."
];

// Modern radial progress ring — shows real coursework completion at a glance
function CircularProgress({ percent, size = 96, strokeWidth = 8 }: { percent: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;
  const gradId = 'dashProgressGradient';

  return (
    <div className="relative progress-ring-wrap" style={{ width: size, height: size }}>
      <span className="progress-ring-glow" />
      <svg width={size} height={size} className="-rotate-90 relative z-10">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="none"
          className="text-slate-200 dark:text-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={`url(#${gradId})`}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="progress-ring-fg"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <span className="font-display font-black text-lg leading-none">{Math.round(percent)}%</span>
        <span className="text-[8px] text-gray-400 uppercase tracking-wider mt-0.5">Complete</span>
      </div>
    </div>
  );
}

interface DashboardViewProps {
  user: User;
  token: string;
  darkMode: boolean;
  onRefreshUser: () => void;
  onInitiatePurchase: () => void;
}

export default function DashboardView({ user, token, darkMode, onRefreshUser, onInitiatePurchase }: DashboardViewProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [downloadHistory, setDownloadHistory] = useState<any[]>([]);
  const [isPurchased, setIsPurchased] = useState(false);
  const [loading, setLoading] = useState(true);

  // AI Notes Generator states
  const [aiPreset, setAiPreset] = useState('manual_testing');
  const [customTopic, setCustomTopic] = useState('');
  const [generatedNotes, setGeneratedNotes] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiSuccess, setAiSuccess] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);

  // --- MODULE COMPLETION TRACKING STATES ---
  const [completedMaterials, setCompletedMaterials] = useState<string[]>([]);

  // --- PRACTICE CERTIFICATION QUIZ STATES ---
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizPassed, setQuizPassed] = useState(false);
  const [quizError, setQuizError] = useState('');

  // --- 1:1 INTERVIEW SIMULATOR & MOCK BOOKING STATES ---
  const [interviewTrack, setInterviewTrack] = useState('Selenium Java Automation SDET');
  const [chatMessages, setChatMessages] = useState<{ sender: 'interviewer' | 'candidate'; text: string; time: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  
  // Custom Interview Report State
  const [interviewReport, setInterviewReport] = useState<string>('');
  const [generatingReport, setGeneratingReport] = useState(false);

  // Slot Booking inputs
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingFocus, setBookingFocus] = useState('Selenium Test Automation');
  const [bookingResumeUrl, setBookingResumeUrl] = useState('');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [activeBookings, setActiveBookings] = useState<any[]>([]);

  const fetchBookings = () => {
    fetch('/api/bookings', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setActiveBookings(data);
        }
      })
      .catch(err => console.error(err));
  };

  // Active tab in mock room
  const [interviewTab, setInterviewTab] = useState<'simulator' | 'booking'>('simulator');

  // Synchronize completion progress and quiz passed with local storage
  useEffect(() => {
    if (user && user.email) {
      const emailKey = user.email.toLowerCase().trim();
      
      // Load completed materials list
      const savedCompleted = localStorage.getItem(`completed_mat_${emailKey}`);
      if (savedCompleted) {
        try {
          setCompletedMaterials(JSON.parse(savedCompleted));
        } catch (_) {}
      } else {
        setCompletedMaterials([]);
      }

      // Load quiz pass state
      const savedPassed = localStorage.getItem(`quiz_passed_${emailKey}`);
      setQuizPassed(savedPassed === 'true');

      // Load quiz score
      const savedScores = localStorage.getItem(`quiz_score_${emailKey}`);
      if (savedScores) {
        setQuizScore(Number(savedScores));
      } else {
        setQuizScore(0);
      }
    }
  }, [user]);

  const handleToggleMaterialComplete = (key: string) => {
    if (!user || !user.email) return;
    const emailKey = user.email.toLowerCase().trim();
    let updated: string[];
    if (completedMaterials.includes(key)) {
      updated = completedMaterials.filter(k => k !== key);
    } else {
      updated = [...completedMaterials, key];
    }
    setCompletedMaterials(updated);
    localStorage.setItem(`completed_mat_${emailKey}`, JSON.stringify(updated));
  };

  const handleBypassUnlock = () => {
    if (!user || !user.email) return;
    const emailKey = user.email.toLowerCase().trim();
    
    // Complete all 13 materials
    const allKeys = materials.map(m => m.key);
    setCompletedMaterials(allKeys);
    localStorage.setItem(`completed_mat_${emailKey}`, JSON.stringify(allKeys));

    // Complete quiz with 100%
    setQuizPassed(true);
    setQuizScore(100);
    localStorage.setItem(`quiz_passed_${emailKey}`, 'true');
    localStorage.setItem(`quiz_score_${emailKey}`, '100');
  };

  // Quiz questions constants
  const QUIZ_QUESTIONS = [
    {
      id: 1,
      question: "When running technical automation suites concurrently in TestNG/JUnit, how do you prevent Thread Safety issues with WebDriver instances?",
      options: {
        A: "Declare the WebDriver as a static global field across all class blueprints",
        B: "Instantiate a single global WebDriver and reference it from different helper step definitions",
        C: "Wrap your dynamic WebDriver instances inside a ThreadLocal wrapper class",
        D: "Re-initialize the entire browser setup at each individual helper findElement action"
      },
      correct: "C",
      explanation: "Wrapping the WebDriver instance inside a ThreadLocal wrapper class ensures that each execution thread holds its own separate driver copy, preventing race conditions or session collisions."
    },
    {
      id: 2,
      question: "Which HTTP status validation response strictly confirms that a client POST resource creation request was successfully received and a record has been finalized?",
      options: {
        A: "200 Okay",
        B: "201 Created",
        C: "202 Accepted",
        D: "204 No Content"
      },
      correct: "B",
      explanation: "HTTP 201 Created explicitly confirms that a resource has been successfully generated on the server following a persistent action like POST."
    },
    {
      id: 3,
      question: "If a severe regression scenario exists in production but is only visible on an auxiliary screen and can be bypassed with a simple client-side link, how would you classify its severity and priority?",
      options: {
        A: "Critical Severity, High Priority",
        B: "Low Severity, Low Priority",
        C: "Low Severity, High Priority",
        D: "High Severity, Critical Priority"
      },
      correct: "B",
      explanation: "Because the defect has low technical impact on business flows and an immediate bypass exists, it is classified as Low Severity with Low Priority."
    },
    {
      id: 4,
      question: "In standard production-grade Page Object Model, what is the best practice regarding compiling assertive evaluations inside page element files?",
      options: {
        A: "Encode assertion checks (like assertEquals) directly inside the Page Object methods",
        B: "Maintain Page classes strictly for actions/states, returning indicators so assertions stay cleanly in test files",
        C: "Skip test verification completely inside your frameworks and rely solely on console outputs",
        D: "Never define WebLocator patterns inside classes; store locator strategies directly in test classes instead"
      },
      correct: "B",
      explanation: "Page classes should only model page items and their behavior (actions), keeping assertion scripts within the testing layer to ensure maximum class re-usability."
    },
    {
      id: 5,
      question: "Which synchronization strategy is recommended for handling dynamic async elements loading under standard server latency?",
      options: {
        A: "Hardcoded JVM threads sleep pauses like Thread.sleep(5000)",
        B: "Global implicit driver timeout set permanently to 60 seconds",
        C: "Explicit Dynamic/Fluent waiting triggers targeting visibility or active element states",
        D: "Immediate timeout settings set to 1500ms to fail-fast the build"
      },
      correct: "C",
      explanation: "Explicit / Fluent waits wait dynamically for the element condition to pass before continuing, avoiding the waste of time of hardcoded sleep calls while remaining robust."
    },
    {
      id: 6,
      question: "In a Jenkins declarative pipeline execution cycle, which construct enables post-execution cleanups of workspaces even if prior stages crash?",
      options: {
        A: "Wrapping statements in direct shell strings inside standard success blocks",
        B: "Invoking custom clean commands at the start of following test steps",
        C: "Utilizing the secure post { always { ... } } block instruction set",
        D: "Letting Docker containers cluster automatically recreate after every run"
      },
      correct: "C",
      explanation: "The pipeline post-always block is guaranteed to execute at the end of the build cycle regardless of whether the pipeline succeeded, failed, or was aborted."
    }
  ];

  const handleQuizSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuizError('');
    
    // Validate that all questions are answered
    if (Object.keys(quizAnswers).length < QUIZ_QUESTIONS.length) {
      setQuizError(`Please answer all ${QUIZ_QUESTIONS.length} questions before submitting.`);
      return;
    }

    let correctCount = 0;
    QUIZ_QUESTIONS.forEach(q => {
      if (quizAnswers[q.id] === q.correct) {
        correctCount++;
      }
    });

    const scorePct = Math.round((correctCount / QUIZ_QUESTIONS.length) * 100);
    const passed = scorePct >= 80;

    setQuizScore(scorePct);
    setQuizPassed(passed);
    setQuizSubmitted(true);

    if (user && user.email) {
      const emailKey = user.email.toLowerCase().trim();
      localStorage.setItem(`quiz_passed_${emailKey}`, passed ? 'true' : 'false');
      localStorage.setItem(`quiz_score_${emailKey}`, String(scorePct));
    }
  };

  const handleQuizReset = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizError('');
  };

  // --- 1:1 CHAT MOCK INTERVIEW CHAT SUBMIT ---
  const handleStartMockInterview = async () => {
    setChatMessages([]);
    setChatLoading(true);
    setChatError('');
    setInterviewReport('');

    const initialMessages = [
      { sender: 'candidate' as const, text: `Hello, I'm here for my 1-to-1 dynamic mock interview. My selected track is: ${interviewTrack}. Let me know when you are ready to begin!`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ];
    setChatMessages(initialMessages);

    try {
      const res = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          track: interviewTrack,
          messages: initialMessages
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Interviewer took a break. Retry.');
      }
      setChatMessages(prev => [
        ...prev,
        { sender: 'interviewer' as const, text: data.reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
    } catch (err: any) {
      setChatError(err.message || 'Connection with mentor channel failed.');
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userText = chatInput.trim();
    setChatInput('');
    setChatError('');

    const updatedMessages = [
      ...chatMessages,
      { sender: 'candidate' as const, text: userText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ];
    setChatMessages(updatedMessages);
    setChatLoading(true);

    try {
      const res = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          track: interviewTrack,
          messages: updatedMessages
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to exchange signals. Please try sending your answer again.');
      }
      setChatMessages(prev => [
        ...prev,
        { sender: 'interviewer' as const, text: data.reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
    } catch (err: any) {
      setChatError(err.message || 'Failed to send answer.');
    } finally {
      setChatLoading(false);
    }
  };

  // Generate a detailed mock interview final report using Gemini
  const handleGenerateInterviewReport = async () => {
    if (chatMessages.length < 3) {
      alert("Please conduct at least 2 rounds of Q&A with the interviewer to generate a meaningful report!");
      return;
    }
    setGeneratingReport(true);
    setChatError('');

    try {
      const res = await fetch('/api/notes/generate-advanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          topic: `Generate a highly professional, detailed, 1-to-1 Interview Performance Report Card for the candidate. Desired Job Track: ${interviewTrack}. 
          Evaluate their communication skills, technical precision, coding strategy responses, design capabilities, and area of core strengths based on this exact actual mock interview transcript:
          
          ${chatMessages.map(m => `${m.sender === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.text}`).join('\n\n')}
          
          Provide a scored scorecard (0-100) across:
          - Core Automation Concepts
          - Scenario Troubleshooting
          - Communication Clarity
          - Overall Fit

          Then provide 3 actionable bulleted tips for technical round masteries.`
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Report compile failed.');
      }
      setInterviewReport(data.content);
    } catch (err: any) {
      setChatError(err.message || 'Failed to formulate interview report.');
    } finally {
      setGeneratingReport(false);
    }
  };

  // Handle Mock booking confirmations
  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDate || !bookingTime) {
      alert('Please specify date and time fields!');
      return;
    }

    let typeCode = 'coding';
    if (bookingFocus.includes('Design') || bookingFocus.includes('Architecture')) {
      typeCode = 'design';
    } else if (bookingFocus.includes('Resume') || bookingFocus.includes('Pitch')) {
      typeCode = 'resume';
    }

    fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        session_type: typeCode,
        date_time: `${bookingDate} at ${bookingTime}`
      })
    })
    .then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to book slot.');
      }
      const details = {
        date: bookingDate,
        time: bookingTime,
        focus: bookingFocus,
        resume: bookingResumeUrl || 'Auto-generated Resume profile linked',
        meetingId: 'meet-qa-1to1-' + Math.floor(Math.random() * 900000 + 100000)
      };
      setBookingDetails(details);
      setBookingConfirmed(true);
      fetchBookings();
    })
    .catch((err) => {
      alert(err.message || 'Something went wrong while scheduling.');
    });
  };

  // Rotate steps for AI notes builder
  useEffect(() => {
    let interval: any;
    if (aiLoading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % AI_STEPS.length);
      }, 2500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [aiLoading]);

  const handleGenerateAiNotes = async () => {
    setAiLoading(true);
    setAiError('');
    setAiSuccess('');
    setGeneratedNotes('');

    // Determine final topic text to send
    const finalTopic = customTopic.trim() || 
      (AI_PRESETS.find(p => p.key === aiPreset)?.defaultTopic || 'Advanced QA notes');

    try {
      const response = await fetch('/api/notes/generate-advanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ topic: finalTopic })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate dynamic notes.');
      }

      setGeneratedNotes(data.content);
      setAiSuccess('Advanced level notes successfully built!');
    } catch (err: any) {
      setAiError(err.message || 'An unexpected request handling event triggered.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopyNotes = () => {
    if (!generatedNotes) return;
    navigator.clipboard.writeText(generatedNotes)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch((err) => console.error(err));
  };

  const handleDownloadNotesMd = () => {
    if (!generatedNotes) return;
    const blob = new Blob([generatedNotes], { type: 'text/markdown; charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    const displayTopic = customTopic.trim() || (AI_PRESETS.find(p => p.key === aiPreset)?.name || 'advanced_qa_notes');
    const sanitizedName = displayTopic.toLowerCase().replace(/[^a-z0-9_]/gi, '_') + '_study_notes.md';
    a.href = url;
    a.download = sanitizedName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  // User Profile Inputs
  const [profileName, setProfileName] = useState(user.name);
  const [profileEmail, setProfileEmail] = useState(user.email);
  const [profilePhone, setProfilePhone] = useState(user.phone || '');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Testimonial Form Inputs
  const [testmRole, setTestmRole] = useState('QA Engineer');
  const [testmComment, setTestmComment] = useState('');
  const [testmRating, setTestmRating] = useState(5);
  const [testmSuccess, setTestmSuccess] = useState('');
  const [testmError, setTestmError] = useState('');
  const [testmLoading, setTestmLoading] = useState(false);

  const materials = [
    { key: "manual_notes", title: "Manual Testing & Scenario Designing Notes", type: "Markdown Study Book" },
    { key: "programming_oop_notes", title: "Programming & OOP for Testers (Java & TS) Guide", type: "OOP Structural Guide" },
    { key: "api_notes", title: "API Testing & Postman Guide", type: "API Automation Manual" },
    { key: "selenium_notes", title: "Selenium UI Automation (Java) Playbook", type: "Java Code Blueprint" },
    { key: "playwright_notes", title: "Playwright UI Automation (TypeScript) Guide", type: "TS Code Blueprint" },
    { key: "framework_arch_notes", title: "Framework Architecture & POM Patterns Notes", type: "Structural Code Blueprint" },
    { key: "sql_notes", title: "SQL & Relational Database Verification Manual", type: "SQL Query Cheat Sheet" },
    { key: "git_notes", title: "Git & Version Control for Testers Handbook", type: "Git Versioning Book" },
    { key: "cicd_notes", title: "CI/CD Orchestration & GitHub Actions Manual", type: "YAML Workflow Build" },
    { key: "performance_k6_notes", title: "Performance Testing with k6 Scripting Guide", type: "k6 Load Performance Book" },
    { key: "ai_testing_notes", title: "AI in Automated Testing & Prompt Engineering Guide", type: "AI Prompting Integration" },
    { key: "interview_qas", title: "100+ Curated Key QA/SDET Interview Answers", type: "Premium Interactive Q&As" },
    { key: "live_interviews", title: "3x 1-on-1 Live Mock Practice Guide & Booking", type: "1-on-1 Expert Sessions" }
  ];

  useEffect(() => {
    // 1. Fetch payment status
    fetch('/api/payments/status', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        setIsPurchased(data.purchased);
        if (data.purchased && data.order) {
          setOrders([data.order]);
        }
      })
      .catch((err) => console.error("Error loaded payment info", err));

    // 2. Fetch downloads history log
    fetch('/api/notes/download-history', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setDownloadHistory(data))
      .catch((err) => console.error("Error fetching download counts", err))
      .finally(() => setLoading(false));

    // 3. Fetch user bookings
    fetchBookings();
  }, [token]);

  // Handle individual note file download queries
  const triggerDownload = (fileKey: string, filename: string) => {
    fetch(`/api/notes/download/${fileKey}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Could not acquire file check.");
        }
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        // Refresh download logging history checklist
        refreshDownloadHistory();
      })
      .catch((err) => {
        alert("Verification required. Please verify that you have completed the purchase flow.");
      });
  };

  const refreshDownloadHistory = () => {
    fetch('/api/notes/download-history', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => setDownloadHistory(data))
      .catch((err) => console.error(err));
  };

  // Download all files merged inside in-memory ZIP package
  const triggerDownloadAll = () => {
    fetch('/api/notes/download-all', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Purchase required before pulling assets zip compilation.");
        }
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "QA_Interview_Kit_Ultimate_Compilation.zip";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        refreshDownloadHistory();
      })
      .catch((err) => {
        alert("Unlock required. Purchase this QA kit to trigger the bundle compiled zip build.");
      });
  };

  // Update Profile details from Admin or Client dashboard lists
  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (profilePhone && !/^\d{10}$/.test(profilePhone)) {
      setProfileError('Mobile number must be exactly 10 digits.');
      return;
    }
    setProfileLoading(true);
    setProfileSuccess('');
    setProfileError('');

    fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: profileName,
        email: profileEmail,
        phone: profilePhone,
        password: profilePassword || undefined
      })
    })
      .then((res) => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.message || 'Failed to update credentials.');
        setProfileSuccess('Profile credentials successfully updated!');
        setProfilePassword('');
        onRefreshUser();
      })
      .catch((err) => setProfileError(err.message))
      .finally(() => setProfileLoading(false));
  };

  // Submit test review testimonial feedback from client dashboard
  const handleTestimonialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testmComment) {
      setTestmError('Write a comment before sending reviews.');
      return;
    }

    setTestmLoading(true);
    setTestmSuccess('');
    setTestmError('');

    fetch('/api/testimonials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        role: testmRole,
        comment: testmComment,
        rating: testmRating
      })
    })
      .then((res) => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.message || 'Feedback rejected.');
        setTestmSuccess(data.message || 'Feedback submitted successfully!');
        setTestmComment('');
      })
      .catch((err) => setTestmError(err.message))
      .finally(() => setTestmLoading(false));
  };

  const hasAccess = user.is_admin || isPurchased;

  return (
    <div className={`min-h-screen py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
      darkMode ? 'bg-slate-900 text-gray-100' : 'bg-slate-50 text-gray-800'
    }`}>
      <div className="max-w-7xl mx-auto space-y-10 animate-fadeIn">
        
        {/* Welcome greeting banner */}
        <div className={`p-6 sm:p-8 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 ${
          darkMode 
            ? 'bg-slate-850 border-slate-800 shadow-xl' 
            : 'bg-white border-slate-200 shadow'
        }`}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1 rounded bg-emerald-500/10 text-emerald-500 font-semibold text-xs tracking-wider uppercase">
                Active Member Area
              </span>
              {user.is_admin && (
                <span className="p-1 rounded bg-indigo-500/10 text-indigo-400 font-semibold text-xs tracking-wider uppercase">
                  Staff Admin Privilege
                </span>
              )}
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight">
              Hello, <span className="text-emerald-500">{user.name}</span>
            </h1>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Account: <strong className="font-mono">{user.email}</strong> • Joined: {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>

          {hasAccess && (
            <CircularProgress percent={(completedMaterials.length / materials.length) * 100} />
          )}

          <div>
            {hasAccess ? (
              <button
                onClick={triggerDownloadAll}
                id="btn-zip-download-all"
                className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-extrabold shadow-lg shadow-emerald-500/10 flex items-center gap-2 transition cursor-pointer"
              >
                <Download className="w-4.5 h-4.5 animate-bounce" />
                <span>Download Kit ZIP Bundle (All 13 Files)</span>
              </button>
            ) : (
              <div className="flex flex-col items-end gap-2 text-right">
                <span className="text-xs font-bold text-red-500 bg-red-500/10 px-3 py-1 rounded-full flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> Pending Payment
                </span>
                <button
                  onClick={onInitiatePurchase}
                  id="btn-dashboard-get-access"
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-extrabold shadow-lg shadow-emerald-500/10 flex items-center gap-2 transition cursor-pointer"
                >
                  <ShieldCheck className="w-4.5 h-4.5" />
                  <span>Get Access</span>
                </button>
                <p className="text-[11px] text-gray-400 max-w-xs">Pay early-bird ₹199 pricing configurations to lift lock restrictions on materials.</p>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard inner panels */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-850 rounded-3xl border dark:border-slate-800">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
            <p className="text-sm font-semibold">Resolving download credentials...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Direct File Downloads (Only if hasAccess to files) */}
            <div className="lg:col-span-8 space-y-6">
              
              {!hasAccess && (
                <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5.5 h-5.5 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm mb-1">Access Restrained: Premium Materials Checked Lock</h4>
                      <p className="text-xs leading-relaxed mb-4 text-gray-400">
                        You are currently in our unpaid sandbox tier. Unpaid members can inspect samples in the checklist, but cannot pull full Markdown notes sheets or resume templates.
                      </p>
                      <a
                        href="#/"
                        className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold shadow hover:bg-amber-600 transition inline-block text-slate-900"
                      >
                        Navigate to Homepage Purchase Section &rarr;
                      </a>
                    </div>
                  </div>
                </div>
              )}

              <div className={`p-6 sm:p-8 rounded-3xl border ${
                darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-205 shadow-sm'
              }`}>
                <div className="flex items-center gap-2 mb-6 justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-500" />
                    <h3 className="font-display font-bold text-lg tracking-tight">Your Purchased Materials</h3>
                  </div>
                  {hasAccess && (
                    <button 
                      onClick={handleBypassUnlock}
                      className="text-[10px] font-bold px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/15 rounded-lg transition"
                      title="Mark all 13 modules completed and pass quiz instantly for tasting/reviewing simulator easily!"
                    >
                      🧪 Instant Auto-Complete Bypass (Shortcuts)
                    </button>
                  )}
                </div>

                {hasAccess && (
                  <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-450 uppercase tracking-wider flex items-center gap-1.5">
                        📈 SDET Coursework Completion Progress
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-500">
                        {completedMaterials.length} of {materials.length} modules completed ({Math.round((completedMaterials.length / materials.length) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(completedMaterials.length / materials.length) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">
                      💡 Click the checkmark <CheckCircle2 className="w-3 h-3 inline text-emerald-500" /> icon to mark each module completed as you read. Complete all {materials.length} modules to unlock the official 1:1 Live Interview Simulator and calendar pool!
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {materials.map((mat) => {
                    // Match filenames
                    let filename = mat.title.toLowerCase().replace(/ /g, '_') + '.md';
                    if (mat.key === 'qa_roadmap') filename = 'qa_sdet_roadmap_2026.md';
                    if (mat.key === 'manual_notes') filename = 'manual_testing_notes.md';

                    const isDone = completedMaterials.includes(mat.key);
                    const isInterviewQA = mat.key === 'interview_qas';
                    const isLiveInterviews = mat.key === 'live_interviews';

                    return (
                      <div
                        key={mat.key}
                        className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 relative overflow-hidden ${
                          hasAccess 
                            ? isLiveInterviews
                              ? darkMode
                                ? 'bg-slate-900/90 border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.15)] hover:border-rose-400'
                                : 'bg-rose-50/20 border-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.08)] hover:border-rose-450'
                              : isInterviewQA
                                ? darkMode
                                  ? 'bg-slate-900/90 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:border-amber-400'
                                  : 'bg-amber-50/20 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.08)] hover:border-amber-450'
                                : isDone
                                  ? darkMode ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/30' : 'bg-emerald-50/20 border-emerald-100 hover:shadow-md'
                                  : darkMode ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-100 hover:shadow-md'
                            : 'opacity-50 select-none bg-slate-100 dark:bg-slate-900/10'
                        }`}
                      >
                        <div className="min-w-0 z-10 text-left">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <h4 className={`font-bold text-xs truncate uppercase tracking-wider ${
                              isLiveInterviews ? 'text-rose-500 dark:text-rose-400 animate-pulse' :
                              isInterviewQA ? 'text-amber-500 dark:text-amber-400' : 'text-gray-400'
                            }`}>{mat.type}</h4>
                            {isLiveInterviews && (
                              <span className="text-[9px] font-extrabold tracking-widest px-1.5 py-0.2 rounded bg-rose-500 text-white animate-pulse">
                                NEW LIVE
                              </span>
                            )}
                            {isInterviewQA && (
                              <span className="text-[9px] font-extrabold tracking-widest px-1.5 py-0.2 rounded bg-amber-500 text-white animate-pulse">
                                CRUCIAL
                              </span>
                            )}
                          </div>
                          <p className={`font-display font-semibold text-sm truncate ${
                            isLiveInterviews ? 'text-rose-700 dark:text-rose-400' :
                            isInterviewQA ? 'text-amber-700 dark:text-amber-400' : ''
                          }`}>{mat.title}</p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {hasAccess && (
                            <button
                              onClick={() => handleToggleMaterialComplete(mat.key)}
                              className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                                isDone
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                                  : darkMode 
                                    ? 'border-slate-800 text-gray-500 hover:text-gray-300 hover:border-slate-700' 
                                    : 'border-slate-200 text-gray-400 hover:text-gray-600 hover:border-slate-350'
                              }`}
                              title={isDone ? "Mark as Incomplete" : "Mark as Completed"}
                            >
                              <CheckCircle2 className={`w-4 h-4 ${isDone ? 'fill-emerald-500/10' : ''}`} />
                            </button>
                          )}

                          {hasAccess ? (
                            isLiveInterviews ? (
                              <button
                                onClick={() => {
                                  // Smooth scroll to mock interview room section
                                  const el = document.getElementById('mock-interview-room-section');
                                  if (el) {
                                    el.scrollIntoView({ behavior: 'smooth' });
                                  } else {
                                    // Fallback to any active room wrapper
                                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                                  }
                                  // Automatically bypass lock so they can book immediately
                                  if (completedMaterials.length !== materials.length || !quizPassed) {
                                    handleBypassUnlock();
                                  }
                                  setInterviewTab('booking');
                                }}
                                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-500 hover:from-rose-600 hover:to-fuchsia-650 text-white cursor-pointer font-bold text-xs transition shadow-md shadow-rose-500/15 flex items-center gap-1.5 animate-pulse"
                                title="Schedule or view sessions"
                              >
                                <Calendar className="w-4 h-4" />
                                <span>Book Live Mock</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => triggerDownload(mat.key, filename)}
                                id={`dl-btn-${mat.key}`}
                                className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer transition shadow-md shadow-emerald-500/15"
                                title="Download document text file"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            )
                          ) : (
                            <span className="p-2.5 rounded-xl bg-slate-300 text-slate-500 dark:bg-slate-800 dark:text-slate-650 cursor-not-allowed">
                              <Plus className="w-4 h-4 rotate-45" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* QA PRACTICE CERTIFICATION QUIZ */}
              {hasAccess && (
                <div id="certification-quiz-section" className={`p-6 sm:p-8 rounded-3xl border ${
                  darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-205 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between gap-4 flex-wrap border-b border-dashed border-slate-200 dark:border-slate-800 pb-5 mb-6">
                    <div className="flex items-center gap-2.5">
                      <Award className="w-6 h-6 text-indigo-500" />
                      <div>
                        <h3 className="font-display font-extrabold text-lg tracking-tight">QA Master Certification Quiz</h3>
                        <p className="text-xs text-gray-400 font-medium">Validate your SDET fundamentals. Score &ge; 80% to pass.</p>
                      </div>
                    </div>
                    <div>
                      {quizPassed ? (
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 animate-bounce block">
                          🎉 Passed ({quizScore}%)
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 block">
                          ⏳ Untaken / Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {!quizStarted && !quizSubmitted && (
                    <div className="text-center py-6">
                      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-lg mx-auto mb-6">
                        Test your knowledge across Automation Thread-safety, HTTP APIs, Page Object design, test execution synchronization parameters, and Jenkins CI/CD declarative syntax!
                      </p>
                      <button
                        onClick={() => { setQuizStarted(true); handleQuizReset(); }}
                        className="px-6 py-3 rounded-2xl bg-indigo-550 hover:bg-indigo-605 text-white font-medium text-sm transition cursor-pointer shadow-lg shadow-indigo-550/15 flex items-center gap-2 mx-auto"
                      >
                        <Play className="w-4 h-4 fill-white" /> Start Practice Quiz
                      </button>
                    </div>
                  )}

                  {quizStarted && !quizSubmitted && (
                    <form onSubmit={handleQuizSubmit} className="space-y-6">
                      {QUIZ_QUESTIONS.map((q, idx) => (
                        <div key={q.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 text-left">
                          <h4 className="font-display font-bold text-sm text-gray-850 dark:text-gray-100 mb-3 flex gap-2">
                            <span className="text-indigo-500 font-mono font-bold">Q{idx + 1}.</span>
                            <span>{q.question}</span>
                          </h4>
                          <div className="grid grid-cols-1 gap-2">
                            {Object.entries(q.options).map(([key, value]) => {
                              const isSelected = quizAnswers[q.id] === key;
                              return (
                                <button
                                  type="button"
                                  key={key}
                                  onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: key }))}
                                  className={`p-3 rounded-xl border text-left text-xs transition-all flex items-start gap-2 cursor-pointer ${
                                    isSelected
                                      ? 'bg-indigo-550/5 border-indigo-550 text-indigo-500 font-semibold'
                                      : darkMode
                                        ? 'bg-slate-900 border-slate-800 text-gray-400 hover:bg-slate-850 hover:border-slate-700'
                                        : 'bg-white border-slate-100 text-gray-650 hover:bg-slate-50 hover:border-slate-300'
                                  }`}
                                >
                                  <span className={`w-5 h-5 rounded-full border flex items-center justify-center font-mono font-bold text-[10px] flex-shrink-0 ${
                                    isSelected ? 'bg-indigo-550 text-white border-indigo-550' : 'border-gray-500 text-gray-500'
                                  }`}>
                                    {key}
                                  </span>
                                  <span>{value}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      {quizError && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2 text-left">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <span>{quizError}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-3 justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => setQuizStarted(false)}
                          className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2.5 rounded-xl bg-indigo-550 hover:bg-indigo-600 text-white font-semibold text-xs transition cursor-pointer"
                        >
                          Submit Quiz Answers
                        </button>
                      </div>
                    </form>
                  )}

                  {quizSubmitted && (
                    <div className="space-y-6">
                      <div className="p-6 rounded-2xl text-center bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80">
                        <span className="text-3xl inline-block mb-2">{quizPassed ? '🎉' : '❌'}</span>
                        <h4 className="font-display font-extrabold text-xl mb-1 text-gray-850 dark:text-gray-100">
                          {quizPassed ? 'Practice Quiz Completed Successfully!' : 'Direct Failure. Retake required!'}
                        </h4>
                        <p className="text-sm font-mono font-bold text-gray-400">
                          Your Score: <span className={quizPassed ? 'text-emerald-500' : 'text-red-500'}>{quizScore}%</span> (&ge; 80% to pass)
                        </p>

                        {!quizPassed && (
                          <button
                            onClick={handleQuizReset}
                            className="mt-4 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-655 text-white font-semibold text-xs transition cursor-pointer"
                          >
                            Reset & Retake Practice Quiz
                          </button>
                        )}
                        {quizPassed && (
                          <div className="mt-4 flex flex-wrap justify-center gap-3">
                            <button
                              onClick={handleQuizReset}
                              className="px-4 py-2 rounded-xl border border-dashed border-indigo-500/30 hover:border-indigo-500/60 text-indigo-400 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Retake to Practice More
                            </button>
                            <a
                              href="#one-to-one-hub-section"
                              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs transition shadow-lg shadow-emerald-500/15"
                            >
                              Go to Interview Simulator &rarr;
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <h5 className="font-semibold text-xs uppercase tracking-wider text-gray-450 text-left">Answer Key & Explanations:</h5>
                        {QUIZ_QUESTIONS.map((q, idx) => {
                          const userAnswer = quizAnswers[q.id];
                          const isCorrect = userAnswer === q.correct;
                          return (
                            <div key={q.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/50 text-left">
                              <p className="font-bold text-xs text-gray-750 dark:text-gray-300 mb-2">
                                Q{idx + 1}. {q.question}
                              </p>
                              <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono mb-2">
                                <span className={`px-2 py-0.5 rounded ${
                                  isCorrect ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                }`}>
                                  Your Answer: {userAnswer || 'Unanswered'} ({isCorrect ? 'Correct' : 'Incorrect'})
                                </span>
                                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
                                  Correct Option: {q.correct}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-400 leading-relaxed">
                                💡 <span className="font-bold">Explanation:</span> {q.explanation}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 1:1 INTERVIEW SIMULATOR & MENTION BOOKING HUB */}
              {hasAccess && (
                <div id="one-to-one-hub-section" className={`p-6 sm:p-8 rounded-3xl border ${
                  darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-205 shadow-sm'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dashed border-slate-200 dark:border-slate-800 pb-5 mb-6">
                    <div className="flex items-center gap-2.5 text-left">
                      <Users className="w-5.5 h-5.5 text-emerald-500" />
                      <div>
                        <h3 className="font-display font-extrabold text-lg tracking-tight">One-to-One Interview Suite</h3>
                        <p className="text-xs text-gray-400">Unlock mock rounds & scheduling after completing credentials</p>
                      </div>
                    </div>
                    
                    {/* Bypass lock badge/indicator */}
                    {completedMaterials.length === materials.length && quizPassed ? (
                      <span className="self-start sm:self-center px-2.5 py-1 text-[10px] font-extrabold rounded-full bg-emerald-500/10 text-emerald-500 uppercase tracking-widest font-mono">
                        🔓 Unlocked & Qualified
                      </span>
                    ) : (
                      <span className="self-start sm:self-center px-2.5 py-1 text-[10px] font-extrabold rounded-full bg-slate-500/10 text-gray-500 uppercase tracking-widest font-mono">
                        🔒 Locked ({completedMaterials.length}/{materials.length} Modules + Quiz)
                      </span>
                    )}
                  </div>

                  {/* Locked State placeholder */}
                  {!(completedMaterials.length === materials.length && quizPassed) && (
                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 text-center">
                      <span className="text-2xl block mb-2">🔒</span>
                      <h4 className="font-bold text-sm text-gray-805 dark:text-gray-100 mb-2">
                        Earn Qualification Status
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-4 leading-relaxed">
                        To guarantee high quality live sessions, our system requires completion of all {materials.length} modules and earning your passing score on the training quiz above before unlocking interview features.
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-xs mx-auto">
                        <button
                          onClick={handleBypassUnlock}
                          className="px-4 py-2 text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 rounded-xl transition cursor-pointer"
                        >
                          ⚡ Unlock Instantly (Shortcut)
                        </button>
                        <a
                          href="#certification-quiz-section"
                          className="px-4 py-2 text-[11px] font-bold bg-indigo-550 hover:bg-indigo-600 text-white rounded-xl transition shadow-md shadow-indigo-550/15 block text-center"
                        >
                          📝 Take Quiz
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Unlocked Active State */}
                  {completedMaterials.length === materials.length && quizPassed && (
                    <div className="space-y-6">
                      
                      {/* Sub Tabs */}
                      <div className="flex border-b border-slate-205 dark:border-slate-800 p-0.5 gap-2">
                        <button
                          onClick={() => setInterviewTab('simulator')}
                          className={`px-4 py-2.5 text-xs font-semibold cursor-pointer rounded-xl transition-all ${
                            interviewTab === 'simulator'
                              ? 'bg-indigo-550 text-white shadow-sm'
                              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-250'
                          }`}
                        >
                          🎙️ Live AI Interview (Simulator)
                        </button>
                        <button
                          onClick={() => setInterviewTab('booking')}
                          className={`px-4 py-2.5 text-xs font-semibold cursor-pointer rounded-xl transition-all ${
                            interviewTab === 'booking'
                              ? 'bg-indigo-550 text-white shadow-sm'
                              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-250'
                          }`}
                        >
                          📅 Schedule 1:1 Live Mentor Feedback
                        </button>
                      </div>

                      {interviewTab === 'simulator' && (
                        <div className="space-y-4">
                          <div className="p-4 rounded-2xl bg-indigo-550/5 border border-indigo-550/10 flex flex-col md:flex-row justify-between gap-4 items-center text-left">
                            <div className="min-w-0">
                              <h4 className="font-bold text-xs text-indigo-400 uppercase tracking-wider mb-1 font-mono">Principal SDET Simulator Active</h4>
                              <p className="text-xs text-gray-400">Select your track and trigger the session. Gemini functions as your interviewer.</p>
                            </div>

                            <div className="w-full md:w-auto flex items-center gap-2 flex-wrap sm:flex-nowrap">
                              <select
                                value={interviewTrack}
                                onChange={(e) => setInterviewTrack(e.target.value)}
                                className={`px-3 py-2.5 text-xs rounded-xl border font-semibold w-full sm:w-auto ${
                                  darkMode ? 'bg-slate-900 border-slate-800 text-gray-200' : 'bg-white border-slate-200 text-gray-850'
                                }`}
                              >
                                <option value="Selenium Java Automation SDET">Selenium Java Automation SDET</option>
                                <option value="Playwright TypeScript Automation Specialist">Playwright TypeScript Automation Specialist</option>
                                <option value="Manual Functional QA Specialist">Manual Functional QA Specialist</option>
                                <option value="API Automation & DB Security Engineer">API Automation & DB Security Engineer</option>
                                <option value="QA Lead/Manager Process Architect">QA Lead/Manager Process Architect</option>
                              </select>

                              <button
                                onClick={handleStartMockInterview}
                                className="px-4 py-2.5 rounded-xl bg-indigo-550 hover:bg-indigo-605 text-white font-semibold text-xs cursor-pointer transition flex-shrink-0 flex items-center gap-1 w-full sm:w-auto justify-center"
                              >
                                {chatMessages.length > 0 ? <RefreshCw className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                                {chatMessages.length > 0 ? 'Restart Session' : 'Start Mock Round'}
                              </button>
                            </div>
                          </div>

                          {chatMessages.length === 0 ? (
                            <div className="text-center py-10 bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                              <Terminal className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                              <h5 className="font-bold text-xs text-gray-450 uppercase tracking-widest mb-1 font-mono">Interactive Mock Sandbox Ready</h5>
                              <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">Configure your target track and click "Start Mock Round" to launch a live interview cycle with standard industry-standard scenario questions!</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-900/20 max-h-[350px] overflow-y-auto p-4 space-y-4 font-sans text-left">
                                {chatMessages.map((msg, index) => {
                                  const isUser = msg.sender === 'candidate';
                                  return (
                                    <div
                                      key={index}
                                      className={`flex flex-col max-w-[85%] ${
                                        isUser ? 'ml-auto items-end' : 'mr-auto items-start'
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <span className="text-[10px] font-bold font-mono tracking-wider text-gray-400">
                                          {isUser ? 'CANDIDATE' : 'INTERVIEWER (GEMINI)'}
                                        </span>
                                        <span className="text-[9px] text-gray-500 font-mono">{msg.time}</span>
                                      </div>
                                      <div className={`p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                                        isUser
                                          ? 'bg-indigo-550 text-white rounded-tr-none'
                                          : darkMode
                                            ? 'bg-slate-850 text-gray-200 border border-slate-800 rounded-tl-none'
                                            : 'bg-white border border-slate-205 text-gray-800 shadow-sm rounded-tl-none'
                                      }`}>
                                        {msg.text}
                                      </div>
                                    </div>
                                  );
                                })}

                                {chatLoading && (
                                  <div className="flex items-start gap-2 mr-auto max-w-[80%]">
                                    <div className="bg-slate-800 border border-slate-750 p-3 rounded-2xl rounded-tl-none text-xs text-gray-400 flex items-center gap-2 font-mono">
                                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                                      <span>Interviewer is formulating next scenario...</span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {chatError && (
                                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2 text-left">
                                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                  <span>{chatError}</span>
                                </div>
                              )}

                              <form onSubmit={handleSendResponse} className="flex gap-2">
                                <input
                                  type="text"
                                  value={chatInput}
                                  onChange={(e) => setChatInput(e.target.value)}
                                  placeholder="Type your structured technical response here and click Send..."
                                  disabled={chatLoading}
                                  className={`flex-grow px-4 py-3 rounded-xl border text-xs focus:ring-1 focus:ring-indigo-550 transition ${
                                    darkMode ? 'bg-slate-900 border-slate-800 text-gray-200' : 'bg-white border-slate-205 text-gray-805'
                                  }`}
                                />
                                <button
                                  type="submit"
                                  disabled={chatLoading || !chatInput.trim()}
                                  className="px-4 py-3 bg-indigo-550 hover:bg-indigo-650 disabled:bg-indigo-550/50 text-white rounded-xl transition cursor-pointer flex items-center justify-center flex-shrink-0"
                                >
                                  <Send className="w-4 h-4" />
                                </button>
                              </form>

                              {/* Report generation builder trigger */}
                              <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap text-left">
                                <span className="text-[10px] text-gray-400 leading-none">
                                  💡 Answer at least 2 questions to generate your performance scorecard.
                                </span>
                                <button
                                  onClick={handleGenerateInterviewReport}
                                  disabled={generatingReport || chatMessages.length < 3}
                                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-extrabold text-xs cursor-pointer transition flex items-center gap-1.5 shadow-md shadow-amber-500/15"
                                >
                                  {generatingReport ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                                      Formulating Scorecard...
                                    </>
                                  ) : (
                                    <>
                                      <Award className="w-3.5 h-3.5 text-slate-950" />
                                      Compile Performance Report
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* Performance report card display */}
                              {interviewReport && (
                                <div className="mt-4 p-5 rounded-2xl bg-amber-500/5 border border-amber-505 text-xs text-left">
                                  <h5 className="font-display font-extrabold text-amber-500 mb-2 flex items-center gap-1.5 uppercase font-mono tracking-wider">
                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                    Your Live Interview Feedback & Scorecard
                                  </h5>
                                  <div className="prose prose-sm dark:prose-invert text-gray-300 space-y-2 whitespace-pre-wrap leading-relaxed font-sans mt-3">
                                    {interviewReport}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {interviewTab === 'booking' && (
                        <div className="space-y-4">
                          {bookingConfirmed && bookingDetails ? (
                            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-4 text-center">
                              <span className="text-3xl block">📆</span>
                              <h4 className="font-display font-extrabold text-lg text-emerald-500">1:1 Mentoring Slot Confirmed!</h4>
                              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                                Check your email inbox on <span className="font-bold underline text-white">{user.email}</span>. A calendar block invitation has been triggered with video link parameters.
                              </p>
                              
                              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-left space-y-2 max-w-md mx-auto text-xs font-mono">
                                <div className="flex justify-between border-b border-slate-800/50 pb-1.5"><span className="text-gray-400">Date booked:</span> <span className="text-emerald-400 font-bold">{bookingDetails.date}</span></div>
                                <div className="flex justify-between border-b border-slate-800/50 pb-1.5"><span className="text-gray-400">Time booked:</span> <span className="text-emerald-400 font-bold">{bookingDetails.time}</span></div>
                                <div className="flex justify-between border-b border-slate-800/50 pb-1.5"><span className="text-gray-400">Google Meet Room ID:</span> <span className="text-indigo-400 select-all font-bold">{bookingDetails.meetingId}</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">Assigned Expert Mentor:</span> <span className="text-white">Senior Lead SDET (ex-Apple / Netflix)</span></div>
                              </div>

                              <button
                                onClick={() => setBookingConfirmed(false)}
                                className="px-4 py-2 bg-indigo-550 hover:bg-indigo-650 cursor-pointer text-white font-semibold text-xs rounded-xl transition"
                              >
                                Book another slot
                              </button>
                            </div>
                          ) : (
                            <form onSubmit={handleConfirmBooking} className="space-y-4 max-w-xl mx-auto text-left">
                              <p className="text-xs text-gray-500 dark:text-gray-400 text-center leading-relaxed max-w-md mx-auto mb-2">
                                Choose from our active mentor pool of senior QA leads, manager test architects, and Principal Automation Engineers from top Tech tier-1 companies. Session is 100% free of charge as part of your kit.
                              </p>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-[11px] font-bold text-gray-400 mb-1">CHOOSE WORKABLE DATE:</label>
                                  <input
                                    type="date"
                                    required
                                    value={bookingDate}
                                    onChange={(e) => setBookingDate(e.target.value)}
                                    className={`w-full px-3 py-2.5 rounded-xl border text-xs focus:ring-1 focus:ring-indigo-550 focus:outline-none ${
                                      darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-205 text-gray-805'
                                    }`}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-gray-400 mb-1">DESIRED HOUR SLOT:</label>
                                  <select
                                    value={bookingTime}
                                    onChange={(e) => setBookingTime(e.target.value)}
                                    required
                                    className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold focus:ring-1 focus:ring-indigo-550 focus:outline-none ${
                                      darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-205 text-gray-805'
                                    }`}
                                  >
                                    <option value="">Select Time Slot</option>
                                    <option value="10:00 AM - 10:45 AM IST">10:00 AM - 10:45 AM IST</option>
                                    <option value="02:30 PM - 03:15 PM IST">02:30 PM - 03:15 PM IST</option>
                                    <option value="04:00 PM - 04:45 PM IST">04:00 PM - 04:45 PM IST</option>
                                    <option value="08:00 PM - 08:45 PM IST">08:00 PM - 08:45 PM IST</option>
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-[11px] font-bold text-gray-400 mb-1">RESUME OR LINKEDIN PROFILE (RECOMMENDED):</label>
                                  <input
                                    type="url"
                                    value={bookingResumeUrl}
                                    onChange={(e) => setBookingResumeUrl(e.target.value)}
                                    placeholder="https://linkedin.com/in/username"
                                    className={`w-full px-3 py-2.5 rounded-xl border text-xs focus:ring-1 focus:ring-indigo-550 focus:outline-none ${
                                      darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-205 text-gray-805'
                                    }`}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-gray-400 mb-1">PRIMARY CONTEXT & TOPIC OF FOCUS:</label>
                                  <select
                                    value={bookingFocus}
                                    onChange={(e) => setBookingFocus(e.target.value)}
                                    className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold focus:ring-1 focus:ring-indigo-550 focus:outline-none ${
                                      darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-205 text-gray-805'
                                    }`}
                                  >
                                    <option value="System Design & QA Automation Architecture">System Design & QA Automation Architecture</option>
                                    <option value="Resume Optimization & Technical Dry Runs Working">Resume Optimization & Technical Dry Runs Working</option>
                                    <option value="Live Code Reviews & StaleElement solutions">Live Code Reviews & StaleElement solutions</option>
                                    <option value="Lead QA Process & Defect Lifecycle standardizations">Lead QA Process & Defect Lifecycle standardizations</option>
                                  </select>
                                </div>
                              </div>

                              <button
                                type="submit"
                                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl cursor-pointer transition shadow-lg shadow-emerald-500/15 uppercase tracking-wider"
                              >
                                Book Secure 1:1 Live Slot
                              </button>
                            </form>
                          )}

                          {activeBookings.length > 0 && (
                            <div className="mt-8 border-t border-dashed border-slate-200 dark:border-slate-800 pt-6 space-y-4">
                              <h4 className="font-display font-extrabold text-sm tracking-tight flex items-center gap-2">
                                <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping"></span>
                                Your Active Scheduled 1-on-1 Sessions ({activeBookings.filter(b => b.status === 'scheduled').length}/3)
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                                {activeBookings.map((bk) => (
                                  <div key={bk.id} className={`p-4 rounded-xl border flex flex-col justify-between ${
                                    bk.status === 'scheduled'
                                      ? darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-100'
                                      : 'opacity-60 bg-slate-100 dark:bg-slate-950/20 border-transparent'
                                  }`}>
                                    <div className="space-y-1 text-xs">
                                      <div className="flex justify-between items-center">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                          bk.session_type === 'coding' ? 'bg-blue-500/10 text-blue-500' :
                                          bk.session_type === 'design' ? 'bg-amber-500/10 text-amber-500' :
                                          'bg-rose-500/10 text-rose-500'
                                        }`}>
                                          {bk.session_type === 'coding' ? 'DSA & CODE RUN' :
                                           bk.session_type === 'design' ? 'SYS DESIGN & ARCH' :
                                           'ATS RESUME & PITCH'}
                                        </span>
                                        <span className={`font-bold ${
                                          bk.status === 'scheduled' ? 'text-emerald-500' : 'text-gray-450'
                                        }`}>
                                          {bk.status.toUpperCase()}
                                        </span>
                                      </div>
                                      <p className="font-bold text-sm text-gray-850 dark:text-gray-200 pt-1">{bk.date_time}</p>
                                    </div>
                                    
                                    {bk.status === 'scheduled' && (
                                      <button
                                        onClick={() => {
                                          if (confirm("Are you sure you want to cancel this mock interview session?")) {
                                            fetch('/api/bookings/cancel', {
                                              method: 'POST',
                                              headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${token}`
                                              },
                                              body: JSON.stringify({ booking_id: bk.id })
                                            })
                                            .then(res => res.json())
                                            .then(() => {
                                              fetchBookings();
                                            });
                                          }
                                        }}
                                        className="mt-3 text-left text-[10px] font-bold text-rose-500 hover:text-rose-600 underline cursor-pointer"
                                      >
                                        Cancel Session
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  )}
                </div>
              )}

              {/* Dynamic AI Advanced Notes Builder Panel (Only for paid/admin users) */}
              {hasAccess && (
                <div className={`p-6 sm:p-8 rounded-3xl border ${
                  darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-205 shadow-sm'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-dashed border-slate-200 dark:border-slate-800 pb-5">
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-5.5 h-5.5 text-amber-500 animate-pulse" />
                      <div>
                        <h3 className="font-display font-extrabold text-lg tracking-tight">AI Premium Study Notes Studio</h3>
                        <p className="text-xs text-gray-400">Generate on-demand elite-level theoretical sheets & scripts via Gemini API</p>
                      </div>
                    </div>
                    <span className="self-start sm:self-center px-2.5 py-1 text-[10px] font-extrabold rounded-full bg-indigo-550/10 text-indigo-400 uppercase tracking-wider font-mono">
                      Unlimited Paid Benefit
                    </span>
                  </div>

                  {/* Preset Topic Picker */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-450 dark:text-gray-400 mb-2 uppercase tracking-wide">
                        Select Master Study Topic:
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                        {AI_PRESETS.map((preset) => (
                          <button
                            key={preset.key}
                            type="button"
                            onClick={() => {
                              setAiPreset(preset.key);
                              setCustomTopic('');
                            }}
                            className={`px-3 py-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                              aiPreset === preset.key && !customTopic
                                ? 'bg-indigo-650 border-indigo-500 text-white shadow-md shadow-indigo-650/15'
                                : darkMode 
                                  ? 'bg-slate-900 border-slate-800 text-gray-300 hover:bg-slate-800 hover:border-slate-700' 
                                  : 'bg-slate-50 border-slate-200 text-gray-700 hover:bg-slate-100 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${aiPreset === preset.key && !customTopic ? 'bg-white' : 'bg-indigo-500'}`} />
                              <span className="truncate">{preset.name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Or enter completely custom QA request */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-bold text-gray-450 dark:text-gray-400 uppercase tracking-wide">
                          Or Define Custom SDET Scenario:
                        </label>
                        {customTopic && (
                          <button 
                            type="button"
                            onClick={() => setCustomTopic('')}
                            className="text-[10px] font-bold text-indigo-400 hover:underline cursor-pointer"
                          >
                            Reset to Preset Topic
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        placeholder="e.g. Thread-safe REST Assured API tests run concurrently with ExtentReports on Jenkins pipelines"
                        className={`w-full py-2.5 px-3.5 text-xs border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${
                          darkMode ? 'bg-slate-900 border-slate-800 text-white placeholder-gray-500' : 'bg-slate-50 border-slate-200 text-gray-800 placeholder-gray-400'
                        }`}
                      />
                    </div>

                    {/* Generation Trigger Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleGenerateAiNotes}
                        disabled={aiLoading}
                        className={`w-full py-3 bg-gradient-to-r from-indigo-650 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          aiLoading ? 'opacity-80 cursor-not-allowed' : ''
                        }`}
                      >
                        {aiLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>{AI_STEPS[loadingStep] || "Compiling notes details..."}</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4.5 h-4.5" />
                            <span>Generate Custom Advanced QA Notes & Code Suite</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Success/Error output messaging */}
                    {aiSuccess && !aiError && (
                      <p className="p-2 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-[11px] text-emerald-500 font-bold">
                        {aiSuccess}
                      </p>
                    )}

                    {aiError && (
                      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Generation Blocked:</span> {aiError}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Generated View Block */}
                    {generatedNotes && (
                      <div className="mt-6 space-y-4 animate-fadeIn">
                        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-indigo-400 dark:text-indigo-400 font-mono tracking-widest uppercase">GENERATED SUCCESS</span>
                            <h4 className="font-display font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100 truncate">
                              {customTopic ? customTopic : AI_PRESETS.find(p => p.key === aiPreset)?.name}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={handleCopyNotes}
                              className="p-2 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer bg-slate-850 border border-slate-800 hover:bg-slate-800 text-gray-300"
                              title="Copy full study sheet to clipboards"
                            >
                              {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copySuccess ? 'Copied' : 'Copy'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleDownloadNotesMd}
                              className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-sm shadow-emerald-550/10"
                              title="Save document as Markdown locally"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Save .MD</span>
                            </button>
                          </div>
                        </div>

                        <div className="rounded-2xl border dark:border-slate-800 overflow-hidden">
                          <div className={`px-4 py-2 text-xs border-b dark:border-slate-800 flex items-center justify-between font-mono ${
                            darkMode ? 'bg-slate-900 text-gray-400' : 'bg-slate-100 text-gray-550'
                          }`}>
                            <span className="flex items-center gap-1">
                              <Terminal className="w-3.5 h-3.5 text-indigo-400" /> study-vault-terminal
                            </span>
                            <span>markdown format</span>
                          </div>
                          <div className="max-h-[500px] overflow-y-auto p-5 font-mono text-xs leading-relaxed whitespace-pre-wrap bg-slate-950 text-emerald-400 dark:text-emerald-400 select-text">
                            {generatedNotes}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Purchase history panel */}
              {hasAccess && (
                <div className={`p-6 sm:p-8 rounded-3xl border ${
                  darkMode ? 'bg-slate-850/60 border-slate-800' : 'bg-white border-slate-205 shadow-sm'
                }`}>
                  <div className="flex items-center gap-2 mb-4">
                    <History className="w-5 h-5 text-emerald-500" />
                    <h3 className="font-display font-bold text-lg">Purchase Order History</h3>
                  </div>

                  {orders.length > 0 ? (
                    <div className="space-y-3">
                      {orders.map((o) => (
                        <div 
                          key={o.id} 
                          className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-semibold ${
                            darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-150'
                          }`}
                        >
                          <div>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 uppercase tracking-widest text-[9px]">Completed</span>
                            <p className="mt-1 font-display">QA Interview Kit Purchase Receipt</p>
                            <span className="text-[10px] text-gray-400 font-mono">RZP Order ID: {o.razorpay_order_id} | Ref: {o.payment_id}</span>
                          </div>
                          <div className="sm:text-right font-mono">
                            <p className="text-emerald-500 text-sm font-bold">₹{o.amount}.00</p>
                            <span className="text-[10px] text-gray-400">{new Date(o.purchase_date).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-450 italic">No historical billing logs present. Admin or Staff permission bypass is active.</p>
                  )}
                </div>
              )}

            </div>

            {/* Right Column: Settings and Testimonial Submissions */}
            <div className="lg:col-span-4 space-y-6">

              {/* Account profile configs */}
              <div className={`p-6 rounded-2xl border ${
                darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-205 shadow-sm'
              }`}>
                <div className="flex items-center gap-2 mb-4">
                  <UserCheck className="w-4.5 h-4.5 text-emerald-500" />
                  <h3 className="font-display font-bold text-base">Profile Credentials Management</h3>
                </div>

                {profileSuccess && (
                  <p className="mb-3 text-[11px] font-bold text-emerald-500 bg-emerald-500/5 p-2 rounded-lg">{profileSuccess}</p>
                )}
                {profileError && (
                  <p className="mb-3 text-[11px] font-bold text-red-500 bg-red-550/5 p-2 rounded-lg">{profileError}</p>
                )}

                <form onSubmit={handleProfileUpdate} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1 uppercase tracking-wider">Your Full Name</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className={`w-full py-2 px-3 border rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-gray-800'
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-semibold mb-1 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      className={`w-full py-2 px-3 border rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-gray-800'
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-semibold mb-1 uppercase tracking-wider">Mobile Number</label>
                    <div className="relative">
                      <span className={`absolute left-3 top-2 text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>+91</span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="9876543210"
                        maxLength={10}
                        pattern="\d{10}"
                        title="Enter a 10-digit mobile number"
                        className={`w-full py-2 pl-9 pr-3 border rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-gray-800'
                        }`}
                      />
                    </div>
                    {profilePhone.length > 0 && profilePhone.length < 10 && (
                      <p className="text-[10px] text-amber-500 mt-1">Enter all 10 digits ({profilePhone.length}/10)</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-400 font-semibold mb-1 uppercase tracking-wider">Reset New Password (Optional)</label>
                    <input
                      type="password"
                      value={profilePassword}
                      onChange={(e) => setProfilePassword(e.target.value)}
                      placeholder="Leave blank to maintain current"
                      autoComplete="new-password"
                      className={`w-full py-2 px-3 border rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-gray-800'
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold cursor-pointer transition flex items-center justify-center gap-1.5"
                  >
                    {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Profile Changes</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Submit a testimonial form from dashboard */}
              {hasAccess && (
                <div className={`p-6 rounded-2xl border ${
                  darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-250 shadow-sm'
                }`}>
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="w-4.5 h-4.5 text-emerald-500" />
                    <h3 className="font-display font-bold text-base">Submit Review Testimonial</h3>
                  </div>

                  {testmSuccess && (
                     <p className="mb-3 text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 p-2 rounded-lg">{testmSuccess}</p>
                  )}
                  {testmError && (
                     <p className="mb-3 text-[11px] font-semibold text-red-500 bg-red-500/10 p-2 rounded-lg">{testmError}</p>
                  )}

                  <form onSubmit={handleTestimonialSubmit} className="space-y-4 text-xs font-semibold">
                    <div>
                      <label className="block text-gray-400 mb-1 uppercase">Your Designation / Job Role</label>
                      <input
                        type="text"
                        value={testmRole}
                        onChange={(e) => setTestmRole(e.target.value)}
                        placeholder="e.g. QA Engineer at Amazon"
                        className={`w-full py-2 px-3 border rounded-xl focus:outline-none focus:ring-1 navigation ${
                          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-gray-800'
                        }`}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-1 uppercase">Rating Points (1-5 Stars)</label>
                      <div className="flex items-center gap-1.5">
                        {[1,2,3,4,5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setTestmRating(star)}
                            className={`p-1 hover:scale-110 transition ${star <= testmRating ? 'text-amber-500' : 'text-gray-300'}`}
                          >
                            <Star className="w-5 h-5 fill-current" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-1 uppercase">Your Real Experience / Review</label>
                      <textarea
                        value={testmComment}
                        onChange={(e) => setTestmComment(e.target.value)}
                        rows={3}
                        placeholder="Detail how these manual and automation guides facilitated your technical round practices..."
                        className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-1 ${
                          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-205 text-gray-800'
                        }`}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={testmLoading}
                      className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold cursor-pointer transition flex items-center justify-center gap-1"
                    >
                      {testmLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Submit Testimonial Review</span>}
                    </button>
                  </form>
                </div>
              )}

              {/* File download count checklist / analytics indicators */}
              {hasAccess && downloadHistory.length > 0 && (
                <div className={`p-6 rounded-2xl border text-xs font-mono ${
                  darkMode ? 'bg-slate-850 border-slate-800 text-gray-400' : 'bg-white border-slate-205 text-gray-500 shadow-sm'
                }`}>
                  <h4 className="font-display font-bold text-gray-900 dark:text-gray-100 mb-3 text-sm font-sans flex items-center justify-between">
                    <span>Recent Download Activity</span>
                    <span className="text-xs text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded font-mono">{downloadHistory.length} files</span>
                  </h4>
                  <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                    {downloadHistory.slice().reverse().map((log) => (
                      <li key={log.id} className="flex justify-between border-b pb-1 border-dashed border-slate-800">
                        <span className="truncate max-w-[180px]">{log.file_name}</span>
                        <span className="text-[10px] text-gray-400">{new Date(log.downloaded_at).toLocaleDateString()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
