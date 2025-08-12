import { presetWind3 } from '@unocss/preset-wind3';
import { defineConfig } from 'unocss';

export default defineConfig({
  content: {
    filesystem: ['./src/**/*.{html,js,ts,jsx,tsx}'],
  },
  presets: [presetWind3()],
});
