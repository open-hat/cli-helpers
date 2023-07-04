import os from 'os'
import path from 'path'
import fs from 'fs-extra'
import reporter from '../reporter.js' // TODO: generalize
import fetchAndExtract from './fetchAndExtract.js'

class Cache {
    constructor({ name, cacheRoot, requestOpts = {} }) {
        if (cacheRoot) {
            this.cacheRoot = cacheRoot
        } else if (name) {
            this.cacheRoot = path.join(os.homedir(), '.cache', name)
        } else {
            throw new Error(
                'Either name or cacheDir must be specified to Cache initializer'
            )
        }
        this.requestOpts = requestOpts
        fs.ensureDir(this.baseDir).catch((e) =>
            reporter.debug('Failed to create Cache dir', e)
        )
    }

    async exists(pathname) {
        return await fs.pathExists(this.getCacheLocation(pathname))
    }

    get baseDir() {
        return path.join(this.cacheRoot, 'cache')
    }

    get tmpDir() {
        return path.join(this.cacheRoot, '.tmp')
    }

    getCacheLocation(pathname) {
        const loc = path.join(this.baseDir, pathname)
        if (loc.indexOf(this.baseDir) !== 0) {
            throw new Error(
                'Cache items must be within the cache directory, relative paths are not allowed.'
            )
        }
        return loc
    }

    async write(filepath, data) {
        const loc = this.getCacheLocation(filepath)
        try {
            await fs.outputFile(loc, data)
        } catch (e) {
            reporter.debug('Cache.write failed', e)
        }
    }

    async read(filepath) {
        const loc = this.getCacheLocation(filepath)
        try {
            return await fs.readFile(loc, { encoding: 'utf8' })
        } catch (e) {
            reporter.debug('Cache.read failed', e)
            return null
        }
    }

    async makeTmp() {
        await fs.ensureDir(this.tmpDir)
        return path.join(this.tmpDir, `/${Math.ceil(Math.random() * 100000)}`)
    }

    async get(url, name, { force, raw, requestOpts } = {}) {
        const outLoc = this.getCacheLocation(name)
        const tmpLoc = await this.makeTmp()
        const reqOpts = { ...this.requestOpts, ...requestOpts }

        if (force) {
            reporter.debug(`[CACHE] Forcing re-fetch of ${name}, ${outLoc}`)
            await fs.remove(outLoc)
        } else if (await this.exists(outLoc)) {
            reporter.debug(`[CACHE] Cache hit at ${outLoc}`)
            return outLoc
        }

        try {
            await fetchAndExtract({
                url,
                name,
                tmpLoc,
                outLoc,
                raw,
                requestOpts: reqOpts,
            })
        } catch (e) {
            reporter.debug(`[CACHE] fetchAndExtract error`)
            reporter.dumpErr(e)
            throw `Failed to fetch ${name}`
        }
        return outLoc
    }

    async purge(pathname) {
        const loc = this.getCacheLocation(pathname)
        reporter.debug(`[CACHE] Purging '${loc}' (${pathname})`)
        return await fs.remove(loc)
    }

    async stat(pathname = '/') {
        try {
            const location = this.getCacheLocation(pathname)
            const rootStats = await fs.stat(location)
            if (rootStats.isDirectory()) {
                let files = await fs.readdir(location)
                files = files
                    .filter((f) => f[0] !== '.')
                    .sort((a, b) => a.toLowerCase() > b.toLowerCase())
                const stats = await Promise.all(
                    files.map(async (f) => fs.stat(path.join(location, f)))
                )
                const mappedStats = stats.reduce(
                    (out, fileStats, i) => ({
                        ...out,
                        [files[i]]: fileStats,
                    }),
                    {}
                )
                return {
                    name: path.basename(location),
                    stats: rootStats,
                    children: mappedStats,
                }
            } else {
                return {
                    name: path.basename(location),
                    stats: rootStats,
                }
            }
        } catch (e) {
            console.error(e)
        }
    }
}

export default Cache
