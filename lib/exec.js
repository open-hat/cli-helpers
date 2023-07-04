import chalk from 'chalk'
import path from 'path'
import xspawn from 'cross-spawn'
import {findUp} from 'find-up'
import exit from './exit.js'
import reporter from './reporter.js'

const exec = ({ cmd, args, env, pipe, captureOut, captureErr, ...opts }) => {
    reporter.debug(`> ${cmd} ${args.join(' ')}`)

    const childEnv = {
        ...process.env,
        ...env,
    }
    reporter.debug(`env: ${JSON.stringify(env)}`)

    const p = new Promise((resolve, reject) => {
        const child = xspawn(cmd, args, {
            shell: true,
            env: childEnv,
            ...opts,
        })
        let output = captureOut || captureErr ? '' : undefined

        child.stdout.on('data', (data) => {
            if (captureOut) {
                output += data
            }
            if (!pipe) {
                reporter.dump(data)
            } else {
                reporter.pipe(data)
            }
        })

        child.stderr.on('data', (data) => {
            if (captureErr) {
                output += data
            }
            if (!pipe) {
                reporter.pipeErr(data)
            } else {
                reporter.printErr(data)
            }
        })

        child.on('close', (code) => {
            if (code !== 0) {
                reporter.debugErr(
                    `${chalk.bold(
                        cmd
                    )} exited with non-zero exit code (${code}).`
                )
                reject()
            } else {
                reporter.debug(`${chalk.bold(cmd)} completed successfully.`)
                resolve(output)
            }
        })
    })

    return p
}

export const spawn = (cmd, args, opts) => {
    reporter.debug(cmd, args, opts)
    return xspawn.sync(cmd, args, {
        stdio: 'inherit',
        ...opts,
    })
}

export const run = (cmd, { args, opts }, callback) => {
    return handleRun(
        spawn(cmd, args, {
            stdio: 'inherit',
            ...opts,
        }),
        callback
    )
}

export const bin = (cmd, { args, cwd = process.cwd(), opts }, callback) => {
    const nodemodules = findUp.sync('node_modules', {
        cwd,
        type: 'directory',
        allowSymlinks: true,
    })

    const binCmd = path.join(nodemodules, '.bin', cmd)

    return handleRun(
        spawn(binCmd, args, {
            stdio: 'inherit',
            ...opts,
        }),
        callback
    )
}

export const callback = () => {
    let status = 0
    return (result) => {
        if (!result) {
            return status
        }

        if (result.status > status) {
            status = result.status
        }
    }
}

function handleRun(result, callback) {
    if (result.error) {
        throw result.error
    }

    if (callback) {
        return callback(result)
    }

    if (result.status !== 0) {
        exit(result.status === null ? 0 : result.status)
    }
}

export default exec

