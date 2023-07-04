import path from'path'

const relativePath = (fp, cwd = process.cwd()) =>
    path.isAbsolute(fp) ? path.relative(cwd, fp) : fp

export default relativePath
