import { readFileSync, writeFileSync, existsSync } from 'fs'

const ORG = process.env.GITHUB_ORG
const REPO = process.env.GITHUB_REPO
const DOMAIN = process.env.DOMAIN

function patchReadme() {
  if (!ORG || !REPO) return
  try {
    const p = 'README.md'
    let s = readFileSync(p, 'utf-8')
    s = s.replace(/github\.com\/<your-org>\/<your-repo>/g, `github.com/${ORG}/${REPO}`)
    writeFileSync(p, s)
    console.log('README badges updated to', `${ORG}/${REPO}`)
  } catch (e) { console.error('README patch error', e) }
}

function patchRobots() {
  if (!DOMAIN) return
  const p = 'frontend/public/robots.txt'
  if (!existsSync(p)) return
  try {
    let s = readFileSync(p, 'utf-8')
    s = s.replace(/https:\/\/\<your-domain\>\/sitemap\.xml/g, `https://${DOMAIN}/sitemap.xml`)
    writeFileSync(p, s)
    console.log('robots.txt sitemap set to', DOMAIN)
  } catch (e) { console.error('robots patch error', e) }
}

function patchSecurity() {
  if (!DOMAIN) return
  const p = 'frontend/public/.well-known/security.txt'
  if (!existsSync(p)) return
  try {
    let s = readFileSync(p, 'utf-8')
    s = s.replace(/^Policy:.*$/m, `Policy: https://${DOMAIN}/.well-known/security`)
    writeFileSync(p, s)
    console.log('security.txt policy set to', DOMAIN)
  } catch (e) { console.error('security patch error', e) }
}

patchReadme()
patchRobots()
patchSecurity()
