import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { tanstackRouter } from '@tanstack/router-plugin/rspack';
import UnoCSS from '@unocss/postcss';

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: { index: './src/main.tsx' },
  },
  html: {
    template: './index.html',
  },
  tools: {
    rspack: {
      plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true })],
    },
    postcss: {
      postcssOptions: {
        plugins: [UnoCSS()]
      }
    }
  }
});
