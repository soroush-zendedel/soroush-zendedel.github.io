/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './en/index.html'],
  theme: {
    extend: {
      colors: {
        ink: '#1a1a1a',
        paper: '#e8e6e1',
        canvas: '#fdfcfb',
        crimson: '#b91c1c',
        crimsonHover: '#991b1b',
      },
      fontFamily: {
        fa: ['Vazirmatn', 'sans-serif'],
        en: ['Lora', 'serif'],
      },
      boxShadow: {
        artistic: '0 20px 40px -10px rgba(0,0,0,0.1), 0 0 20px rgba(185,28,28,0.03)',
      },
    },
  },
};
