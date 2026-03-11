/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */

var fs = require('fs')
var path = require('path')

try {
  const buildPath = path.join(__dirname, '../build')

  if (fs.existsSync(buildPath)) {
    fs.rmSync(buildPath, { recursive: true, force: true })
  }
} catch (error) {
  console.error('details:', error)
  process.exit(1)
}
