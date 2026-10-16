import { defineConfig } from 'vite';

// './' = funciona em qualquer nome de repositório no GitHub Pages
// sem precisar configurar o nome do repo.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
  },
});
