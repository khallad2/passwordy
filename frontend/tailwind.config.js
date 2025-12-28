/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#0a0a0c',
                primary: {
                    DEFAULT: '#9333ea',
                    glow: '#a855f7',
                },
                accent: '#c084fc',
                surface: 'rgba(23, 23, 27, 0.7)',
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'noise': "url('https://grainy-gradients.vercel.app/noise.svg')",
            },
            boxShadow: {
                'neon': '0 0 15px rgba(147, 51, 234, 0.5)',
                'neon-strong': '0 0 25px rgba(147, 51, 234, 0.7)',
            }
        },
    },
    plugins: [],
}
