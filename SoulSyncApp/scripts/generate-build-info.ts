import { writeFileSync, readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('package.json','utf-8'))
const date = pkg.lastUpdated || new Date().toISOString().split('T')[0]

writeFileSync('frontend/public/build-info.json', JSON.stringify({ lastUpdated: date, version: pkg.version }))
console.log('Generated build-info.json with date', date, 'and version', pkg.version)
