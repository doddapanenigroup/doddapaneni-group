/**
 * Seeds published blogs for active company divisions (4 × 13 = 52 posts).
 * Each post includes title, slug, substantial HTML body, featured + OG images, SEO fields.
 *
 * Run:  node scripts/seed-division-blogs.mjs
 *       npm run db:seed:blogs
 *
 * Requires DATABASE_URL, sectors (npm run db:seed) and users seeded.
 * Idempotent: upserts by unique slug.
 */

import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
config({ path: path.join(projectRoot, '.env.local') });
config({ path: path.join(projectRoot, '.env') });

import { PrismaClient } from '../lib/prisma-generated/index.js';

const prisma = new PrismaClient();

const ACTIVE_SECTORS = ['software-it-ai', 'digital-marketing', 'healthcare-medical', 'construction-realestate'];

/** Served via /api/media/<key> when images are in StoredImage */
const IMAGE_KEYS = [
  'home.webp',
  'about.webp',
  'cloud-computing.webp',
  'AI.webp',
  'data-security.webp',
  'digital-transformation.webp',
  'customer-experience.webp',
  'ecommerce.webp',
  'construction.webp',
  'real-estate.webp',
  'medical.webp',
  'telemedicine.webp',
  'medicalfield.webp',
  'productivity.webp',
  'workforce.webp',
  'supplychains.webp',
  'industry.webp',
  'global-trade.webp',
  'news.webp',
  'digital-marketing.webp',
];

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pick(arr, seed) {
  return arr[seed % arr.length];
}

/** Long-form sentence banks — combined per article for non-thin, varied copy */
const A = [
  'Board-level stakeholders increasingly expect transparent roadmaps, disciplined investment trade-offs, and evidence of risk reduction—not only feature velocity.',
  'Mature programmes anchor decisions in measurable outcomes, documented assumptions, and clear ownership across business, technology, and compliance stakeholders.',
  'When delivery pressure rises, teams that preserve architectural coherence and documentation hygiene avoid costly regressions that surface months later in audits or integrations.',
  'Operating cadence matters as much as tools: structured reviews, outcome-based metrics, and escalation paths reduce ambiguity when priorities compete.',
  'External dependencies—vendors, regulators, partners—introduce constraints that should be modeled early rather than treated as last-minute exceptions.',
  'Practical playbooks balance standardization with local autonomy so distributed teams can execute without bypassing governance.',
  'Investing in observability, traceability, and knowledge transfer reduces single points of failure tied to individuals or undocumented workflows.',
  'Leaders who differentiate “must-have now” from “scale later” can sequence work in tranches that protect revenue, safety, and reputation.',
  'Clear communication of scope, dependencies, and acceptance criteria prevents scope drift and protects teams from implicit commitments.',
  'A deliberate approach to change management improves adoption where new processes replace habits formed around legacy tools or informal workarounds.',
  'Risk language should translate into concrete controls, monitoring, and testing—not vague assurances that fail under scrutiny.',
  'Where data informs decisions, data quality, lineage, and access policy deserve the same rigor as the analytics layer itself.',
  'Procurement, legal, and security reviews run faster when requirements and threat models are prepared before negotiation milestones.',
  'Post-implementation reviews, when blameless, convert incidents and near-misses into durable improvements rather than one-off fixes.',
  'Capacity planning should include realistic recovery time objectives and contingency staffing assumptions, not idealized best-case availability.',
];

const B = [
  'Sector teams benefit from reference checklists for readiness gates, so go-live decisions are explicit rather than inferred from calendar pressure.',
  'Cross-functional workshops surface conflicting incentives early—for example revenue acceleration versus control enforcement—and force prioritization before build commitments.',
  'Documentation should capture not only what was built, but why alternatives were rejected; future maintainers need reasoning, not only screenshots.',
  'Training curricula aligned to realistic scenarios produce better adoption than generic feature tours divorced from day-to-day exceptions staff encounter.',
  'Integration contracts—APIs, SLAs, data schemas—should be versioned and tested as thoroughly as customer-facing functionality.',
  'When scaling across regions, localization touches terminology, compliance, and support hours—not just translation of marketing copy.',
  'Technical debt registers, when reviewed quarterly, convert hidden liabilities into scheduled remediation with visible trade-offs.',
  'Vendor scorecards that include security posture, responsiveness, and roadmap alignment outperform price-only comparisons for long-term partnerships.',
  'Executive dashboards should emphasize leading indicators (cycle time, defect escape rate, customer-reported friction) alongside lagging revenue metrics.',
  'Replay exercises after major releases validate monitoring alerts, rollback steps, and on-call runbooks before the next peak season.',
  'Policy statements gain credibility when paired with examples of applied judgment and exceptions handling—not only blanket rules.',
  'Customer-facing commitments in contracts should trace to internal delivery plans to avoid silent gaps between sales promise and operations capacity.',
  'Field feedback loops into product and operations reduce the gap between roadmap theories and on-the-ground constraints.',
  'Quality gates for handoffs between teams (design, build, deploy, operate) reduce rework by clarifying acceptance before downstream work begins.',
  'Ethical and compliance considerations should be embedded in design reviews—not bolted on after launch negotiations.',
];

const C = [
  'Near-term execution should align multi-year roadmaps so tactical wins do not mortgage strategic flexibility without leadership awareness.',
  'Baseline measurements taken before transformation programmes prevent exaggerated success claims unattached to verifiable deltas.',
  'Stakeholder maps help route communications to decision-makers who can remove blockers versus well-meaning observers who cannot authorize change.',
  'Pilot scopes should be representative enough to surface integration pain, yet bounded enough to learn quickly and adjust course.',
  'Exit criteria for pilots—conversion metrics, error budgets, satisfaction thresholds—should be defined before pilot selection to reduce hindsight bias.',
  'Automation without exception paths often fails in edge cases; human-in-the-loop checkpoints remain necessary for regulated or ambiguous decisions.',
  'Continuous improvement rituals falter without accountable owners; action items without names and dates drift indefinitely.',
  'Security controls should assume misuse scenarios, not only external attackers, because insider risk and misconfiguration dominate many incident postmortems.',
  'Accessibility and usability investments improve outcomes for all users and reduce downstream support cost, not only compliance checkbox work.',
  'Sustainability claims require measurable baselines and third-party verification where markets or regulators expect defensible evidence.',
  'Forecasting should expose assumptions explicitly so leadership can stress-test scenarios rather than debate opaque spreadsheet models.',
  'Partner ecosystems amplify reach but require integration diligence, data sharing agreements, and joint incident response planning.',
  'Knowledge bases decay without ownership; rotating editors and periodic audits keep operational procedures trustworthy during turnover.',
  'Incident retrospectives should track recurrence of themes; repeated issues signal systemic gaps rather than individual errors.',
  'Service level objectives are most credible when paired with error budgets enforced by product teams, not only aspirational dashboards.',
];

const D = [
  'If your organisation is evaluating similar priorities, align sponsors, fund incremental governance up front, and sequence work so foundational controls precede broad rollout.',
  'Doddapaneni Group supports clients with structured discovery, pragmatic roadmaps, and delivery patterns suited to complex, multi-stakeholder environments.',
  'We recommend pairing executive narratives with operational detail so steering committees can both inspire and decide with confidence.',
  'Contact our team through the relevant division to discuss scope, timelines, and how we collaborate with your internal subject-matter experts.',
  'Start with a focused assessment: map current capabilities, data flows, and decision rights before committing capital to large platforms or vendor swaps.',
  'Where regulation applies, involve compliance partners in design—not only in final sign-off—to avoid expensive rework or launch delays.',
  'Invest in enablement: templates, training, and coaching accelerate adoption more than adding headcount without shared standards.',
  'Maintain a living risk register updated with triggers, mitigations, and owners reviewed at a regular cadence tied to delivery milestones.',
  'Treat customer and patient or tenant experiences as measurable products: collect feedback instruments tied to service recovery workflows.',
  'Success is rarely a single launch moment; measurable adoption and stable operations over quarters define durable outcomes.',
];

function wordCount(html) {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.split(/\s+/).filter(Boolean).length;
}

function buildBody({ sectorLabel, pillar, bulletThemes, seed }) {
  const s0 = hashSeed(String(seed));
  const pOpen = [
    pick(A, s0) + ' ' + pick(B, s0 + 1),
    `This perspective sets the stage for <strong>${pillar}</strong> as a practical priority for teams operating across <strong>${sectorLabel}</strong>.`,
    pick(C, s0 + 2) + ' ' + pick(A, s0 + 3),
  ].join(' ');

  const h = (n) => hashSeed(String(seed + n * 997));
  const sec = (title, base) => {
    const paras = [
      pick(A, base) + ' ' + pick(B, base + 11) + ' ' + pick(C, base + 7),
      pick(B, base + 3) + ' ' + pick(A, base + 9) + ' ' + pick(C, base + 5),
    ];
    return `<h2>${title}</h2>\n<p>${paras[0]}</p>\n<p>${paras[1]}</p>\n`;
  };

  const bullets = bulletThemes
    .map((t, i) => `<li><strong>${t}</strong> — ${pick(A, h(i + 50))} ${pick(B, h(i + 51))}</li>`)
    .join('\n');

  const close = `<h2>Putting insight into practice</h2>\n<p>${pick(A, h(10))} ${pick(D, h(11))}</p>\n<p>${pick(C, h(12))} ${pick(D, h(13))}</p>\n`;

  return (
    `<p>${pOpen}</p>\n` +
    sec('Strategic context', h(1)) +
    sec('Operational priorities', h(2)) +
    `<h2>Checklist-style considerations</h2>\n<ul>\n${bullets}\n</ul>\n` +
    sec('Implementation discipline', h(3)) +
    close
  );
}

/** 13 topics per sector: slug suffix, display title, SEO, pillar, bullet themes */
const TOPICS_BY_SECTOR = {
  'software-it-ai': [
    ['enterprise-cloud-migration', 'Enterprise cloud migration: a governance-first roadmap', 'Cloud migration roadmap: governance, security, and phased adoption | Doddapaneni Group', 'How to structure cloud migration with governance, security gates, and phased adoption for enterprise scale.', 'cloud migration, enterprise architecture, FinOps, security, Doddapaneni Group', 'Cloud migration and platform governance', ['Landing zone & identity', 'Workload classification', 'Network segmentation', 'Observability baseline', 'FinOps guardrails']],
    ['api-design-governance', 'API design and governance at organizational scale', 'API design & governance for scalable integrations | Doddapaneni Group', 'API governance patterns, lifecycle management, and quality gates that keep integrations secure and evolvable.', 'API governance, integration, microservices, Doddapaneni Group', 'API lifecycle and integration standards', ['Versioning policy', 'Authentication patterns', 'Deprecation process', 'Developer portal', 'Contract testing']],
    ['ai-responsible-operations', 'Responsible AI in day-to-day business operations', 'Responsible AI in operations: controls and accountability | Doddapaneni Group', 'Operationalizing AI with documentation, human oversight, data policy, and accountability appropriate for business risk.', 'responsible AI, governance, ML operations, Doddapaneni Group', 'Responsible use of AI in operations', ['Use-case intake', 'Model documentation', 'Monitoring drift', 'Human review paths', 'Data minimization']],
    ['zero-trust-distributed', 'Zero-trust thinking for distributed teams', 'Zero-trust security patterns for distributed teams | Doddapaneni Group', 'Practical zero-trust principles for identity, devices, and access when teams and systems are widely distributed.', 'zero trust, identity, access management, security, Doddapaneni Group', 'Zero-trust architecture in practice', ['Identity proofing', 'Device posture', 'Least privilege', 'Segmentation', 'Continuous validation']],
    ['data-platforms-governed', 'From data silos to governed data products', 'Governed data products vs silos | Doddapaneni Group', 'Building data platforms around stewardship, lineage, and product thinking—not another passive warehouse.', 'data platform, data governance, lineage, Doddapaneni Group', 'Governed data products', ['Domain ownership', 'Quality SLAs', 'Catalog & lineage', 'Access policy', 'Consumption patterns']],
    ['observability-sre-regulated', 'Observability and SRE discipline in regulated contexts', 'Observability & SRE for regulated environments | Doddapaneni Group', 'Balancing reliability engineering with evidence needs for audits, change control, and operational transparency.', 'SRE, observability, reliability, regulated industries, Doddapaneni Group', 'Operational resilience and evidence', ['SLO design', 'Incident command', 'Change records', 'Runbook maturity', 'Error budgets']],
    ['legacy-modernization', 'Modernizing legacy applications without big-bang risk', 'Legacy modernization strategies without big-bang risk | Doddapaneni Group', 'Incremental modernization patterns that manage risk, continuity, and stakeholder alignment.', 'legacy modernization, strangler fig, refactoring, Doddapaneni Group', 'Incremental legacy modernization', ['Strangler patterns', 'Dual-write risk', 'Data reconciliation', 'Cutover planning', 'Rollback readiness']],
    ['security-sdlc', 'Security by design across the software lifecycle', 'Security by design in the SDLC | Doddapaneni Group', 'Embedding threat modeling, secure build pipelines, and validation into delivery—not as a final gate only.', 'DevSecOps, SDLC, threat modeling, Doddapaneni Group', 'Security in the SDLC', ['Threat modeling cadence', 'Supply chain controls', 'Secrets hygiene', 'Testing depth', 'Release attestations']],
    ['build-vs-buy', 'Build vs buy: decision frames that survive leadership changes', 'Build vs buy frameworks for enterprise software | Doddapaneni Group', 'Durable criteria for build-versus-buy decisions tied to differentiation, TCO, and strategic control.', 'build vs buy, TCO, enterprise software, Doddapaneni Group', 'Build vs buy decisions', ['Differentiation test', 'TCO horizon', 'Vendor lock-in', 'Skill footprint', 'Time-to-value']],
    ['developer-experience-docs', 'Documentation and developer experience as advantage', 'Developer experience & internal documentation | Doddapaneni Group', 'Why internal documentation and ergonomics compound productivity and reduce operational incidents.', 'developer experience, documentation, platform engineering, Doddapaneni Group', 'Documentation and DX', ['Onboarding paths', 'Golden paths', 'SDK usability', 'Support model', 'Quality metrics']],
    ['multicloud-cost-control', 'Cost optimization without compromising reliability', 'Multicloud cost optimization & reliability balance | Doddapaneni Group', 'FinOps practices that reduce waste while preserving resilience and performance for critical workloads.', 'FinOps, multicloud, cost optimization, Doddapaneni Group', 'Cloud cost and reliability', ['Workload placement', 'Commitment strategy', 'Idle detection', 'Performance guardrails', 'Chargeback clarity']],
    ['generative-ai-workflows', 'Integrating generative AI into internal workflows safely', 'Safe generative AI adoption in workflows | Doddapaneni Group', 'Controls and operating models for generative AI in knowledge work without exposing sensitive data.', 'generative AI, workflow automation, data loss prevention, Doddapaneni Group', 'Generative AI in workflows', ['Data boundaries', 'Prompt standards', 'Output review', 'Audit trails', 'Training policy']],
    ['technical-debt-prioritization', 'Technical debt: measuring, prioritizing, refinancing', 'Technical debt registers & prioritization | Doddapaneni Group', 'Turn technical debt into a managed portfolio with business-linked prioritization and transparent trade-offs.', 'technical debt, engineering management, refactoring, Doddapaneni Group', 'Technical debt management', ['Inventory method', 'Risk scoring', 'Interest cost', 'Refinance windows', 'Executive reporting']],
  ],
  'digital-marketing': [
    ['brand-positioning-fragmented-channels', 'Brand positioning across fragmented digital channels', 'Brand positioning across fragmented channels | Doddapaneni Group', 'Coherent brand architecture when audiences move across search, social, email, and partner sites.', 'brand strategy, omnichannel, digital marketing, Doddapaneni Group', 'Brand coherence across channels', ['Message architecture', 'Visual system', 'Voice & tone', 'Proof points', 'Channel guardrails']],
    ['measurement-beyond-last-click', 'Marketing measurement beyond last-click attribution', 'Marketing measurement beyond last-click | Doddapaneni Group', 'Modern measurement, blended models, and experimentation when cookies and identifiers fragment signal.', 'marketing attribution, measurement, MMM, Doddapaneni Group', 'Advanced marketing measurement', ['Incrementality tests', 'Media mix modeling', 'Clean rooms', 'Experiments', 'North-star KPIs']],
    ['content-strategy-complex-b2b', 'Content strategy for complex B2B offerings', 'B2B content strategy for complex offers | Doddapaneni Group', 'Editorial strategy that supports long cycles, multiple buyers, and technical validators.', 'B2B content, demand generation, marketing, Doddapaneni Group', 'Complex B2B content', ['Persona clarity', 'Journey maps', 'Evidence content', 'Sales enablement', 'Governance']],
    ['seo-eeat-regulated', 'SEO and E-E-A-T in sensitive or regulated verticals', 'SEO & E-E-A-T in regulated verticals | Doddapaneni Group', 'Building trustworthy SEO programmes where YMYL-style sensitivities elevate quality expectations.', 'SEO, E-E-A-T, regulated industries, Doddapaneni Group', 'SEO in regulated contexts', ['Author expertise', 'Source quality', 'Medical/legal review', 'Citation discipline', 'UX signals']],
    ['consent-first-personalization', 'Consent-first personalization in marketing operations', 'Consent-first personalization | Doddapaneni Group', 'Operating marketing personalization with privacy-by-design workflows and defensible consent records.', 'consent, personalization, privacy, marketing ops, Doddapaneni Group', 'Privacy-first personalization', ['Consent capture', 'Preference centers', 'Segment ethics', 'Data retention', 'Regional nuance']],
    ['social-proof-enterprise-scale', 'Social proof and reputation at enterprise scale', 'Enterprise social proof & reputation programmes | Doddapaneni Group', 'Case studies, references, reviews, and community signals coordinated for credibility—not scattershot claims.', 'social proof, case studies, reputation, Doddapaneni Group', 'Enterprise social proof', ['Reference strategy', 'Case methodology', 'Review hygiene', 'Crisis response', 'Localization']],
    ['demand-gen-sales-alignment', 'Demand generation aligned with sales reality', 'Demand gen aligned with sales | Doddapaneni Group', 'Pipeline programmes that match MQL definitions to sales capacity and feedback loops.', 'demand generation, sales alignment, ABM, Doddapaneni Group', 'Demand gen & sales alignment', ['Definition of ready', 'SLAs', 'Feedback rituals', 'Content for stage', 'Forecast hygiene']],
    ['creative-testing-digital', 'Creative testing frameworks for digital campaigns', 'Creative testing for performance campaigns | Doddapaneni Group', 'Structured creative iteration: hypotheses, sample sizes, and decision rules for ads and landing pages.', 'creative testing, digital ads, experimentation, Doddapaneni Group', 'Creative experimentation', ['Hypothesis cards', 'Lift thresholds', 'Asset versioning', 'Brand safety', 'Localization']],
    ['lifecycle-email-automation', 'Lifecycle email and marketing automation with discipline', 'Lifecycle email & marketing automation | Doddapaneni Group', 'Automation tracks that respect frequency caps, deliverability health, and dynamic consent.', 'email marketing, lifecycle, automation, Doddapaneni Group', 'Lifecycle automation', ['Deliverability', 'Journey design', 'Triggers', 'Sunset rules', 'Analytics depth']],
    ['international-expansion-marketing', 'International expansion: localization and compliance', 'International marketing: localization & compliance | Doddapaneni Group', 'Scaling campaigns across regions with linguistic nuance, legal constraints, and channel fit.', 'international marketing, localization, compliance, Doddapaneni Group', 'International go-to-market', ['Channel fit', 'Messaging adaptation', 'Legal promo rules', 'Payments & logistics comms', 'Regional analytics']],
    ['privacy-led-ads-changes', 'Preparing for privacy-led advertising changes', 'Privacy-led changes in digital advertising | Doddapaneni Group', 'Organizing teams and tech for durable addressability and measurement as platforms evolve.', 'privacy, advertising platforms, marketing, Doddapaneni Group', 'Post-cookie advertising readiness', ['First-party data', 'Server-side tagging', 'Clean rooms', 'Contextual strategy', 'Testing roadmap']],
    ['attribution-incomplete-data', 'Attribution when data is incomplete or delayed', 'Attribution with incomplete marketing data | Doddapaneni Group', 'Pragmatic approaches when identifiers break and reporting lags business decisions.', 'marketing attribution, data quality, decisions, Doddapaneni Group', 'Attribution with gaps', ['Triangulation', 'Proxy metrics', 'Qual research', 'Investor-grade narratives', 'Tooling limits']],
    ['executive-dashboard-kpis', 'Executive dashboards marketing leaders can defend', 'Marketing KPI dashboards leadership trusts | Doddapaneni Group', 'Designing leadership views that link spend, pipeline, brand, and efficiency without vanity metrics.', 'marketing KPIs, dashboards, executive reporting, Doddapaneni Group', 'Credible marketing KPIs', ['Metric definitions', 'Cohort views', 'Efficiency ratios', 'Guides vs actuals', 'Narrative discipline']],
  ],
  'healthcare-medical': [
    ['revenue-cycle-growing-groups', 'Revenue cycle fundamentals for growing provider groups', 'Revenue cycle basics for growing provider groups | Doddapaneni Group', 'Operational foundations for coding, billing, and cash acceleration as organizations scale.', 'revenue cycle, healthcare operations, billing, Doddapaneni Group', 'Revenue cycle for growth', ['Charge capture', 'Denial analytics', 'Payer mix', 'Cash acceleration', 'KPI cadence']],
    ['interoperability-practice-operations', 'Interoperability and data exchange in day-to-day operations', 'Healthcare interoperability in operations | Doddapaneni Group', 'Practical interoperability priorities for exchanges, interfaces, and clinical workflow continuity.', 'interoperability, FHIR, healthcare IT, Doddapaneni Group', 'Operational interoperability', ['Interface inventory', 'Error handling', 'Master patient index', 'Consent pathways', 'Monitoring']],
    ['compliance-billing-partners', 'Compliance posture for billing and coding partners', 'Compliance for billing & coding partnerships | Doddapaneni Group', 'Partner oversight patterns that protect programmes dealing with claims and PHI.', 'healthcare compliance, billing, coding, Doddapaneni Group', 'Partner compliance posture', ['BAA discipline', 'Audit rights', 'Training evidence', 'Incident notice', 'Subprocessor maps']],
    ['patient-facing-technology-resilience', 'Resilience for patient-facing technology', 'Resilience for patient-facing healthcare tech | Doddapaneni Group', 'Keeping portals, scheduling, and telehealth reliable during peak demand and incidents.', 'telehealth, patient experience, reliability, Doddapaneni Group', 'Patient tech resilience', ['Capacity planning', 'Failover drills', 'Status comms', 'Support scripts', 'Vendor SLAs']],
    ['vendor-management-health-it', 'Vendor management for healthcare IT stacks', 'Healthcare IT vendor governance | Doddapaneni Group', 'Scorecards, exit planning, and integration discipline across a multi-vendor clinical ecosystem.', 'healthcare IT, vendor management, Doddapaneni Group', 'Health IT vendor governance', ['Roadmap alignment', 'Security attestations', 'Ticket analytics', 'Contract cycles', 'Exit strategy']],
    ['telehealth-workflow-integration', 'Telehealth as workflow—not only video', 'Telehealth integrated into clinical workflow | Doddapaneni Group', 'Embedding telehealth into scheduling, documentation, billing, and follow-up to prevent leakage.', 'telehealth, clinical workflow, healthcare, Doddapaneni Group', 'Telehealth workflow design', ['Scheduling rules', 'Documentation templates', 'Billing alignment', 'Remote monitoring', 'Equity access']],
    ['documentation-integrity-audit', 'Documentation integrity and audit readiness', 'Clinical documentation integrity & audits | Doddapaneni Group', 'Practices that reduce retrospective queries and support defensible records.', 'clinical documentation, audits, CDI, Doddapaneni Group', 'Documentation integrity', ['Query management', 'Coding alignment', 'Education loops', 'CDI partnership', 'Denial patterns']],
    ['credentialing-payer-enrollment', 'Scaling credentialing and payer enrollment', 'Credentialing & payer enrollment at scale | Doddapaneni Group', 'Operationalizing provider onboarding with trackers, SLAs, and root-cause analysis on delays.', 'credentialing, payer enrollment, healthcare admin, Doddapaneni Group', 'Credentialing scale', ['Packet standards', 'Primary source', 'Tracker hygiene', 'Escalations', 'Expiration alerts']],
    ['utilization-denials-analytics', 'Analytics for utilization and denials management', 'Utilization & denials analytics in healthcare | Doddapaneni Group', 'Using data to prioritize denials work, identify root causes, and prevent recurrence.', 'denials management, healthcare analytics, Doddapaneni Group', 'Utilization and denials analytics', ['Workbench design', 'Root-cause taxonomies', 'Payer stratification', 'Appeal SLAs', 'Prevention programmes']],
    ['medical-device-procurement-lifecycle', 'Medical device procurement: lifecycle and support', 'Medical device procurement lifecycle | Doddapaneni Group', 'Beyond purchase price: training, maintenance contracts, replacement planning, and vendor responsiveness.', 'medical devices, procurement, healthcare, Doddapaneni Group', 'Device procurement lifecycle', ['Needs assessment', 'Training plans', 'Service contracts', 'End-of-life', 'Compliance records']],
    ['workforce-clinical-admin', 'Workforce planning across clinical and administrative teams', 'Healthcare workforce planning: clinical & admin | Doddapaneni Group', 'Staffing models that align volume forecasts, skill mix, and retention realities.', 'healthcare workforce, staffing, operations, Doddapaneni Group', 'Clinical & admin workforce', ['Demand forecasting', 'Float pools', 'Retention drivers', 'Compensation transparency', 'Burnout signals']],
    ['revenue-integrity-prevention', 'Revenue integrity: prevention versus chasing exceptions', 'Revenue integrity & preventive controls | Doddapaneni Group', 'Shifting upstream to prevent leakage before it becomes retroactive clean-up.', 'revenue integrity, healthcare finance, Doddapaneni Group', 'Preventive revenue integrity', ['Edit libraries', 'Front-end edits', 'Charge master governance', 'Education', 'Monitoring']],
    ['patient-financial-transparency', 'Patient financial experience and transparency initiatives', 'Patient financial experience & transparency | Doddapaneni Group', 'Clear estimates, payment options, and compassionate financial counselling workflows.', 'patient financial experience, transparency, healthcare, Doddapaneni Group', 'Patient financial transparency', ['Estimate accuracy', 'Propensity to pay', 'Payment plans', 'Charity pathways', 'Feedback loops']],
  ],
  'construction-realestate': [
    ['programme-management-multi-phase', 'Programme management for multi-phase developments', 'Programme management for multi-phase projects | Doddapaneni Group', 'Coordinating phases, interfaces, and governance when developments span years and multiple contracts.', 'programme management, construction, real estate, Doddapaneni Group', 'Multi-phase programme management', ['Stage gates', 'Interface registers', 'Risk budgets', 'Reporting cadence', 'Change control']],
    ['design-coordination-rework', 'Design coordination: reducing rework before ground break', 'Design coordination to reduce construction rework | Doddapaneni Group', 'Clash detection, discipline coordination, and decision logs that protect site productivity.', 'design coordination, BIM, construction quality, Doddapaneni Group', 'Design coordination rigor', ['Model standards', 'RFI discipline', 'Workshop rhythm', 'Owner approvals', 'As-built planning']],
    ['procurement-subcontractor-governance', 'Procurement strategy and subcontractor governance', 'Procurement & subcontractor governance | Doddapaneni Group', 'Award strategy, prequalification, and performance management across the supply chain.', 'construction procurement, subcontractors, Doddapaneni Group', 'Procurement governance', ['Prequalification', 'Bid levelling', 'Back charges', 'Safety expectations', 'Payment terms']],
    ['safety-culture-site-documentation', 'Safety culture and regulatory documentation on site', 'Construction safety culture & documentation | Doddapaneni Group', 'Operationalizing safety programmes with visible leadership, audits, and learning loops.', 'construction safety, EHS, compliance, Doddapaneni Group', 'Site safety culture', ['Training verification', 'Near-miss reporting', 'Permit discipline', 'Inspection readiness', 'Subcontractor alignment']],
    ['quality-traceability-handover', 'Quality assurance from materials traceability to handover', 'QA: traceability through handover | Doddapaneni Group', 'Records and testing discipline that protect warranty, owners, and regulator expectations.', 'quality assurance, construction handover, Doddapaneni Group', 'Quality through handover', ['Material certs', 'ITP adherence', 'NCR process', 'Punch lists', 'Commissioning docs']],
    ['development-feasibility-risk', 'Development feasibility and sensitivity analysis', 'Real estate feasibility & sensitivity analysis | Doddapaneni Group', 'Stress-testing assumptions on absorption, cost escalations, and financing—not single-point forecasts.', 'real estate feasibility, development, Doddapaneni Group', 'Feasibility discipline', ['Scenario bands', 'Sensitivity drivers', 'Contingency policy', 'Entitlement risk', 'Exit options']],
    ['sustainable-construction-claims', 'Sustainability in construction without greenwashing', 'Sustainable construction: credible targets | Doddapaneni Group', 'Measurable environmental performance with procurement and commissioning evidence.', 'sustainable construction, green building, Doddapaneni Group', 'Credible sustainability', ['Baseline metrics', 'Material provenance', 'Commissioning scope', 'Certification choices', 'Operations handoff']],
    ['stakeholder-comms-complex-projects', 'Stakeholder communications on complex projects', 'Stakeholder communications for complex projects | Doddapaneni Group', 'Cadence, transparency, and escalation paths for financiers, municipalities, neighbors, and tenants.', 'stakeholder management, construction, Doddapaneni Group', 'Project stakeholder comms', ['Audience mapping', 'Milestone narratives', 'Issue logs', 'Media protocols', 'Community benefits']],
    ['digital-site-logistics-scheduling', 'Digital tools for site logistics and scheduling', 'Digital tools for site logistics & scheduling | Doddapaneni Group', 'Leveraging planning systems for laydown, lifting, traffic, and lookahead coordination.', 'construction technology, scheduling, logistics, Doddapaneni Group', 'Site logistics digitization', ['Lookahead discipline', 'Constraint management', 'Equipment visibility', 'Material call-offs', 'Integration hygiene']],
    ['handover-commissioning-training', 'Handover, commissioning, and owner training packages', 'Handover, commissioning & owner training | Doddapaneni Group', 'Structured packages that close the gap between practical completion and reliable operations.', 'commissioning, handover, facilities, Doddapaneni Group', 'Commissioning & handover', ['O&M manuals', 'Training agendas', 'Warranty registers', 'Defect periods', 'Spare parts']],
    ['property-operations-asset-registers', 'Property operations and asset registers after delivery', 'Post-delivery property operations & asset data | Doddapaneni Group', 'Asset information that supports maintenance, capex planning, and insurance placement.', 'property operations, asset registers, FM, Doddapaneni Group', 'Operational asset data', ['Asset hierarchy', 'CMMS readiness', 'Lifecycle cost', 'Vendor lists', 'Insurance evidence']],
    ['risk-register-contractual-environmental', 'Risk registers: contractual, environmental, and financial', 'Risk registers for construction & real estate | Doddapaneni Group', 'Unified risk thinking across contracts, site conditions, and capital structure.', 'risk management, construction contracts, Doddapaneni Group', 'Integrated risk registers', ['Contract exposures', 'Ground conditions', 'Weather & force majeure', 'Supply chain', 'Finance covenants']],
    ['municipal-permits-entitlements', 'Municipal permits and entitlement timelines', 'Permits & entitlements: realistic timelines | Doddapaneni Group', 'Planning submissions, hearings, and conditions precedent without silent schedule optimism.', 'permits, entitlements, real estate development, Doddapaneni Group', 'Permits & entitlements', ['Submission quality', 'Agency relationships', 'Condition tracking', 'Parallel paths', 'Contingency float']],
  ],
};

function mediaPath(key) {
  return `/api/media/${encodeURIComponent(key)}`;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const author =
    (await prisma.user.findFirst({
      where: { role: 'DIGITAL_MARKETER' },
      select: { id: true },
    })) ||
    (await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
      select: { id: true },
    }));

  if (!author) {
    console.error('No DIGITAL_MARKETER or SUPER_ADMIN user found. Run npm run db:seed first.');
    process.exit(1);
  }

  const sectors = await prisma.sector.findMany({
    where: { slug: { in: ACTIVE_SECTORS } },
    select: { id: true, slug: true, name: true },
  });
  const bySlug = new Map(sectors.map((s) => [s.slug, s]));
  for (const slug of ACTIVE_SECTORS) {
    if (!bySlug.has(slug)) {
      console.error('Missing sector:', slug, '— run npm run db:seed');
      process.exit(1);
    }
  }

  let created = 0;
  let updated = 0;
  let wordsMin = 1e9;
  let wordsMax = 0;

  const baseDate = Date.now();
  let offset = 0;

  for (const sectorSlug of ACTIVE_SECTORS) {
    const sector = bySlug.get(sectorSlug);
    const topics = TOPICS_BY_SECTOR[sectorSlug];
    const sectorLabel = sector.name;

    for (let i = 0; i < topics.length; i++) {
      const [slugPart, title, metaTitle, metaDescription, keywords, pillar, bullets] = topics[i];
      const slug = `${slugPart}`;
      const seed = hashSeed(slug);
      const content = buildBody({
        sectorLabel,
        pillar,
        bulletThemes: bullets,
        seed,
      });
      const wc = wordCount(content);
      wordsMin = Math.min(wordsMin, wc);
      wordsMax = Math.max(wordsMax, wc);
      if (wc < 380) {
        console.warn('Low word count:', slug, wc);
      }

      const imgKey = pick(IMAGE_KEYS, seed);
      const featured = mediaPath(imgKey);
      const publishedAt = new Date(baseDate - (offset + 1) * 86400000 * 2);

      const existing = await prisma.news.findUnique({ where: { slug } });
      const data = {
        title,
        content,
        featuredImage: featured,
        authorId: author.id,
        sectorId: sector.id,
        status: 'published',
        publishedAt,
        scheduledPublishAt: null,
        metaTitle,
        metaDescription,
        keywords,
        ogTitle: metaTitle,
        ogDescription: metaDescription,
        ogImage: featured,
      };

      if (existing) {
        await prisma.news.update({ where: { slug }, data });
        updated++;
      } else {
        await prisma.news.create({ data: { slug, ...data } });
        created++;
      }
      offset++;
    }
  }

  const totalPerSector = ACTIVE_SECTORS.map((s) => TOPICS_BY_SECTOR[s].length);
  console.log(
    JSON.stringify(
      {
        postsPerSector: totalPerSector,
        totalPosts: totalPerSector.reduce((a, b) => a + b, 0),
        created,
        updated,
        wordCountRange: { min: wordsMin, max: wordsMax },
      },
      null,
      2,
    ),
  );
  console.log('Done. Division blog seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
