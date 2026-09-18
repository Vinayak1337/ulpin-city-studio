import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],build:{chunkSizeWarningLimit:1500},server:{host:'127.0.0.1',port:5175,strictPort:true,watch:{ignored:['**/qa/**','**/.qa-python/**','**/*.log','**/*.tsbuildinfo']}}});
