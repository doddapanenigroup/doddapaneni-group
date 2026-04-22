import type { Prisma } from '@/lib/prisma-generated';

/**
 * Initial roster matching the former static `/team` page (English copy).
 * Run `npm run db:seed:team` after migrations to populate `team_member`.
 */
export const TEAM_MEMBER_DEFAULT_ROWS: Prisma.TeamMemberCreateManyInput[] = [
  {
    section: 'FOUNDER',
    sortOrder: 0,
    name: 'Lakshmi S Doddapaneni',
    designation: 'Founder & Digital Strategist',
    description:
      'Lakshmi S Doddapaneni is the visionary behind Doddapaneni Group, with extensive experience in SEO, AI tools, web development, and online business growth. He has successfully worked across industries including digital marketing, real estate, and healthcare in India and the United States.',
    descriptionExtra:
      'With nearly three years of professional experience in the U.S. healthcare sector (Durable Medical Equipment), he brings a unique combination of digital expertise and practical industry knowledge. His leadership focuses on delivering data-driven strategies and long-term success for clients.',
    imageUrl: '/founder.webp',
    imageAlt: 'Lakshmi S Doddapaneni',
    imageOffsetX: 0,
    imageOffsetY: 0,
    imageScale: 1,
  },
  {
    section: 'DEVELOPER',
    sortOrder: 0,
    descriptionExtra: null,
    name: 'K Lokesh Reddy',
    designation: 'Full Stack Developer',
    description:
      'Java Developer with 1.2 years of experience in SQL and React, web applications with HeroUI and delivering efficient, scalable, user-friendly solutions.',
    imageUrl: '/lokesh.webp',
    imageAlt: 'K Lokesh Reddy',
    imageOffsetX: 0,
    imageOffsetY: 0,
    imageScale: 1,
  },
  {
    section: 'DEVELOPER',
    sortOrder: 1,
    name: 'P. Nikitha Petcy',
    designation: 'Web Developer',
    description:
      'Web Developer with 2+ years of experience in WordPress, Elementor and WooCommerce. Skilled in PHP, SEO and high-performance websites.',
    imageUrl: '/nikitha.webp',
    imageAlt: 'P. Nikitha Petcy',
    imageOffsetX: 0,
    imageOffsetY: -5,
    imageScale: 1.08,
  },
  {
    section: 'DEVELOPER',
    sortOrder: 2,
    name: 'Richa Rani',
    designation: 'Web Developer',
    description:
      'Web Developer with 6+ years of experience creating user-friendly, high-performing websites, with expertise in UI/UX and eCommerce.',
    imageUrl: '/richa.webp',
    imageAlt: 'Richa Rani',
    imageOffsetX: 0,
    imageOffsetY: -5,
    imageScale: 1.08,
  },
  {
    section: 'DEVELOPER',
    sortOrder: 3,
    name: 'Snigdha Tatikonda',
    designation: 'Full Stack Developer',
    description:
      'Java Developer experienced in React, SQL, and API integration, focused on building responsive, user-friendly web applications.',
    imageUrl: '/snigdha.webp',
    imageAlt: 'Snigdha Tatikonda',
    imageOffsetX: 0,
    imageOffsetY: -5,
    imageScale: 1.08,
  },
  {
    section: 'DEVELOPER',
    sortOrder: 4,
    name: 'K. Ramakrishna',
    designation: 'Full Stack Developer',
    description:
      'Full stack developer building Spring Boot APIs and React UIs; focused on clean code, performance, and reliable delivery.',
    imageUrl: '/ramakrishna.webp',
    imageAlt: 'K. Ramakrishna',
    imageOffsetX: 0,
    imageOffsetY: 0,
    imageScale: 1,
  },
  {
    section: 'MARKETER',
    sortOrder: 0,
    name: 'Bollam Rajitha',
    designation: 'Digital Marketing Executive',
    description:
      'Digital Marketing Executive with 2.5 years of experience driving brand growth through social media, SEO, content, and paid campaigns to deliver results.',
    imageUrl: '/rajitha.webp',
    imageAlt: 'Bollam Rajitha',
    imageOffsetX: 0,
    imageOffsetY: 0,
    imageScale: 1,
  },
  {
    section: 'MARKETER',
    sortOrder: 1,
    name: 'Vijay Indhuri',
    designation: 'Digital Marketing Executive',
    description:
      'Digital Marketing Executive with 2.5 years of experience in SEO, social media, and online campaigns, focused on delivering measurable growth.',
    imageUrl: '/vijay.webp',
    imageAlt: 'Vijay Indhuri',
    imageOffsetX: 0,
    imageOffsetY: -5,
    imageScale: 1.08,
  },
];
