import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginSass } from "@rsbuild/plugin-sass";
import { tanstackRouter } from "@tanstack/router-plugin/rspack";
import UnoCSS from "@unocss/postcss";
import { pluginHtmlMinifierTerser } from "rsbuild-plugin-html-minifier-terser";

export default defineConfig({
  plugins: [pluginReact(), pluginSass(), pluginHtmlMinifierTerser()],
  source: {
    entry: { index: "./src/main.tsx" },
  },
  html: {
    template: "./index.html",
    title: "kakiage",
  },
  tools: {
    rspack: {
      plugins: [tanstackRouter({ target: "react", autoCodeSplitting: true })],
    },
    postcss: {
      postcssOptions: {
        plugins: [UnoCSS()],
      },
    },
  },
});
