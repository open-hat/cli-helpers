/* global arguments */
import chalk from 'chalk'
import reporter from './reporter.js'

export default async (name, promise) => {
    if (arguments.length === 1) {
        promise = name
        name = 'anonymous'
    }
    try {
        return {
            err: null,
            out: await promise,
        }
    } catch (e) {
        reporter.debug(`tryCatchAsync(${chalk.bold(name)}) error: ${e}`)
        return { err: e || 'unknown', out: null }
    }
}
