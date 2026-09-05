import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import {fileURLToPath} from "node:url";

const studio = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(studio, "..");
const api = "http://localhost:4600";
// /episodes, /characters, /music, /screen: staticFile() in the Remotion Player resolves to these root paths.
const proxied = ["/api", "/out", "/public", "/episodes", "/characters", "/music", "/screen"];

export default defineConfig({
  root: studio,
  plugins: [react()],
  publicDir: false,
  resolve: {
    alias: {"@video": path.resolve(root, "src")},
    // The video source under ../src must share one copy of react and remotion with the Player.
    dedupe: ["react", "react-dom", "remotion"],
  },
  server: {
    port: 4610,
    fs: {allow: [root]},
    proxy: Object.fromEntries(proxied.map((p) => [p, {target: api, changeOrigin: false}])),
  },
  build: {outDir: path.resolve(studio, "dist"), emptyOutDir: true},
});
