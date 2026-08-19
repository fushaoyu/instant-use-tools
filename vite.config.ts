import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 读取 .env / .env.production 环境变量
  const env = loadEnv(mode, process.cwd(), "");

  return {
    // 优先读取 VITE_PUBLIC_PATH 环境变量，没有则生产环境默认 /instant-use-tools/，开发环境 /
    base:
      env.VITE_PUBLIC_PATH ||
      (mode === "production" ? "/instant-use-tools/" : "/"),

    server: {
      open: true,
      port: 2468,
    },

    plugins: [vue(), tailwindcss()],
    build: {
      outDir: "docs",
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },

    css: {
      preprocessorOptions: {
        scss: {},
      },
    },
  };
});
