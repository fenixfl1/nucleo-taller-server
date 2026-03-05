import fs from 'fs'
import path from 'path'
import handlebars from 'handlebars'

export async function compileTemplate(
  templateName: string,
  variables: Record<string, any>
): Promise<string> {
  const filePath = path.join(__dirname, '../templates', `${templateName}.hbs`)
  const templateSource = fs.readFileSync(filePath, 'utf-8')
  const template = handlebars.compile(templateSource)
  return template(variables)
}
