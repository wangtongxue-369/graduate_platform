import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'

import {
  buildCompileArgs,
  buildRunArgs,
  buildWatchRoots,
  shouldTriggerCompile,
} from './dev-watch-lib.mjs'

test('buildRunArgs enables the dev profile by default', () => {
  assert.deepEqual(buildRunArgs(), [
    'spring-boot:run',
    '-Dspring-boot.run.profiles=dev',
  ])
})

test('buildRunArgs appends an override port when provided', () => {
  assert.deepEqual(buildRunArgs({ port: 18081 }), [
    'spring-boot:run',
    '-Dspring-boot.run.profiles=dev',
    '-Dspring-boot.run.arguments=--server.port=18081',
  ])
})

test('buildCompileArgs skips tests for change-driven recompiles', () => {
  assert.deepEqual(buildCompileArgs(), ['-q', '-DskipTests', 'compile'])
})

test('buildWatchRoots targets backend source and resources', () => {
  assert.deepEqual(buildWatchRoots('E:/repo/backend'), [
    path.resolve('E:/repo/backend', 'src/main/java'),
    path.resolve('E:/repo/backend', 'src/main/resources'),
  ])
})

test('shouldTriggerCompile watches java sources and backend resources only', () => {
  assert.equal(shouldTriggerCompile('src/main/java/com/example/App.java'), true)
  assert.equal(shouldTriggerCompile('src/main/resources/application-dev.yml'), true)
  assert.equal(shouldTriggerCompile('src/main/resources/db/seed.sql'), true)
  assert.equal(shouldTriggerCompile('src/main/resources/application-dev.yml~'), false)
  assert.equal(shouldTriggerCompile('src/test/java/com/example/AppTest.java'), false)
  assert.equal(shouldTriggerCompile('target/classes/com/example/App.class'), false)
})
