import chalk from 'chalk'
import fs from 'fs'
import cacheMiddleware from './cache/middleware.js'
import defaultConfig from './configDefaults.js'
import groupGlobalOptions from './groupGlobalOptions.js'
import reporter from './reporter.js'

process.on('unhandledRejection', (err) => {
    throw err
})

export default ({ builder, handler }) => {
    const yargs = import('yargs') // singleton
    // TODO: Show description

    builder(yargs)

    // Define global options
    yargs
        .help()
        .alias('h', 'help')
        .version()
        .alias('v', 'version')
        .option('verbose', {
            type: 'boolean',
            describe: 'Enable verbose messages',
            global: true,
        })
        .option('debug', {
            type: 'boolean',
            describe: 'Enable debug messages',
            global: true,
        })
        .option('quiet', {
            type: 'boolean',
            describe: 'Enable quiet mode',
            global: true,
        })

    // Configuration loading
    yargs
        .config(defaultConfig) // First, load defaults
        .config('config', (file) => {
            // Next, support configuration from a --config=<file> JSON file
            const r = JSON.parse(fs.readFileSync(file))
            return r
        })
        .env('oh') // oh_* environment variables get mapped to argv
        .pkgConf('oh') // Support oh key in package.json

    groupGlobalOptions(yargs)

    yargs.updateStrings({
        'Did you mean %s?': chalk.blue(`Did you mean ${chalk.bold('%s')}?`),
        'Not enough non-option arguments: got %s, need at least %s': chalk.red(
            'Missing required positional arguments (got %d of %d)'
        ),
    })

    // Support cache engine and reporter functionality
    yargs.middleware([cacheMiddleware({ name: 'oh' }), reporter.middleware()])

    // The actual business
    yargs.parse()

    if (handler) {
        handler(yargs.argv)
    }

    return yargs
}
