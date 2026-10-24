import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import sendInviteHandler from './api/send-invite';
import invitationHandler from './api/invitation';

function apiDevServerPlugin(): Plugin {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use('/api/send-invite', async (req, res) => {
        await sendInviteHandler(req, res);
      });
      server.middlewares.use('/api/invitation', async (req, res) => {
        await invitationHandler(req, res);
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), apiDevServerPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
