import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vendor',
              test: /node_modules[\\/]/,
              priority: 2,
            },
            {
              name: 'problem-data',
              test: /src[\\/]data[\\/]problems[\\/].+\.json$/,
              priority: 1,
            },
            {
              name: 'reference-data',
              test: /src[\\/]data[\\/](categories|collections|patterns)\.json$/,
              priority: 1,
            },
          ],
        },
      },
    },
  },
})
