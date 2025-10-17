export function versionInfo(){
  const pkg = require("../package.json");
  return { name: pkg.name, version: pkg.version, git: process.env.GIT_SHA || null, node: process.version, time: new Date().toISOString() };
}
