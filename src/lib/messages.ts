// ─────────────────────────────────────────────
//  Reminder message template engine
// ─────────────────────────────────────────────

export interface ReminderTemplates {
  theyOweMe: string;
  iOweThem: string;
  settled: string;
  theyOweMeSi: string;
  iOweThemSi: string;
  settledSi: string;
}

export const DEFAULT_TEMPLATES_EN = {
  theyOweMe: `Hi {friend}, hope you're doing well! Just a quick reminder about the {currency} {amount} from {date}. Whenever you get a chance to send it over, that'd be great. Thanks! — {myName}`,
  iOweThem: `Hi {friend}, hope you're doing well! Just letting you know that I owe you {currency} {amount} from {date}. I'll transfer it to you as soon as possible. Thanks! — {myName}`,
  settled: `Hi {friend}, all settled between us for our past transactions. Thanks! — {myName}`,
};

export const DEFAULT_TEMPLATES_SI = {
  theyOweMe: `හායි {friend}, කොහොමද ඔයාට?
පොඩි මතක් කිරීමක් කරන්නයි මැසේජ් එක දැම්මේ — {date} වෙනිදා ගනුදෙනුවට අදාළව රුපියල් {amount} ක මුදලක් ලැබෙන්න තියෙනවා.
ඔයාට පුළුවන් වෙලාවක ඒක එවන්න පුළුවන්ද? බොහොම ස්තූතියි!
— {myName}`,
  iOweThem: `හායි {friend}, කොහොමද ඔයාට?
මට ඔයාට රුපියල් {amount} ක මුදලක් දෙන්න තියෙනවා ({date} ගනුදෙනුවට අදාළව). මම ඒක ඉක්මනින්ම එවන්නම්. බොහොම ස්තූතියි උදව්වට!
— {myName}`,
  settled: `හායි {friend}, අපි දෙන්නා අතර තියෙන සියලුම ගනුදෙනු බේරුම් කරලා අවසන්. බොහොම ස්තූතියි!
— {myName}`,
};

export const DEFAULT_TEMPLATES: ReminderTemplates = {
  theyOweMe: DEFAULT_TEMPLATES_EN.theyOweMe,
  iOweThem: DEFAULT_TEMPLATES_EN.iOweThem,
  settled: DEFAULT_TEMPLATES_EN.settled,
  theyOweMeSi: DEFAULT_TEMPLATES_SI.theyOweMe,
  iOweThemSi: DEFAULT_TEMPLATES_SI.iOweThem,
  settledSi: DEFAULT_TEMPLATES_SI.settled,
};

export interface TemplateVars {
  friend: string;
  currency: string;
  amount: string;
  count?: number;
  lastDate?: string;
  myName: string;
  date?: string;
}

/**
 * Render a template string by replacing {variable} placeholders.
 */
export function renderTemplate(template: string, vars: TemplateVars): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = vars[key as keyof TemplateVars];
    return value !== undefined ? String(value) : `{${key}}`;
  });
}

/**
 * Sinhala month names
 */
const SINHALA_MONTHS = [
  "ජනවාරි", "පෙබරවාරි", "මාර්තු", "අප්‍රේල්", "මැයි", "ජූනි",
  "ජූලි", "අගෝස්තු", "සැප්තැම්බර්", "ඔක්තෝබර්", "නොවැම්බර්", "දෙසැම්බර්"
];

/**
 * Format a date nicely into Sinhala, e.g. "ඔක්තෝබර් 28"
 */
export function formatDateSinhala(date: Date | string | null | undefined): string {
  if (!date) return "මෑතකදී";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "මෑතකදී";
  const monthName = SINHALA_MONTHS[d.getMonth()];
  const day = d.getDate();
  return `${monthName} ${day}`;
}

/**
 * Format a date into friendly English, e.g. "October 28th"
 */
export function formatDateEnglishFriendly(date: Date | string | null | undefined): string {
  if (!date) return "recently";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "recently";
  const month = d.toLocaleDateString("en-US", { month: "long" });
  const day = d.getDate();
  const nth = (n: number) => {
    if (n > 3 && n < 21) return `${n}th`;
    switch (n % 10) {
      case 1: return `${n}st`;
      case 2: return `${n}nd`;
      case 3: return `${n}rd`;
      default: return `${n}th`;
    }
  };
  return `${month} ${nth(day)}`;
}

/**
 * Common Sri Lankan first names transliterated into Sinhala
 */
const COMMON_NAMES_SI: Record<string, string> = {
  kaveesha: "කවීෂ",
  kavinda: "කවින්ද",
  yasith: "යසිත්",
  kasun: "කසුන්",
  nimal: "නිමල්",
  kamal: "කමල්",
  chathura: "චතුර",
  sandun: "සඳුන්",
  lahiru: "ලහිරු",
  nuwan: "නුවන්",
  sahan: "සහන්",
  dilshan: "දිල්ශාන්",
  sachin: "සචින්",
  ruwan: "රුවන්",
  janaka: "ජනක",
  anura: "අනුර",
  pradeep: "ප්‍රදීප්",
  tharindu: "තරිඳු",
  shehan: "ශෙහාන්",
  isuru: "ඉසුරු",
  hasitha: "හසිත",
  dhanushka: "ධනුෂ්ක",
  malith: "මලිත්",
  chamara: "චාමර",
  mahesh: "මහේෂ්",
  roshan: "රොෂාන්",
  sanjeewa: "සංජීව",
  niroshan: "නිරෝෂන්",
  asanka: "අසංක",
  sampath: "සම්පත්",
  amila: "අමිල",
  gayan: "ගයාන්",
  suranga: "සුරංග",
  dilan: "දිලාන්",
  supun: "සුපුන්",
  pramod: "ප්‍රමෝද්",
  dinesh: "දිනේෂ්",
  dinuka: "දිනුක",
  vimukthi: "විමුක්ති",
  kavindu: "කවිඳු",
  kaveen: "කවීන්",
  navod: "නවෝද්",
  pasindu: "පසිඳු",
  charith: "චරිත්",
  harsha: "හර්ෂ",
  harshana: "හර්ෂණ",
  avishka: "අවිශ්ක",
  bhanuka: "භානුක",
  danushka: "ධනුෂ්ක",
  dharshana: "දර්ශන",
  indika: "ඉන්දික",
  janith: "ජනිත්",
  kelum: "කැලුම්",
  manjula: "මංජුල",
  nadeesha: "නදීෂ",
  nilanga: "නිලංග",
  omesh: "ඔමේෂ්",
  pasan: "පසන්",
  praveen: "ප්‍රවීන්",
  ranil: "රනිල්",
  ravindu: "රවිඳු",
  rukshan: "රුක්ෂාන්",
  sajith: "සජිත්",
  sameera: "සමීර",
  sanka: "සංක",
  shashika: "ශෂික",
  sudesh: "සුදේශ්",
  theekshana: "තීක්ෂණ",
  upul: "උපුල්",
  vidura: "විදුර",
  yohan: "යොහාන්",
  oshada: "ඔෂධ",
  madushan: "මධුෂාන්",
  nadeeka: "නදීකා",
  chathurika: "චතුරිකා",
  sanduni: "සඳුනි",
  hiruni: "හිරුනි",
  oshadi: "ඔෂධී",
  dilini: "දිලිනි",
  anuradha: "අනුරාධ",
  damith: "දමිත්",
  eranga: "එරංග",
  kusal: "කුසල්",
  wanindu: "වනිඳු",
  pathum: "පැතුම්",
  dimuth: "දිමුත්",
  chamika: "චාමික",
  maheesh: "මහීෂ්",
  charithra: "චරිත්‍ර",
  chathuranga: "චතුරංග",
};

/**
 * Extract or transliterate a name to its friendly Sinhala representation
 */
export function toSinhalaName(name: string): string {
  if (!name) return "";
  const firstWord = name.trim().split(" ")[0];
  // If already contains Sinhala characters
  if (/[\u0D80-\u0DFF]/.test(firstWord)) {
    return firstWord;
  }
  const lower = firstWord.toLowerCase();
  if (COMMON_NAMES_SI[lower]) {
    return COMMON_NAMES_SI[lower];
  }
  return firstWord;
}

/**
 * Generate a friendly reminder message in Sinhala or English
 */
export function generateReminderMessage({
  friendName,
  myName,
  currency = "LKR",
  net,
  lastTxDate,
  language = "si",
  templates,
}: {
  friendName: string;
  myName: string;
  currency?: string;
  net: number;
  lastTxDate?: string | Date | null;
  language?: "si" | "en";
  templates?: Partial<ReminderTemplates> | null;
}): string {
  const isSettled = Math.abs(net) < 0.01;
  const isOwedToMe = net > 0;
  const num = Math.abs(net);

  if (language === "si") {
    const friend = toSinhalaName(friendName);
    const sender = toSinhalaName(myName);
    const date = formatDateSinhala(lastTxDate);
    const amount = num.toFixed(2);

    const tpl = isSettled
      ? (templates?.settledSi ?? DEFAULT_TEMPLATES_SI.settled)
      : isOwedToMe
      ? (templates?.theyOweMeSi ?? DEFAULT_TEMPLATES_SI.theyOweMe)
      : (templates?.iOweThemSi ?? DEFAULT_TEMPLATES_SI.iOweThem);

    return renderTemplate(tpl, {
      friend,
      currency: "රු.",
      amount,
      date,
      lastDate: date,
      myName: sender,
    });
  } else {
    const friend = friendName.trim().split(" ")[0] || friendName;
    const sender = myName.trim().split(" ")[0] || myName;
    const date = formatDateEnglishFriendly(lastTxDate);
    const amount = num % 1 === 0 ? num.toFixed(0) : num.toFixed(2);

    const tpl = isSettled
      ? (templates?.settled ?? DEFAULT_TEMPLATES_EN.settled)
      : isOwedToMe
      ? (templates?.theyOweMe ?? DEFAULT_TEMPLATES_EN.theyOweMe)
      : (templates?.iOweThem ?? DEFAULT_TEMPLATES_EN.iOweThem);

    return renderTemplate(tpl, {
      friend,
      currency,
      amount,
      date,
      lastDate: date,
      myName: sender,
    });
  }
}

/**
 * Normalize any phone number into an international E.164-compatible digit string without '+'.
 */
export function normalizePhoneNumber(phone: string, defaultCountryCode = "94"): string {
  if (!phone) return "";
  const trimmed = phone.trim();

  // If user explicitly prefixed with +, strip + and keep the remaining digits
  if (trimmed.startsWith("+")) {
    return trimmed.replace(/\D/g, "");
  }

  // Strip non-digits
  let digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";

  // If starts with 00 (international call prefix, e.g. 0094...)
  if (digits.startsWith("00")) {
    digits = digits.replace(/^00+/, "");
  }

  // If starts with single 0 (national trunk code, e.g. 0769055019)
  if (digits.startsWith("0")) {
    const withoutZero = digits.replace(/^0+/, "");
    // If remaining length is standard Sri Lankan (9 digits, e.g. 769055019), prepend 94
    if (withoutZero.length === 9) {
      return `${defaultCountryCode}${withoutZero}`;
    }
    return `${defaultCountryCode}${withoutZero}`;
  }

  // If user entered exactly 9 digits (common in Sri Lanka: e.g. 769055019)
  if (digits.length === 9) {
    return `${defaultCountryCode}${digits}`;
  }

  return digits;
}

/**
 * Format a phone number for human-friendly display (e.g. +94 76 905 5019).
 */
export function formatDisplayPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const norm = normalizePhoneNumber(phone);
  if (!norm) return phone;

  // Sri Lanka format: 94 + 9 digits -> +94 XX XXX XXXX
  if (norm.startsWith("94") && norm.length === 11) {
    const operator = norm.slice(2, 4);
    const part1 = norm.slice(4, 7);
    const part2 = norm.slice(7);
    return `+94 ${operator} ${part1} ${part2}`;
  }

  return `+${norm}`;
}

/**
 * Build a WhatsApp deep-link URL.
 * Uses normalized international digits so wa.me opens the correct chat.
 */
export function buildWhatsappUrl(phone: string, message: string): string {
  const digits = normalizePhoneNumber(phone);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${digits}?text=${encoded}`;
}

/**
 * Parse stored reminder templates JSON or fall back to defaults.
 */
export function parseTemplates(json: string | null | undefined): ReminderTemplates {
  if (!json) return DEFAULT_TEMPLATES;
  try {
    const parsed = JSON.parse(json) as Partial<ReminderTemplates>;
    return {
      theyOweMe: parsed.theyOweMe ?? DEFAULT_TEMPLATES.theyOweMe,
      iOweThem: parsed.iOweThem ?? DEFAULT_TEMPLATES.iOweThem,
      settled: parsed.settled ?? DEFAULT_TEMPLATES.settled,
      theyOweMeSi: parsed.theyOweMeSi ?? DEFAULT_TEMPLATES.theyOweMeSi,
      iOweThemSi: parsed.iOweThemSi ?? DEFAULT_TEMPLATES.iOweThemSi,
      settledSi: parsed.settledSi ?? DEFAULT_TEMPLATES.settledSi,
    };
  } catch {
    return DEFAULT_TEMPLATES;
  }
}
