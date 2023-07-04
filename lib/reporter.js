import chalk from 'chalk'
import util from 'util'

/*
 * Define the integer codes used for the log levels
 *
 * For a message to be printed, it must be lower or equal to the
 * configured log level.
 *
 * The default log level is 1, and will print quiet and standard level
 * messages.
 *
 * --quiet sets the log level to 0, and will not print standard
 *  messages.
 *
 * --verbose sets the log level to 2, and will print all messages except
 *  debug messages.
 *
 *  --debug is level 3 and will print all messages, which may be
 *  extremely verbose as it is intended for debugging purposes.
 */
const QUIET_CODE = 0
const STANDARD_CODE = 1
const VERBOSE_CODE = 2
const DEBUG_CODE = 3

const config = {
    quiet: false,
    verbose: false,
    debug: false,
}

const middleware =
    ({
        verboseOption = 'verbose',
        quietOption = 'quiet',
        debugOption = 'debug',
    } = {}) =>
    (argv) => {
        if (argv[verboseOption]) {
            config.verbose = true
        }
        if (argv[quietOption]) {
            config.quiet = true
        }
        if (argv[debugOption]) {
            config.debug = true
        }
    }

const loglevel = ({ quiet, verbose, debug }) => {
    switch (true) {
        case quiet:
            return QUIET_CODE
        case verbose:
            return VERBOSE_CODE
        case debug:
            return DEBUG_CODE
        default:
            return STANDARD_CODE
    }
}

const levels = [
    {
        name: 'pipe',
        level: QUIET_CODE,
        msgEnhancer: (msg) => msg,
    },
    {
        name: 'pipeErr',
        level: QUIET_CODE,
        stderr: true,
        msgEnhancer: (msg) => msg,
    },

    {
        name: 'print',
        level: STANDARD_CODE,
        msgEnhancer: (msg) => `${msg}\n`,
    },
    {
        name: 'printErr',
        level: STANDARD_CODE,
        stderr: true,
        msgEnhancer: (msg) => `${msg}\n`,
    },
    {
        name: 'info',
        level: STANDARD_CODE,
        stderr: true,
        msgEnhancer: (msg) => `${chalk.cyan(msg)}\n`,
    },
    {
        name: 'warn',
        level: STANDARD_CODE,
        stderr: true,
        msgEnhancer: (msg) =>
            `${chalk.bold.yellow('[WARNING]')} ${chalk.yellow(msg)}\n`,
    },
    {
        name: 'error',
        level: STANDARD_CODE,
        stderr: true,
        msgEnhancer: (msg) =>
            `${chalk.bold.red('[ERROR]')} ${chalk.red(msg)}\n`,
    },

    {
        name: 'log',
        level: VERBOSE_CODE,
        msgEnhancer: (msg) => `${msg}\n`,
    },
    {
        name: 'dump',
        level: VERBOSE_CODE,
        msgEnhancer: (msg) => chalk.gray(`${msg}`),
    },
    {
        name: 'dumpErr',
        level: VERBOSE_CODE,
        stderr: true,
        msgEnhancer: (msg) => chalk.bgRed(`${msg}`),
    },

    {
        name: 'debug',
        level: DEBUG_CODE,
        stderr: true,
        msgEnhancer: (msg) =>
            `${chalk.bold.gray('[DEBUG]')} ${chalk.gray(msg)}\n`,
    },
    {
        name: 'debugErr',
        level: DEBUG_CODE,
        stderr: true,
        msgEnhancer: (msg) =>
            `${chalk.bold.red.dim('[DEBUG ERROR]')} ${chalk.red.dim(msg)}\n`,
    },
]

const shouldLog = (lvl) => lvl.level <= loglevel(config)

const write = (lvl = {}, msg, args) => {
    if (shouldLog(lvl)) {
        msg = `${msg} ${args.length ? util.format.apply(this, args) : ''}`
        if (lvl.msgEnhancer) {
            msg = lvl.msgEnhancer(msg)
        }
        if (args.length && msg.slice(-1) !== '\n') {
            msg += '\n'
        }
        if (lvl.stderr) {
            process.stderr.write(msg)
        } else {
            process.stdout.write(msg)
        }
    }
}

const reporter = {}

levels.forEach((lvl) => {
    reporter[lvl.name] = (msg, ...args) => write(lvl, msg, args)
})

reporter.middleware = middleware

export default reporter
