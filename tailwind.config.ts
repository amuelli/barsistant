import daisyui from "daisyui";
import { type Config } from "tailwindcss";

export default {
  content: ["{routes,islands,components}/**/*.{ts,tsx,js,jsx}"],
  plugins: [
    // @ts-expect-error: daisyui does not have a type definition, but it works as a plugin
    daisyui,
  ],
  daisyui: {
    themes: ["light", "dark", "acid"],
  },
} satisfies Config;
