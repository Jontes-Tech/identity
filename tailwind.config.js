/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.svelte"],
  theme: {
    extend: {
      colors: {
        background: "#1c1b1e",
        primary: "#4f378a",
        primaryHover: "#5b4493"
      }
    },
  },
  plugins: [],
}

