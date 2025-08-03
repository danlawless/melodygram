/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme backgrounds
        'bg-primary': '#0a0a0a',
        'bg-secondary': '#1a1a1a', 
        'bg-accent': '#2a2a2a',
        
        // Text colors
        'text-primary': '#ffffff',
        'text-secondary': '#b3b3b3',
        'text-muted': '#666666',
        
        // Brand colors
        'melody-purple': '#8b5cf6',
        'melody-pink': '#ec4899',
        'melody-blue': '#3b82f6',
        
        // Additional theme colors
        'border-subtle': 'rgba(255,255,255,0.1)',
        'border-accent': 'rgba(255,255,255,0.2)',
      },
      backgroundImage: {
        'melody-gradient': 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
        'melody-subtle': 'linear-gradient(135deg, #F3E8FF 0%, #FCE7F3 100%)',
      },
      fontFamily: {
        'primary': ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
        'display': ['Satoshi', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-gentle': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-gentle': 'bounce 1s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in': 'slideIn 0.6s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
} 