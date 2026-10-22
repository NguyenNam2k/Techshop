import plugin from 'tailwindcss/plugin';
import colors from 'tailwindcss/colors';

/* ------------------------------------------------------------------ *
 *  Theme dark / light
 *  - Toàn bộ giao diện đang dùng thang màu `slate` (nền tối).
 *  - Thay vì sửa từng class, thang `slate` (và các tông nhấn 300/400)
 *    được map qua biến CSS. Dark = giá trị gốc của Tailwind.
 *    Light  = thang đảo ngược (xem LIGHT_SLATE).
 *  - <header> và <footer> luôn bị khoá về giá trị dark.
 * ------------------------------------------------------------------ */

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

const toTriplet = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

const DARK_SLATE = Object.fromEntries(SHADES.map((s) => [s, colors.slate[s]]));

const LIGHT_SLATE = {
  50: colors.slate[900],
  100: colors.slate[900],
  200: colors.slate[800],
  300: colors.slate[700],
  400: colors.slate[600],
  500: colors.slate[500],
  600: colors.slate[400],
  700: colors.slate[300],
  800: colors.slate[200],
  900: '#ffffff',
  950: colors.slate[50]
};

// Tông nhấn: đậm đà, sắc nét và có lực trên nền sáng.
const ACCENTS = {
  sky: [500, 600],
  emerald: [500, 600],
  amber: [500, 600],
  teal: [500, 600],
  cyan: [500, 600],
  yellow: [500, 600],
  orange: [500, 600],
  blue: [500, 600],
  indigo: [500, 600],
  violet: [500, 600],
  purple: [500, 600],
  rose: [500, 600],
  red: [500, 600]
};

const varColor = (name) => `rgb(var(--${name}) / <alpha-value>)`;

const themeColors = {
  slate: Object.fromEntries(SHADES.map((s) => [s, varColor(`slate-${s}`)])),
  ...Object.fromEntries(
    Object.keys(ACCENTS).map((c) => [
      c,
      { 300: varColor(`${c}-300`), 400: varColor(`${c}-400`) }
    ])
  )
};

const buildVars = (mode) => {
  const out = {};
  const slate = mode === 'light' ? LIGHT_SLATE : DARK_SLATE;
  SHADES.forEach((s) => {
    out[`--slate-${s}`] = toTriplet(slate[s]);
  });
  Object.entries(ACCENTS).forEach(([c, [l300, l400]]) => {
    out[`--${c}-300`] = toTriplet(mode === 'light' ? colors[c][l300] : colors[c][300]);
    out[`--${c}-400`] = toTriplet(mode === 'light' ? colors[c][l400] : colors[c][400]);
  });
  return out;
};

// ---- Chữ trắng: giữ trắng trên nền màu đặc, đổi sang chữ tối trên bề mặt (slate) ở light ----
const SOLID_FAMILIES = [
  'sky', 'blue', 'indigo', 'violet', 'purple', 'emerald', 'teal', 'cyan',
  'rose', 'red', 'orange', 'amber'
];
const SOLID_SHADES = [500, 600, 700];
const SOLID_TOKENS = [];
SOLID_FAMILIES.forEach((c) =>
  SOLID_SHADES.forEach((s) =>
    ['bg', 'from', 'to'].forEach((p) => SOLID_TOKENS.push(`.${p}-${c}-${s}`))
  )
);
const SOLID = `:is(${SOLID_TOKENS.join(', ')})`;
const SLATE_SURFACE = ':is([class^="bg-slate-"], [class*=" bg-slate-"])';

const L = 'html[data-theme="light"]';
const DARK_TEXT = '#0f172a';

const WHITE_TARGETS = ['.text-white', '.hover\\:text-white:hover', '.group:hover .group-hover\\:text-white'];
const forWhite = (prefix) => WHITE_TARGETS.map((t) => `${prefix} ${t}`).join(', ');
const forWhiteSelf = (prefix) =>
  ['.text-white', '.hover\\:text-white:hover'].map((t) => `${prefix}${t}`).join(', ');

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ...themeColors,
        'cyber-cyan': '#06b6d4',
        'neon-violet': '#8b5cf6',
        'electric-blue': '#38bdf8',
        'vivid-purple': '#a78bfa'
      }
    }
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ':root': buildVars('dark'),
        [L]: { ...buildVars('light'), 'color-scheme': 'light' },
        // Footer luôn giữ giao diện tối
        [`${L} :is(footer, .dark-locked)`]: { ...buildVars('dark'), 'color-scheme': 'dark' },

        // Bóng đổ đen đậm quá nặng trên nền sáng
        [`${L} [class*="shadow-black"]`]: { '--tw-shadow-color': 'rgb(15 23 42 / 0.22)' },

        // text-slate-950 luôn là chữ tối (dùng trên nút màu sáng: amber/sky/emerald)
        [`${L} .text-slate-950, ${L} .hover\\:text-slate-950:hover`]: { color: '#020617' },

        // 1) mặc định: text-white -> chữ tối
        [forWhite(L)]: { color: DARK_TEXT },
        // 2) trên nền màu đặc (chính nó hoặc cha) -> trắng
        [`${forWhiteSelf(`${L} ${SOLID}`)}, ${forWhite(`${L} ${SOLID}`)}`]: { color: '#ffffff' },
        // 3) bề mặt slate nằm trong nền màu -> tối
        [`${forWhite(`${L} ${SLATE_SURFACE}`)}`]: { color: DARK_TEXT },
        // 4) nền màu nằm trong bề mặt slate (vd nút xanh trong card) -> trắng
        [`${forWhiteSelf(`${L} ${SLATE_SURFACE} ${SOLID}`)}, ${forWhite(`${L} ${SLATE_SURFACE} ${SOLID}`)}`]: {
          color: '#ffffff'
        },
        // 5) bề mặt slate nằm trong nền màu -> tối
        [`${forWhite(`${L} ${SOLID} ${SLATE_SURFACE}`)}`]: { color: DARK_TEXT },
        // Footer: luôn trắng như cũ
        [`${forWhiteSelf(`${L} :is(footer, .dark-locked)`)}, ${forWhite(`${L} :is(footer, .dark-locked)`)}`]: {
          color: '#ffffff'
        }
      });
    })
  ]
};
