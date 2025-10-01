const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, '..', 'VERSION.md')
let content = fs.readFileSync(file, 'utf8').trim().split(/\r?\n/)
let versionLine = content.find(l => l.startsWith('Version:'))
let dateLine = content.find(l => l.startsWith('Date:'))

if (!versionLine) {
  console.error('VERSION.md missing Version: line')
  process.exit(1)
}

let version = versionLine.split(':')[1].trim()
let parts = version.replace('v','').split('.').map(n => parseInt(n,10))
parts[2] += 1 // bump patch
const newVersion = `v${parts.join('.')}`
const today = new Date().toISOString().slice(0,10)

content = [
  `Version: ${newVersion}`,
  `Date: ${today}`
]

fs.writeFileSync(file, content.join('\n'))
console.log('Bumped to', newVersion)
