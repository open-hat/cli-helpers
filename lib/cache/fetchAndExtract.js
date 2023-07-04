import chalk from 'chalk'
import path from 'path'
import fs from 'fs-extra'
import request from 'request'
import tar from 'tar'
import reporter from '../reporter.js' // TODO: generalize

export default async ({ url, name, tmpLoc, outLoc, raw, requestOpts }) => {
    const p = new Promise((resolve, reject) => {
        const downloadStream = request
            .get(url, requestOpts)
            .on('error', (e) => {
                reporter.dumpErr(e)
                reporter.error(`[CACHE] Failed to fetch ${name} from ${url}`)
                reject()
            })
            .on('warn', reporter.warn)

        fs.ensureDirSync(path.dirname(outLoc))

        if (
            !raw &&
            (url.substr(-7) === '.tar.gz' || url.substr(-4) === '.tar')
        ) {
            reporter.debug(
                `[CACHE] Fetching and extracting ${chalk.bold(name)}`
            )
            reporter.debug(`[CACHE]   from ${chalk.bold(url)}`)
            reporter.debug(`[CACHE]   to ${chalk.bold(outLoc)}`)
            reporter.debug(`[CACHE]   tmpLoc ${chalk.bold(tmpLoc)}`)
            fs.ensureDirSync(tmpLoc)
            downloadStream
                .on('response', (response) => {
                    //Simple check here, assume all 2xx and 3xx codes is ok
                    if (
                        response.statusCode >= 200 &&
                        response.statusCode <= 399
                    ) {
                        downloadStream.resume()
                    } else {
                        reject(
                            `Failed to download ${chalk.bold(
                                url
                            )}, got statusCode ${response.statusCode}`
                        )
                    }
                })
                .pipe(
                    tar.extract({
                        strip: 1,
                        cwd: tmpLoc,
                    })
                )
                .on('end', async () => {
                    try {
                        await fs.move(tmpLoc, outLoc)
                        resolve(outLoc)
                    } catch (e) {
                        reject(
                            `Failed to rename ${chalk.bold(
                                tmpLoc
                            )} to ${chalk.bold(outLoc)}`
                        )
                    }
                })
                .on('error', function (err) {
                    reporter.debug('[CACHE] Extraction error')
                    reporter.dumpErr(err)
                    reject(err)
                })
        } else {
            reporter.debug(`[CACHE] Fetching ${chalk.bold(name)}`)
            reporter.debug(`[CACHE]   from ${chalk.bold(url)}`)
            reporter.debug(`[CACHE]   to ${chalk.bold(outLoc)}`)
            const writeStream = fs.createWriteStream(outLoc)
            downloadStream
                .on('response', (response) => {
                    //Simple check here, assume all 2xx and 3xx codes is ok
                    if (
                        response.statusCode >= 200 &&
                        response.statusCode <= 399
                    ) {
                        downloadStream.resume()
                    } else {
                        reject(
                            `Failed to download ${chalk.bold(
                                url
                            )}, got statusCode ${response.statusCode}`
                        )
                    }
                })
                .pipe(writeStream)
                // WriteStream uses `close`, not `end`
                .on('close', function () {
                    reporter.debug('[CACHE] Fetch complete')
                    resolve(outLoc)
                })
                .on('error', function (err) {
                    reporter.debug('[CACHE] Save file error')
                    reporter.dumpErr(err)
                    reject(err)
                })
        }
    })

    return p
}
