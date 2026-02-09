/**
 * Raw blog content by locale and slug. Used to avoid passing HTML through next-intl
 * formatter (which treats <p> etc. as rich text placeholders).
 */
import en from '@/messages/en.json';
import te from '@/messages/te.json';
import hi from '@/messages/hi.json';
import es from '@/messages/es.json';
import bn from '@/messages/bn.json';
import mr from '@/messages/mr.json';
import ta from '@/messages/ta.json';
import gu from '@/messages/gu.json';
import ur from '@/messages/ur.json';
import kn from '@/messages/kn.json';
import or from '@/messages/or.json';
import ml from '@/messages/ml.json';
import pa from '@/messages/pa.json';
import as from '@/messages/as.json';
import mai from '@/messages/mai.json';
import sat from '@/messages/sat.json';
import ks from '@/messages/ks.json';

type Messages = {
  Blog?: { posts?: Record<string, { content?: string }> };
};

const byLocale: Record<string, Messages> = {
  en: en as Messages,
  te: te as Messages,
  hi: hi as Messages,
  es: es as Messages,
  bn: bn as Messages,
  mr: mr as Messages,
  ta: ta as Messages,
  gu: gu as Messages,
  ur: ur as Messages,
  kn: kn as Messages,
  or: or as Messages,
  ml: ml as Messages,
  pa: pa as Messages,
  as: as as Messages,
  mai: mai as Messages,
  sat: sat as Messages,
  ks: ks as Messages,
};

export function getBlogContent(locale: string, slug: string): string {
  const messages = byLocale[locale] ?? byLocale.en;
  const content = messages?.Blog?.posts?.[slug]?.content;
  return typeof content === 'string' ? content : '';
}
