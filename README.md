# cli-helpers
> This is the engine used by plugin modules in the [@openhat/cli](https://github.com/open-hat/cli)
> commandline interface ecosystem.

## A few common utilities:

These helpers assume a node.js CLI context. There are other under-the-hood helpers as well, but they are currently undocumented.

```js
const { reporter, chalk, prompt, exec } = require('@openhat/cli-helpers')

// These are wrappers around stdout and stderr which respect the --verbose and --quiet flags.  Some reporting options also prefix the line with a tag - see lib/reporter.js for all the options
reporter.print('This is a test') // Only printed if --quiet is not passed
reporter.print(chalk.dim('This is a less important test'))
reporter.print(
    chalk.green(
        `Chalk can be used to ${chalk.bold(
            'style text'
        )} which will be printed to the console.`
    )
)
reporter.info('This is something important') // prints to stdout in cyan: This is something important
reporter.error('An error occurred') // prints to stderr in red: [ERROR] An error occured
reporter.warn('Something non-critical went wrong') // prints to stderr in yellow: [WARNING] Something non-critical went wrong
reporter.debug('This will only be printed when --verbose is passed') // prints to stdout if --verbose in dim gray: [DEBUG] This will only be printed when --verbose is passed

// Use prompt to ask the user for input - it is a thin wrapper around `inquirer.prompt`, see https://github.com/SBoudrias/Inquirer.js
const answers = await prompt([
    {
        type: 'list',
        name: 'theme',
        message: 'What do you want to do?',
        choices: [
            'Order a pizza',
            'Make a reservation',
            new inquirer.Separator(),
            'Ask for opening hours',
            {
                name: 'Contact support',
                disabled: 'Unavailable at this time',
            },
            'Talk to the receptionist',
        ],
    },
    {
        type: 'list',
        name: 'size',
        message: 'What size do you need?',
        choices: ['Jumbo', 'Large', 'Standard', 'Medium', 'Small', 'Micro'],
        filter: function (val) {
            return val.toLowerCase()
        },
        when: function (answers) {
            return answers.theme === 'Order a pizza'
        },
    },
])
if (answers.theme === 'Order a pizza') {
    reporter.info(`Ordering a ${answers.size} pizza`)
} else {
    reporter.info(`Ok, let's ${answers.theme}`)
}

// Exec a function in the local shell environment, pass some arguments, set the current working directory, and capture the output as a string

const textContents = await exec({
    cmd: 'cat',
    args: ['./test.txt'],
    cwd: './myDirectory',
    captureOut: true,
})
```

There's a lot more you can do with these utilities - check the source code in the `./libs` folder or the many CLI module examples at [openhat/cli](https://github.com/open-hat/cli) for inspiration.

## How to use the oh Cache

Any CLI command instantiated with `@openhat/cli-helpers` will have an injected `getCache` argument. This is a powerful, simple cache engine for downloading, caching, and accessing files in the global `oh` cache.

The most handy method of the `oh` Cache is `get`, which allows the developer to fetch a remote URL, optionally extract it if the download is a zip file, and store it in the cache. If a copy already exists in the cache, the download is skipped (unless `force: true` is specified):

```js
const { makeEntryPoint } = require('@openhat/cli-helpers')

const handler = async ({ force, getCache }) => {
    const cache = getCache()

    const url =
        'https://spreadsheets.google.com/feeds/list/1Fd-vBoJPjp5wdCyJc7d_LOJPOg5uqdzVa3Eq5-VFR-g/2/public/values?alt=json'

    // This will download a json file listing all countries which implement openhat and store it in the cache.
    // It will *always* be re-downloaded, but if the download fails and a previous cache exists life goes on.
    const dataCachePath = 'openhat-in-action-countries.json'
    try {
        await cache.get(url, dataCachePath, { force: true })
    } catch (e) {
        const exists = await cache.exists(dataCachePath)
        if (!exists) {
            reporter.error('Failed to download new in-action data, and no cached data exists')
            process.exit(1)
        }
        const modifiedTime = (await cache.stat(dataCachePath)).mtime.toISOString()
        reporter.debug(`Failed to update in-action data cache, using previously-cached data from ${modifiedTime}`)
    }

    // And now an example for a zip file
    const dbUrl =
        'https://databases.openhat.tech/demo/2.40.0/openhat-db-demo.sql.gz'

    // This will download the demo database for 2.40.0 and store it in the cache.  The 'raw' option means the .gz file will NOT be unpacked, but rather stored directly on disk.  If a version of this file already exists in the cache, it will not be fetched again, unless the `force` option is passed to this command.
    await cache.get(dbUrl, 'databases/2.40.0.sql.gz', { raw: true, force: force })

    // List all currently-downloaded databases

    const dirStat = (await cache.exists('databases'))
        ? await cache.stat('databases')
        : null
    if (dirStat && dirStat.children) {
        Object.entries(dirStat.children)
            .forEach(([name, stat]) => {
                reporter.print(`${chalk.bold(name)} (${stat.size})`)
            })
    } else {
        reporter.print('No databases found')
    }
}

const command = {
    builder: yargs => {
        yargs.option('force', {
            alias: 'f',
            type: 'boolean',
            description: 'force re-download of all cached items',
            default: false
        }
    },
    handler
})
makeEntryPoint(command)
```

For examples of the cache in action, check out its use in [oh cluster](https://github.com/open-hat/cli/blob/master/packages/cluster/src/common.js#L11-L52) and [oh debug cache](https://github.com/open-hat/cli/blob/master/packages/main/src/commands/debug/cache.js)

## Report an issue

The issue tracker can be found in [OpenHat JIRA](https://jira.openhat.tech)
under the [CLI](https://openhat.atlassian.net/jira/software/projects/CLI/boards/2) project.