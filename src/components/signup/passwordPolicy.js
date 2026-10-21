export const MIN_LENGTH = 8;

export const RULES = [
  {
    id: "length",
    label: `At least ${MIN_LENGTH} characters`,
    test: (p) => p.length >= MIN_LENGTH,
  },
  {
    id: "upper",
    label: "An uppercase letter (A-Z)",
    test: (p) => /[A-Z]/.test(p),
  },
  {
    id: "lower",
    label: "A lowercase letter (a-z)",
    test: (p) => /[a-z]/.test(p),
  },
  { id: "number", label: "A number (0-9)", test: (p) => /\d/.test(p) },
  {
    id: "special",
    label: "A special character (!@#$%...)",
    test: (p) => /[^A-Za-z0-9]/.test(p),
  },
];

const COMMON_PASSWORDS = new Set(
  (
    "password password1 password12 password123 passw0rd p@ssw0rd p@ssword pass1234 123456 1234567 12345678 123456789 1234567890 " +
    "12345 1234 111111 000000 123123 654321 121212 112233 987654321 qwerty qwerty123 qwertyuiop qwerty1 asdfgh asdfghjkl zxcvbnm " +
    "1q2w3e4r 1q2w3e 1qaz2wsx qazwsx abc123 abcd1234 abcdef admin admin123 administrator root toor welcome welcome1 welcome123 " +
    "login letmein monkey dragon master shadow sunshine princess football baseball soccer superman batman iloveyou iloveyou1 " +
    "trustno1 hello hello123 freedom whatever starwars michael jordan hunter ranger summer winter secret changeme default guest " +
    "test test123 testing user nairobi kenya mombasa kisumu nakuru harambee mpesa safaricom university campus student nextstep nextstephub"
  ).split(" "),
);

const COMMON_NAMES = [
  // Kenyan
  "wanjiku",
  "wambui",
  "wangari",
  "wairimu",
  "njeri",
  "nyambura",
  "muthoni",
  "wanjiru",
  "kamau",
  "mwangi",
  "kariuki",
  "kimani",
  "njoroge",
  "maina",
  "githinji",
  "otieno",
  "odhiambo",
  "ochieng",
  "onyango",
  "omondi",
  "owino",
  "achieng",
  "akinyi",
  "atieno",
  "adhiambo",
  "awino",
  "anyango",
  "apiyo",
  "wanjala",
  "barasa",
  "wekesa",
  "simiyu",
  "mutua",
  "kioko",
  "musyoka",
  "mwende",
  "mutinda",
  "nzioka",
  "kipchoge",
  "kiprono",
  "kipkemboi",
  "cheruiyot",
  "chebet",
  "jepkoech",
  "jeptoo",
  "korir",
  "kibet",
  "rotich",
  "langat",
  "koech",
  "hassan",
  "mohamed",
  "ahmed",
  "fatuma",
  "amina",
  "halima",
  "zainab",
  "juma",
  "omar",
  "ali",
  // International
  "john",
  "james",
  "peter",
  "paul",
  "mary",
  "jane",
  "joseph",
  "daniel",
  "david",
  "michael",
  "samuel",
  "stephen",
  "brian",
  "kevin",
  "dennis",
  "victor",
  "felix",
  "collins",
  "eric",
  "jacob",
  "moses",
  "isaac",
  "emmanuel",
  "martin",
  "george",
  "patrick",
  "francis",
  "anthony",
  "charles",
  "robert",
  "thomas",
  "joshua",
  "vincent",
  "edwin",
  "lucy",
  "esther",
  "faith",
  "grace",
  "mercy",
  "joy",
  "ruth",
  "sarah",
  "elizabeth",
  "rose",
  "purity",
  "sharon",
  "brenda",
  "cynthia",
  "caroline",
  "beatrice",
  "christine",
  "jennifer",
  "jessica",
  "ashley",
  "emily",
  "hannah",
  "linda",
  "susan",
  "margaret",
  "nancy",
  "agnes",
  "irene",
  "gladys",
  "winnie",
  "vivian",
  "diana",
  "lilian",
  "joyce",
  "ann",
  "anne",
  "alice",
  "betty",
  "janet",
  "judy",
  "naomi",
  "rebecca",
  "rachel",
  "stella",
  "tabitha",
  "priscilla",
  "florence",
  "monica",
  "janet",
  "lydia",
  "jackline",
].filter((n) => n.length >= 4);

const LEET = {
  0: "o",
  1: "i",
  3: "e",
  4: "a",
  5: "s",
  7: "t",
  "@": "a",
  $: "s",
  "!": "i",
};
const deLeet = (s) => s.toLowerCase().replace(/[013457@$!]/g, (c) => LEET[c]);
const lettersOnly = (s) => deLeet(s).replace(/[^a-z]/g, "");

const BAD_SUBSTRINGS = [
  "password",
  "passw0rd",
  "qwerty",
  "letmein",
  "iloveyou",
  "welcome",
  "admin",
  "abc123",
  "nextstep",
];
const BAD_SEQUENCES =
  /(0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321|3210|0000|1111|2222|3333|4444|5555|6666|7777|8888|9999)/;

export function isCommonPassword(pw) {
  const lower = pw.toLowerCase();
  const letters = lettersOnly(pw);
  if (COMMON_PASSWORDS.has(lower) || COMMON_PASSWORDS.has(letters)) return true;
  if (BAD_SUBSTRINGS.some((w) => letters.includes(w))) return true;
  if (BAD_SEQUENCES.test(pw)) return true;
  if (/^(.)\1+$/.test(pw)) return true;
  return false;
}

// Returns the offending name, or null. `ctx` = { email, firstName, middleName, surname }.
export function findNameInPassword(pw, ctx = {}) {
  const letters = lettersOnly(pw);
  const personal = [
    ctx.firstName,
    ctx.middleName,
    ctx.surname,
    ...(ctx.email
      ? String(ctx.email)
          .split("@")[0]
          .split(/[^a-zA-Z]+/)
      : []),
  ]
    .map((s) => lettersOnly(String(s || "")))
    .filter((s) => s.length >= 3);
  const hit = personal.find((n) => letters.includes(n));
  if (hit) return { type: "personal", name: hit };
  const common = COMMON_NAMES.find((n) => letters.includes(n));
  return common ? { type: "common", name: common } : null;
}

export function checkPassword(pw, ctx = {}) {
  const rules = RULES.map((r) => ({
    id: r.id,
    label: r.label,
    ok: r.test(pw),
  }));
  const unmet = rules.find((r) => !r.ok);
  const common = isCommonPassword(pw);
  const nameHit = findNameInPassword(pw, ctx);

  let message = null;
  if (unmet) {
    message = `Password needs: ${unmet.label.toLowerCase()}.`;
  } else if (common) {
    message =
      "That password is too common or easy to guess. Choose something more unique.";
  } else if (nameHit?.type === "personal") {
    message = "Your password can't contain your name or email.";
  } else if (nameHit) {
    message =
      "Your password can't contain a common name. Try a random mix of words.";
  }

  return { rules, common, nameHit, message, valid: !message };
}

function sha1Hex(str) {
  const bytes = new TextEncoder().encode(str);
  const l = bytes.length;
  const padded = new Uint8Array((((l + 8) >> 6) + 1) << 6);
  padded.set(bytes);
  padded[l] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, Math.floor((l * 8) / 4294967296));
  view.setUint32(padded.length - 4, (l * 8) >>> 0);

  const rotl = (n, s) => (n << s) | (n >>> (32 - s));
  let h0 = 0x67452301,
    h1 = 0xefcdab89,
    h2 = 0x98badcfe,
    h3 = 0x10325476,
    h4 = 0xc3d2e1f0;
  const w = new Array(80);

  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(off + i * 4);
    for (let i = 16; i < 80; i++)
      w[i] = rotl(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);

    let a = h0,
      b = h1,
      c = h2,
      d = h3,
      e = h4;
    for (let i = 0; i < 80; i++) {
      let f, k;
      if (i < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (i < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (i < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }
      const t = (rotl(a, 5) + f + e + k + w[i]) | 0;
      e = d;
      d = c;
      c = rotl(b, 30);
      b = a;
      a = t;
    }
    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
  }
  return [h0, h1, h2, h3, h4]
    .map((h) => (h >>> 0).toString(16).padStart(8, "0"))
    .join("")
    .toUpperCase();
}

export async function isPasswordLeaked(pw) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const hash = sha1Hex(pw);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
      signal: controller.signal,
    });
    if (!res.ok) return { leaked: false, count: 0, checked: false };
    const text = await res.text();
    for (const line of text.split("\n")) {
      const [s, count] = line.trim().split(":");
      if (s === suffix && parseInt(count, 10) > 0) {
        return { leaked: true, count: parseInt(count, 10), checked: true };
      }
    }
    return { leaked: false, count: 0, checked: true };
  } catch {
    return { leaked: false, count: 0, checked: false };
  } finally {
    clearTimeout(timer);
  }
}
