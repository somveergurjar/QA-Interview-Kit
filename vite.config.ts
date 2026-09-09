import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      // Ignore the runtime JSON database: it's rewritten on every API call (login, OTP
      // send, etc.), and without this Vite treats each write as an asset change and
      // force-reloads the browser mid-request, wiping out in-progress form state.
      watch: process.env.DISABLE_HMR === 'true' ? null : { ignored: ['**/qa_interview_kit_db.json'] },
    },
  };
});
