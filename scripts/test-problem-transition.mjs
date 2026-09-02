import { createServer } from 'vite'

const server = await createServer({
  appType: 'custom',
  configFile: false,
  logLevel: 'error',
  server: {
    middlewareMode: true,
  },
})

try {
  const testModule = await server.ssrLoadModule('/src/screens/nativeIdentity.test.ts')
  await testModule.runProblemListToProblemNativeIdentityTest()
  console.log('native transition identity tests passed')
} finally {
  await server.close()
}
