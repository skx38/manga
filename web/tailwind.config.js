/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                'vote-up': '#22c55e',
                'vote-down': '#ef4444',
                'vote-neutral': '#6b7280',
                'status-active': '#06b6d4',
                'status-completed': '#8b5cf6',
                'status-planned': '#f59e0b',
                'status-dropped': '#64748b',
            },
            minWidth: {
                'button': '3rem',
            },
            minHeight: {
                'button': '3rem',
            },
        },
    },
    plugins: [],
};
