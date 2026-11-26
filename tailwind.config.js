/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2878ED', 600: '#1F63CC', 400: '#5C9BF5', 100: '#E6F0FE', 50: '#F2F7FF' },
        navy: '#15243B',
        bg: '#F5F7FB',
        ink: { DEFAULT: '#172033', sub: '#778397' },
        line: '#E8EDF4',
        ok: { DEFAULT: '#20B486', bg: '#E5F7F1' },
        warn: { DEFAULT: '#F2A541', bg: '#FEF3E2' },
        danger: { DEFAULT: '#E45D68', bg: '#FDECEE' },
      },
      fontFamily: {
        sans: ['Pretendard', '"Noto Sans KR"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: { card: '20px', xl2: '24px' },
      boxShadow: {
        // 3D 느낌: 근거리 그림자 + 원거리 그림자 + 상단 하이라이트
        card: '0 1px 0 rgba(255,255,255,.9) inset, 0 2px 4px rgba(21,36,59,.04), 0 10px 24px -6px rgba(40,120,237,.14), 0 24px 40px -20px rgba(21,36,59,.18)',
        'card-press': '0 1px 0 rgba(255,255,255,.7) inset, 0 1px 2px rgba(21,36,59,.08), 0 4px 10px -4px rgba(40,120,237,.18)',
        float: '0 1px 0 rgba(255,255,255,.35) inset, 0 8px 16px -4px rgba(40,120,237,.45), 0 18px 30px -10px rgba(21,36,59,.35)',
        nav: '0 -8px 30px -12px rgba(21,36,59,.18)',
      },
      backgroundImage: {
        'grad-primary': 'linear-gradient(160deg,#5C9BF5 0%,#2878ED 55%,#1F63CC 100%)',
        'grad-hero': 'linear-gradient(135deg,#15243B 0%,#27456f 60%,#2878ED 140%)',
        'grad-glass': 'linear-gradient(180deg,rgba(255,255,255,.95),rgba(255,255,255,.75))',
      },
    },
  },
  plugins: [],
};
