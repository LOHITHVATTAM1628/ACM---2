/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glowPulse: {
          '0%, 100%': { textShadow: '0 0 8px rgba(34,211,238,0.4), 0 0 20px rgba(99,102,241,0.2)' },
          '50%': { textShadow: '0 0 18px rgba(34,211,238,0.7), 0 0 40px rgba(139,92,246,0.4)' },
        },
        fadeInSlow: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        neonBorderCycle: {
          '0%, 100%': { boxShadow: '0 0 60px rgba(34,211,238,0.08), 0 0 120px rgba(99,102,241,0.06), inset 0 0 40px rgba(34,211,238,0.02)' },
          '33%':       { boxShadow: '0 0 80px rgba(139,92,246,0.12), 0 0 160px rgba(168,85,247,0.08), inset 0 0 40px rgba(139,92,246,0.03)' },
          '66%':       { boxShadow: '0 0 70px rgba(59,130,246,0.10), 0 0 140px rgba(34,211,238,0.07), inset 0 0 40px rgba(59,130,246,0.02)' },
        },
        bgSweep: {
          '0%':   { transform: 'translateX(-30%) translateY(10%) scale(1)'   },
          '33%':  { transform: 'translateX(10%) translateY(-15%) scale(1.1)' },
          '66%':  { transform: 'translateX(25%) translateY(5%) scale(0.95)'  },
          '100%': { transform: 'translateX(-30%) translateY(10%) scale(1)'   },
        },
        bgSweep2: {
          '0%':   { transform: 'translateX(20%) translateY(-10%) scale(1)'   },
          '50%':  { transform: 'translateX(-20%) translateY(15%) scale(1.15)' },
          '100%': { transform: 'translateX(20%) translateY(-10%) scale(1)'   },
        },
        dbOrbit: {
          '0%':   { transform: 'translateY(0px) scaleX(1)'    },
          '25%':  { transform: 'translateY(-6px) scaleX(0.97)' },
          '50%':  { transform: 'translateY(-10px) scaleX(1)'   },
          '75%':  { transform: 'translateY(-6px) scaleX(1.03)' },
          '100%': { transform: 'translateY(0px) scaleX(1)'    },
        },
        sqlFlicker: {
          '0%, 100%': { opacity: '0.85' },
          '45%':      { opacity: '0.75' },
          '50%':      { opacity: '0.9'  },
          '55%':      { opacity: '0.7'  },
          '60%':      { opacity: '0.85' },
        },
        particleOrbit1: {
          '0%':   { transform: 'translate(0px, 0px)'   },
          '25%':  { transform: 'translate(6px, -8px)'  },
          '50%':  { transform: 'translate(0px, -14px)' },
          '75%':  { transform: 'translate(-5px, -8px)' },
          '100%': { transform: 'translate(0px, 0px)'   },
        },
        particleOrbit2: {
          '0%':   { transform: 'translate(0px, 0px)'  },
          '25%':  { transform: 'translate(-7px, 6px)' },
          '50%':  { transform: 'translate(0px, 12px)' },
          '75%':  { transform: 'translate(6px, 6px)'  },
          '100%': { transform: 'translate(0px, 0px)'  },
        },
        neonRingPulse: {
          '0%, 100%': { opacity: '0.85' },
          '50%':      { opacity: '0.55' },
        },
      },
      animation: {
        'fade-in-up':       'fadeInUp 0.6s ease-out forwards',
        'float':            'float 5s ease-in-out infinite',
        'glow-pulse':       'glowPulse 3s ease-in-out infinite',
        'fade-in-slow':     'fadeInSlow 1.2s ease-out forwards',
        'gradient-shift':   'gradientShift 8s ease infinite',
        'neon-border':      'neonBorderCycle 6s ease-in-out infinite',
        'bg-sweep':         'bgSweep 18s ease-in-out infinite',
        'bg-sweep-2':       'bgSweep2 22s ease-in-out infinite',
        'db-orbit':         'dbOrbit 7s ease-in-out infinite',
        'sql-flicker':      'sqlFlicker 8s ease-in-out infinite',
        'particle-orbit-1': 'particleOrbit1 9s ease-in-out infinite',
        'particle-orbit-2': 'particleOrbit2 11s ease-in-out infinite',
        'neon-ring-pulse':  'neonRingPulse 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}