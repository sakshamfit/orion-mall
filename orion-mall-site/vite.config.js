import { defineConfig } from 'vite';

/**
 * Inlines the built stylesheet into index.html so there is no render-blocking
 * CSS request (the whole sheet is ~6 KiB gzipped and needed for first paint:
 * the loading screen lives in it).
 */
function inlineCssPlugin() {
  return {
    name: 'inline-css',
    enforce: 'post',
    transformIndexHtml(html, ctx) {
      const bundle = ctx.bundle;
      if (!bundle) return html;
      const cssFile = Object.keys(bundle).find((f) => f.endsWith('.css'));
      if (!cssFile) return html;
      const css = bundle[cssFile].source;
      const re = new RegExp(
        '<link[^>]*href="[^"]*' + cssFile.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"[^>]*>',
      );
      if (!re.test(html)) return html;
      delete bundle[cssFile]; // nothing references it any more
      return html.replace(re, `<style>\n${css}\n</style>`);
    },
  };
}

export default defineConfig({
  plugins: [inlineCssPlugin()],
  base: '/',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 900,
  },
});
