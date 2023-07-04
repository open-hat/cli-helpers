import path from 'path'
import fs from 'fs-extra'
import handlebars from 'handlebars'
import { isBinaryFile } from 'isbinaryfile'
import reporter from './reporter.js'
import walkDir from './walkDir.js'

const replacePathVariables = (initialPath, data) => {
    let finalPath = initialPath
    Object.keys(data).forEach((key) => {
        finalPath = finalPath.replace(RegExp(`{{${key}}}`, 'g'), data[key])
    })
    return finalPath
}
const writeTemplate = async (inFile, outFile, data) => {
    const hbs = await fs.readFile(inFile, 'utf8')
    const template = handlebars.compile(hbs)
    const dest = replacePathVariables(outFile, data)

    reporter.debug(`Installing ${dest} from ${inFile}`)
    await fs.ensureDir(path.dirname(dest))
    await fs.writeFile(dest, template(data))
}

const installTemplate = async (src, dest, data) => {
    await walkDir(src, async (p) => {
        const outPath = path.join(dest, path.relative(src, p))
        if (await isBinaryFile(p)) {
            await fs.copyFile(p, outPath)
        } else {
            await writeTemplate(p, outPath, data)
        }
    })
}

export default installTemplate
