import fs from 'fs'
import path from 'path'

function generateIndex(dir: string) {
  const absDir = path.resolve(dir)

  if (!fs.existsSync(absDir)) {
    console.error(`❌ El directorio ${absDir} no existe`)
    process.exit(1)
  }

  const files = fs.readdirSync(absDir)

  const exports = files
    .filter(
      (file) =>
        file.endsWith('.ts') && file !== 'index.ts' && !file.endsWith('.d.ts')
    )
    .map((file) => {
      const name = path.basename(file, '.ts')
      return `export * from "./${name}";`
    })

  const content = exports.join('\n') + '\n'

  fs.writeFileSync(path.join(absDir, 'index.ts'), content, 'utf8')

  console.info(`✅ index.ts generado en: ${absDir}`)
}

const args = process.argv.slice(2)
if (args.length < 1) {
  console.error('Uso: npx ts-node scripts/generate-index.ts <directorio>')
  process.exit(1)
}

generateIndex(args[0])
