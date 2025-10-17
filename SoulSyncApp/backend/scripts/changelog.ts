import { execSync } from 'child_process'
import fs from 'fs'

function sh(cmd: string){
  return execSync(cmd, { stdio: ['pipe','pipe','ignore'] }).toString().trim()
}

function main(){
  const lastTag = sh('git describe --tags --abbrev=0 || echo ""')
  const range = lastTag ? `${lastTag}..HEAD` : ''
  const log = sh(`git log ${range} --pretty=format:"* %s (%h) [%an]"`)
  const header = '# Changelog\n\n'
  const content = (lastTag ? `## Since ${lastTag}\n\n` : '## Initial release\n\n') + (log || 'No changes found.')
  fs.writeFileSync('CHANGELOG.md', header + content + '\n')
  console.log('CHANGELOG.md updated')
}

main()
