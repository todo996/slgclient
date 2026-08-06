import { defineConfig } from "vite";

const gameHttpUrl =
  process.env.VITE_GAME_HTTP_URL ||
  process.env.GAME_HTTP_URL ||
  "";
const gameWsUrl =
  process.env.VITE_GAME_WS_URL ||
  process.env.GAME_WS_URL ||
  "";

export default defineConfig({
  base: "/",
  define: {
    __GAME_HTTP_URL__: JSON.stringify(gameHttpUrl),
    __GAME_WS_URL__: JSON.stringify(gameWsUrl),
  },
  build: {
    target: "es2022",
    outDir: "dist",
    sourcemap: true,
  },
  server: {
    host: true,
    port: 5173,
  },
});
