import path from 'node:path'

const DEFAULT_PROFILE = 'dev'

export function buildRunArgs(options = {}) {
  const args = [
    'spring-boot:run',
    `-Dspring-boot.run.profiles=${options.profile || DEFAULT_PROFILE}`,
  ]

  if (options.port) {
    args.push(`-Dspring-boot.run.arguments=--server.port=${options.port}`)
  }

  return args
}

export function buildCompileArgs() {
  return ['-q', '-DskipTests', 'compile']
}

export function buildWatchRoots(backendDir) {
  return [
    path.resolve(backendDir, 'src/main/java'),
    path.resolve(backendDir, 'src/main/resources'),
  ]
}

export function shouldTriggerCompile(relativePath = '') {
  const normalized = String(relativePath).replaceAll('\\', '/')

  if (!normalized.startsWith('src/main/')) return false
  if (normalized.endsWith('~')) return false
  if (normalized.includes('/target/')) return false

  return normalized.startsWith('src/main/java/')
    || normalized.startsWith('src/main/resources/')
}
