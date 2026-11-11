import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Solo los imports con `?react` se convierten en componente (SinfoniaLogo);
    // el resto de SVG siguen siendo URLs para <img src>
    svgr({ include: '**/*.svg?react' }),
    babel({ presets: [reactCompilerPreset()] })
  ],
})
