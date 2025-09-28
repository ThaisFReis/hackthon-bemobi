/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        danger: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        'whatsapp': {
          header: '#005E54',
          'chat-bg': '#efeae2',
          'bubble-out': '#d9fdd3',
          'bubble-in': '#ffffff',
          green: '#075e54',
          'green-light': '#25d366',
          text: '#111b21',
          'text-meta': 'rgba(0, 0, 0, 0.6)',
          'input-bg': '#f0f2f5',
        }
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'message-in': 'message-in 0.3s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
        'typing-bounce': 'typing-bounce 1.4s infinite ease-in-out both',
      },
      keyframes: {
        'message-in': {
          '0%': { opacity: '0', transform: 'translateY(20px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'typing-bounce': {
          '0%, 80%, 100%': { transform: 'scale(0)' },
          '40%': { transform: 'scale(1.0)' },
        }
      }
    },
  },
  plugins: [],
}