import { readFileSync, writeFileSync } from "fs"
import { resolve } from "path";

const rootDir = resolve(__dirname, "..")
const packageJsonPath = resolve(rootDir, "package.json")
const packageJsonContents = readFileSync(packageJsonPath).toString()
const config = JSON.parse(packageJsonContents)
const ver = config.version as string
const m = ver.match(/(\d+)\.(\d+)\.(\d+)/)
if (m) {
  const [_, major, minor, revision] = m
  let rev = parseInt(revision)
  rev++
  config.version = `${major}.${minor}.${rev}`
  writeFileSync(packageJsonPath, JSON.stringify(config, null, 2))
  console.log(`Bumped package version to ${config.version}`)
}