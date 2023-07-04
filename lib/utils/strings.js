import chalk from 'chalk'

export default {
    missingCommand: chalk.red(
        'You need at least one command before moving on.'
    ),
    unrecognizedCommand: chalk.red('Command not recognized...'),
}
