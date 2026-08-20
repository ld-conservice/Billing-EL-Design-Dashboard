/* ===================================================================
   program.js  —  ALL HAND-EDITED CONTENT LIVES HERE

   This is the file you edit when the program's thinking changes.
   Task data (status, dates, owners) comes from Monday automatically
   and should NOT be typed in here.

   Everything below is plain text in quotes. Change the words, keep
   the punctuation, commit the file. The site updates in about a
   minute. If you break a comma the page will show an error banner
   telling you which line.
   =================================================================== */

const PROGRAM = {

  /* ---- Top-level program facts. Shown in the header. ---- */
  meta: {
    name: "Conservice Foundations",
    subtitle: "Universal new hire program · Redesign",
    launchDate: "2026-12-31",
    designLead: "Averi Riggott",
    approver: "Braden Johnson",
    docVersion: "Week One Design v4",
    docDate: "2026-08-19"
  },

  /* ---- ADDIE. `state` is one of: complete, current, upcoming ---- */
  addie: [
    {
      phase: "Analyse",
      state: "complete",
      summary: "Audit what exists, establish what Foundations must deliver, and verify the company facts the program will teach.",
      work: [
        "LMS content audit of 18 existing Foundations programs",
        "Foundations Source Reconciliation across seven sources",
        "Billing EL module-level audit and cross-program gap review",
        "SME verification of the bill journey, setup structure, and closing stage"
      ],
      evidence: "Aug 12 LMS audit · Aug 19 source reconciliation · SME confirmations 8/18 and 8/19"
    },
    {
      phase: "Design",
      state: "current",
      summary: "Fix the architecture, the journey model, and the guard rails, then outline content Cornerstone by Cornerstone.",
      work: [
        "Five-Cornerstone architecture locked 7/23, reconfirmed 8/13",
        "Bill journey model: universal trunk, product-determined branches, distributed closing",
        "Modality mix and day accounting model",
        "Eleven guard rails governing what may enter universal content"
      ],
      evidence: "Week One Design v4, awaiting approval"
    },
    {
      phase: "Develop",
      state: "upcoming",
      summary: "Build the universal Cornerstones first, then the pathway layers.",
      work: [
        "C1 to C3 universal build, plus C5a universal systems training",
        "One artifact set built once and reused all week",
        "Pathway build: Billing first, then Utility Services",
        "Facilitator guides and job aids"
      ],
      evidence: "Roadmap phases P3 and P4"
    },
    {
      phase: "Implement",
      state: "upcoming",
      summary: "Review, sign-off, dry run, LMS build, launch.",
      work: [
        "Stakeholder review and Braden sign-off",
        "Facilitator dry run",
        "LMS build as a learning plan with separate courses",
        "Launch"
      ],
      evidence: "Roadmap phases P5 and P6 · Launch 31 Dec 2026"
    },
    {
      phase: "Evaluate",
      state: "upcoming",
      summary: "Confirm the handoff holds and the content stays true as teams reorganise.",
      work: [
        "End-of-Foundations assessment concept (undecided)",
        "Handoff statement tested against Billing EL Day 1",
        "Touchpoint table maintenance route with HR as notification node",
        "Standing review of the journey model and glossary"
      ],
      evidence: "Approach defined, not yet scheduled"
    }
  ],

  /* ---- The five Cornerstones. This is the program map. ---- */
  cornerstones: [
    {
      id: "C1",
      title: "Who We Are",
      scope: "universal",
      minutes: 100,
      summary: "Facilitated walkthrough of one real bill's journey across the company, recorded executive welcome, take-away job aid.",
      why: "Orientation and meaning-making, not procedure. Needs a story and live questions."
    },
    {
      id: "C2",
      title: "Who You Are",
      scope: "universal",
      minutes: 255,
      summary: "Guided tech setup lab, task-based HRX practice, knowledge base scavenger hunt, short vILT with an HR SME, self-guided logistics, staggered compliance eLearning.",
      why: "Setup and HRX are performance tasks, not knowledge. Lookups belong on one-pagers."
    },
    {
      id: "C3",
      title: "How We Work Together",
      scope: "universal",
      minutes: 195,
      summary: "Facilitated norms discussion, scenario-based soft skills practice, guided procedural practice reading the same bill from C1.",
      why: "Norms are contested and need arguing out loud. Bill reading is procedural and needs reps."
    },
    {
      id: "C4",
      title: "Your Role",
      scope: "branch",
      minutes: 150,
      summary: "Warm facilitated handoff, 30/60/90 walkthrough on a template the learner keeps, supervised first real task.",
      why: "A handoff is a relationship transfer, not content. It only works live. This is where role-specific branching begins."
    },
    {
      id: "C5",
      title: "Team Tools & Systems",
      scope: "branch",
      minutes: 180,
      summary: "Layered. C5a universal systems training (90 min, built once). C5b pathway access lab and mapping activity (90 min, varies by pathway).",
      why: "The systems landscape is structural and durable. Individual click paths are not, so they stay as labs and job aids."
    }
  ],

  /* ---- Where learners go after Foundations ---- */
  pathways: [
    { name: "Billing",          priority: 1,    note: "Priority branch 1. Module-level audit complete." },
    { name: "Utility Services", priority: 2,    note: "Priority branch 2. Scope boundary vs Capturis unresolved." },
    { name: "Onboarding",       priority: null, note: "" },
    { name: "CAT / Customer",   priority: null, note: "" },
    { name: "Pro Teams",        priority: null, note: "" },
    { name: "Leaders",          priority: null, note: "" },
    { name: "Capturis",         priority: null, note: "Product, market or platform: unconfirmed." },
    { name: "Meters",           priority: null, note: "" },
    { name: "ESG",              priority: null, note: "" },
    { name: "PayOps",           priority: null, note: "Routing to Utility Services needs confirming." }
  ],

  /* ---- The bill journey. readiness: confirmed | pending | unowned ---- */
  journey: {
    intro: "One real, redacted bill from one named property is the continuous case study running through Foundations. The learner meets it in C1, reads it in C3, is handed their part of it in C4, and maps their team's systems onto it in C5.",
    parts: [
      {
        label: "Part A · Once per property",
        stages: [
          { n: 1, name: "A client has a need",   who: "Sales, Marketing",                 readiness: "confirmed" },
          { n: 2, name: "They buy product(s)",   who: "Account Management, Legal",         readiness: "pending", note: "The hinge. Written confirmation outstanding with Adriana Ward." },
          { n: 3, name: "Setup is configured",   who: "NAS Billing Setup, NAS Synergy Setup, Control", readiness: "confirmed", note: "Confirmed by Hannah Frampton 8/19." }
        ]
      },
      {
        label: "Part B · Every billing period",
        stages: [
          { n: 4, name: "A bill arrives or is retrieved", who: "Data Intake, Meters",      readiness: "confirmed" },
          { n: 5, name: "Read and captured",              who: "Billing, EDE, Capturis",   readiness: "confirmed" },
          { n: 6, name: "Someone checks it",              who: "Utility Services, QC",     readiness: "confirmed", note: "Checking is a property of every stage, not one stage. The facilitator guide must say so." }
        ]
      },
      {
        label: "Part C · Branches, set by what they bought",
        stages: [
          { n: null, name: "Residents billed",          who: "Expense Recovery purchased",           readiness: "confirmed" },
          { n: null, name: "Submetering",               who: "Meter Management purchased",           readiness: "confirmed" },
          { n: null, name: "Data to client systems",    who: "Data and Analytics purchased",         readiness: "confirmed" },
          { n: null, name: "Sustainability reporting",  who: "Sustainability and Compliance purchased", readiness: "confirmed" },
          { n: null, name: "Vendor and contracts",      who: "Contract Management purchased",        readiness: "confirmed" },
          { n: null, name: "Resident Support",          who: "Not a branch. Automatic for every client.", readiness: "confirmed" }
        ]
      },
      {
        label: "Part D · Closing",
        stages: [
          { n: null, name: "The client leaves", who: "Each product owner closes their own", readiness: "confirmed", note: "Confirmed by Andrew Hansen 8/18. No single team owns it." }
        ]
      }
    ]
  },

  /* ---- Guard rails. The rules that keep Foundations universal. ---- */
  guardRails: [
    { n: 1,  rule: "Who and what breaks, never how",        detail: "The only two universal questions at each stage. The moment the walkthrough explains how a charge is calculated, it has become role training." },
    { n: 2,  rule: "No role-specific vocabulary",            detail: "ABP, EDE, FCC, MIMO, UA, prebill, ramping, RUBS and their equivalents are banned from universal content, along with disposition mechanics and the OC/FSI/MC/NC/NCD setup codes." },
    { n: 3,  rule: "System-agnostic until C5",               detail: "No Fusion, Skywalker, Yoda, TeraTerm or NextCentury in the C1 walkthrough. Systems attach in C5, per pathway." },
    { n: 4,  rule: "The bill is the object, not the job",    detail: "The learner follows what happens to the bill, not what one role does." },
    { n: 5,  rule: "Three-pathway test per stage",           detail: "Every stage must visibly name touchpoints from at least three pathways. A Billing-only stage is scoped too deep." },
    { n: 6,  rule: "Even airtime",                           detail: "No stage takes more than roughly a fifth of the walkthrough." },
    { n: 7,  rule: "The reverse test",                       detail: "A meter technician, an ESG analyst, a Control specialist and a new developer must each find their place on the map, either a stage they perform or a stage they depend on." },
    { n: 8,  rule: "Split review",                           detail: "Billing SMEs review for accuracy only. Completeness is reviewed exclusively by non-Billing pathway owners." },
    { n: 9,  rule: "Functions, not routes",                  detail: "Say 'someone has to read and capture what the bill says, usually X, sometimes Y.' Never 'the bill goes to X, who sends it to Y.'" },
    { n: 10, rule: "Never an unqualified ambiguous name",    detail: "Synergy is the live case. Conversions, Single Family and Dispositions are the others. State which meaning, or use the function." },
    { n: 11, rule: "No team name enters content unverified", detail: "New in v4. Every team named must trace to a current SME confirmation, not to an existing course or an undated document." }
  ],

  /* ---- Naming layer. Public vocabulary with internal names attached. ---- */
  vocabulary: [
    { publicName: "Expense Management",          internal: "Synergy",  what: "Retrieve, digitise, analyse, audit, dispute and pay utility bills on the client's behalf" },
    { publicName: "Expense Recovery",            internal: "Billing",  what: "Allocate utility cost to residents, issue resident bills, collect payment" },
    { publicName: "Meter Management",            internal: "Meters",   what: "Install, retrofit, maintain submeters; gather reads" },
    { publicName: "Contract Management",         internal: "Control",  what: "Vendor and contract management, compliance" },
    { publicName: "Sustainability and Compliance", internal: "ESG",    what: "Reporting, S2 software, Waste, Building Performance Standards, Energy Procurement" },
    { publicName: "Data and Analytics",          internal: "Integration (process), EDE (group)", what: "Data exchange with client property management software" },
    { publicName: "Not sold as a solution",      internal: "Resident Support / Customer Service", what: "Automatic for every client. Supports Expense Recovery." }
  ],

  /* ---- Decisions come from Monday, not from here. ----
     The Decisions tab reads the "Decision Status" column on board
     18425316244 and shows item names exactly as written there.
     To change a decision, change it in Monday. ---- */

  /* ---- Source documents ---- */
  resources: [
    { name: "Week One Design (v4)",              url: "https://docs.google.com/document/d/1utIepBsVo52-ggx0gcZ8VQB6t_2QFqvfTrtvSOsQejE/edit", note: "Current design document" },
    { name: "Universal Five-Cornerstone Model",  url: "https://docs.google.com/document/d/1gz36LXl5LNXX4xQuVfp3tG0kkHminQ99rTeADu66Vgg/edit", note: "Architecture" },
    { name: "Program Design Roadmap",            url: "https://docs.google.com/document/d/1hv3NfUPg1fbTxfcsUicjDiRkKzP4wruRHf_WSlAgoXI/edit", note: "Phases and dates" },
    { name: "Foundations Planning — Meeting Notes", url: "https://docs.google.com/document/d/14boOwH7HjAC6Mm26rYkKANDNobNX-3jXYCCqdF_nJfI/edit", note: "Living minutes" },
    { name: "Monday board: Foundations Program Redesign", url: "https://conservice989398.monday.com/boards/18425316244", note: "Task tracker, syncs to this dashboard" },
    { name: "Billing EL Design Dashboard",       url: "https://ld-conservice.github.io/Billing-EL-Design-Dashboard/", note: "Companion program" }
  ]
};
