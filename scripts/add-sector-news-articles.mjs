/**
 * Adds 1 published news article to each of these sectors:
 *  - software-it-ai  (Information Technology & AI Development) -> public/AI-in-IT.jpg
 *  - digital-marketing (Digital Marketing) -> public/DM.webp
 *  - healthcare-medical (Healthcare & Medical) -> public/hcm.webp
 *
 * It writes to the `Blog` table so the existing sector news pages pick it up automatically.
 *
 * Images: we reference disk via `/api/media/<publicKey>`, which serves files from `public/` first.
 *
 * Run:
 *   node scripts/add-sector-news-articles.mjs
 */

import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '../lib/prisma-generated/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
config({ path: path.join(projectRoot, '.env.local') });
config({ path: path.join(projectRoot, '.env') });

const prisma = new PrismaClient();

function mediaFromPublicKey(publicKey) {
  // api/media serves public/ first (and falls back to StoredImage in DB).
  return `/api/media/${encodeURIComponent(publicKey)}`;
}

function htmlParagraphs(parts) {
  return parts.map((p) => `<p>${p}</p>`).join('');
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const now = new Date();

  const author =
    (await prisma.user.findFirst({
      where: { role: 'DIGITAL_MARKETER' },
      select: { id: true },
    })) ??
    (await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
      select: { id: true },
    }));

  if (!author) {
    console.error('No DIGITAL_MARKETER or SUPER_ADMIN user found. Run `npm run db:seed` first.');
    process.exit(1);
  }

  const sectorSlugs = ['software-it-ai', 'digital-marketing', 'healthcare-medical'];
  const sectors = await prisma.sector.findMany({
    where: { slug: { in: sectorSlugs } },
    select: { id: true, slug: true },
  });

  const sectorBySlug = new Map(sectors.map((s) => [s.slug, s]));
  const missing = sectorSlugs.filter((s) => !sectorBySlug.has(s));
  if (missing.length) {
    console.error('Missing sectors:', missing.join(', '));
    process.exit(1);
  }

  const articles = [
    {
      sectorSlug: 'software-it-ai',
      slug: 'ai-driven-it-operations-2026',
      title: 'AI-Driven IT Operations: Reducing Downtime with Practical AIOps',
      featuredImage: mediaFromPublicKey('AI-in-IT.jpg'),
      metaTitle: 'AI-Driven IT Operations | Doddapaneni Group',
      metaDescription:
        'A practical guide to AIOps for IT teams: predictive monitoring, faster incident response, and automation that improves uptime without chaos.',
      keywords: 'AIOps, IT Operations, predictive monitoring, incident management, automation',
      ogTitle: 'AI-Driven IT Operations',
      ogDescription:
        'A practical guide to AIOps for IT teams: predictive monitoring, faster incident response, and automation that improves uptime without chaos.',
      content: `
        ${htmlParagraphs([
          'IT systems generate signals every second. The challenge is turning those signals into decisions: what to fix, when to fix it, and how to prevent repeats.',
          'AI-driven IT operations (AIOps) helps teams correlate logs, metrics, and events into actionable recommendations—so incidents are handled faster and with more confidence.',
        ])}
        <h2>1) Start with an outcome, not a model</h2>
        ${htmlParagraphs([
          'Define the operational outcome you care about: reduced MTTR, fewer recurring outages, or faster root-cause identification.',
          'Then instrument the system so the AI can learn from the operational reality you measure.',
        ])}
        <h2>2) Use predictive monitoring for the right signals</h2>
        ${htmlParagraphs([
          'Predictive monitoring works best when signals map to real failure modes (capacity, dependency latency, error-rate spikes, and configuration drift).',
          'Focus on the early indicators that your teams already trust, then expand coverage gradually.',
        ])}
        <h2>3) Automate the first 80% of incident response</h2>
        ${htmlParagraphs([
          'AI can triage and route incidents: identify the likely service, suggest remediation steps, and escalate when human judgment is required.',
          'Automation should be staged: safe recommendations first, then controlled actions once playbooks are validated.',
        ])}
        <h2>What to implement this quarter</h2>
        <ul>
          <li>Incident triage rules aligned to service ownership</li>
          <li>Baseline alert noise reduction (before “AI”)</li>
          <li>Predictive thresholds for top recurring incidents</li>
          <li>Playbooks for automated safe actions</li>
        </ul>
        ${htmlParagraphs([
          'AIOps is most effective when it’s operationally grounded. Build feedback loops with your teams, track outcomes, and iterate.',
        ])}
      `,
    },
    {
      sectorSlug: 'digital-marketing',
      slug: 'digital-marketing-growth-playbook-2026',
      title: 'Digital Marketing Growth Playbook for 2026: Smart Content, Better Targeting',
      featuredImage: mediaFromPublicKey('DM.webp'),
      metaTitle: 'Digital Marketing Growth Playbook | Doddapaneni Group',
      metaDescription:
        'A focused growth playbook for 2026: audience insights, content systems, conversion optimization, and measurement that teams can actually trust.',
      keywords: 'digital marketing, content strategy, conversion optimization, marketing automation, analytics',
      ogTitle: 'Digital Marketing Growth Playbook for 2026',
      ogDescription:
        'A focused growth playbook for 2026: audience insights, content systems, conversion optimization, and measurement that teams can actually trust.',
      content: `
        ${htmlParagraphs([
          'Digital marketing in 2026 rewards teams that run repeatable systems. Not random campaigns—measured, optimized, and continuously improved workflows.',
          'The winning approach connects audience insight to content, then to landing pages and conversion events you can measure end-to-end.',
        ])}
        <h2>Audience insight: build a clear targeting model</h2>
        ${htmlParagraphs([
          'Map your audience by job-to-be-done: what they need to achieve, what stops them, and what proof converts skeptics.',
          'Use first-party signals (site behavior, lead forms, CRM outcomes) as your foundation—not only third-party demographics.',
        ])}
        <h2>Content systems: publish with purpose</h2>
        ${htmlParagraphs([
          'Create content clusters around a problem and a buying journey step, then reuse the structure for faster production.',
          'Every piece should have a measurable role: awareness, consideration, demo intent, or retention.',
        ])}
        <h2>Conversion optimization: improve the moment of decision</h2>
        ${htmlParagraphs([
          'Test offers and messaging on the pages where decisions happen: pricing explanations, service scope, and proof sections.',
          'Track micro-conversions (scroll depth, CTA clicks, form starts) so you can iterate quickly.',
        ])}
        <h2>Measurement that teams can trust</h2>
        <ul>
          <li>Single source of truth for conversions</li>
          <li>UTM and event naming conventions</li>
          <li>Attribution review cadence (weekly or bi-weekly)</li>
          <li>Content performance reviews by cluster</li>
        </ul>
        ${htmlParagraphs([
          'Build a growth engine you can maintain. Consistency beats complexity when the system is well instrumented.',
        ])}
      `,
    },
    {
      sectorSlug: 'healthcare-medical',
      slug: 'telehealth-and-patient-experience-2026',
      title: 'Telehealth and Patient Experience: Using AI to Improve Access (2026)',
      featuredImage: mediaFromPublicKey('hcm.webp'),
      metaTitle: 'Telehealth & Patient Experience | Doddapaneni Group',
      metaDescription:
        'How healthcare providers can use AI responsibly to improve telehealth access, triage, and patient experience—without compromising safety or privacy.',
      keywords: 'healthcare, telehealth, AI triage, patient experience, privacy, compliance',
      ogTitle: 'Telehealth and Patient Experience (2026)',
      ogDescription:
        'How healthcare providers can use AI responsibly to improve telehealth access, triage, and patient experience—without compromising safety or privacy.',
      content: `
        ${htmlParagraphs([
          'Telehealth is transforming access, but patient experience depends on how efficiently care is triaged, scheduled, and followed up.',
          'AI can support providers by improving routing and reducing administrative friction—while keeping clinicians in control of decisions.',
        ])}
        <h2>Where AI helps most in telehealth</h2>
        ${htmlParagraphs([
          'AI-assisted triage can help route patients to the right service level and reduce wait-time variability.',
          'Automated follow-ups and structured intake improve clarity for both patients and clinical teams.',
        ])}
        <h2>Design for safety, privacy, and compliance</h2>
        ${htmlParagraphs([
          'Start with clear governance: what the model can do, what it cannot do, and how escalations work.',
          'Use privacy-by-design: minimize sensitive data exposure and enforce role-based access.',
        ])}
        <h2>Improve the patient journey end-to-end</h2>
        <ul>
          <li>Faster intake with structured questionnaires</li>
          <li>Clear appointment expectations and reminders</li>
          <li>Consistent follow-up workflows after visits</li>
          <li>Clinician review checkpoints for AI outputs</li>
        </ul>
        ${htmlParagraphs([
          'The goal is better access with trustworthy assistance—so patients get timely help and clinicians get support, not noise.',
        ])}
      `,
    },
  ];

  let created = 0;
  let updated = 0;

  for (const a of articles) {
    const sector = sectorBySlug.get(a.sectorSlug);
    if (!sector) continue;

    const existing = await prisma.blog.findUnique({ where: { slug: a.slug } });

    const data = {
      title: a.title,
      content: a.content,
      featuredImage: a.featuredImage,
      authorId: author.id,
      sectorId: sector.id,
      status: 'published',
      publishedAt: now,
      scheduledPublishAt: null,
      metaTitle: a.metaTitle,
      metaDescription: a.metaDescription,
      keywords: a.keywords,
      ogTitle: a.ogTitle,
      ogDescription: a.ogDescription,
      ogImage: a.featuredImage,
    };

    if (existing) {
      await prisma.blog.update({ where: { slug: a.slug }, data });
      updated++;
      console.log('Updated blog:', a.slug);
    } else {
      await prisma.blog.create({ data: { slug: a.slug, ...data } });
      created++;
      console.log('Created blog:', a.slug);
    }
  }

  console.log(`Done. created=${created}, updated=${updated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

