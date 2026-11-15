import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const port = process.env.PORT || '3000'
const nextCli = fileURLToPath(new URL('../node_modules/next/dist/bin/next', import.meta.url))
const args = [nextCli, 'dev', '--port', port, '--hostname', '0.0.0.0']

const child = spawn(process.execPath, args, {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: '--no-deprecation',
  },
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 0)
})

child.on('error', (error) => {
  console.error(error)
  process.exit(1)
})
