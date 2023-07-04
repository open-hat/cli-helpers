import os from 'os'
import path from 'path'
import reporter from './reporter.js'

const tryLoadConfig = (file) => {
    try {
        const userConfig = file
        reporter.debug(`User configuration loaded from: ${file}`)
        return userConfig
    } catch (e) {
        reporter.debug(`Failed to load user config from: ${file}`)
        return null
    }
}

const userConfig = () => {
    const configDir = path.join(os.homedir(), '.config', 'oh')

    const configPriority = [
        path.join(configDir, 'config.js'),
        path.join(configDir, 'oh.config.js'),
        path.join(configDir, 'config.json'),
        path.join(configDir, 'oh.config.json'),
    ]

    for (const f of configPriority) {
        const config = tryLoadConfig(f)
        if (config) {
            return config
        }
    }

    return {}
}

const defaultConfig = {
    verbose: false,
    cache: path.join(os.homedir(), '.cache/oh'),
}

export default {
    ...defaultConfig,
    ...userConfig(),
}
