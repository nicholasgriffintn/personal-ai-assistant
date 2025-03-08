import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		visualizer({
			open: false,
			brotliSize: true,
		}),
	],
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					'vendor-react': ['react', 'react-dom', 'react-router-dom'],
					'vendor-ui': ['lucide-react'],
					'vendor-ml': ['@mlc-ai/web-llm'],
					'vendor-utils': ['@tanstack/react-query', '@tanstack/react-query-devtools', 'zustand', 'react-markdown', 'rehype-highlight', 'remark-gfm']
				},
			},
		},
		chunkSizeWarningLimit: 1000,
		minify: 'terser',
		terserOptions: {
			compress: {
				drop_console: true,
				drop_debugger: true,
			},
		},
		reportCompressedSize: true,
		sourcemap: false
	},
});
