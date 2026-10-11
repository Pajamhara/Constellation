import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// Singlefile : tout (JS + CSS) est intégré dans dist/index.html, qui s'ouvre
// donc aussi par double-clic (file://), sans page blanche. base "./" pour GitHub Pages.
export default defineConfig({ base: "./", plugins: [react(), tailwind(), viteSingleFile()],
  server: { port: 5173, strictPort: true }, // port fixe : utilisé par l'appli de bureau en développement
});
