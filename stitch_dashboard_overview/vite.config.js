import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiBaseUrl = env.VITE_API_BASE_URL || "";
  const proxyTarget = env.VITE_API_PROXY_TARGET || "";
  const proxyPrefix = apiBaseUrl.startsWith("/")
    ? apiBaseUrl.replace(/\/+$/, "") || "/"
    : "";
  const proxy =
    proxyPrefix && proxyTarget
      ? {
          [proxyPrefix]: {
            target: proxyTarget,
            changeOrigin: true,
          },
        }
      : undefined;

  return {
    plugins: [react()],
    ...(proxy ? { server: { proxy } } : {}),
  };
});
