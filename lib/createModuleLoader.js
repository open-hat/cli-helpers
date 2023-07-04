import { createRequire } from 'module'
import path from 'path'
import findProjectRoot from './findProjectRoot.js'
import reporter from './reporter.js'

/**
 * @arg {string} moduleName - The name of the module to load.
 * @arg {boolean} yargs - yargs object
 * @return {Object} module - Returns the required module
 */
export default ({ parentModule, preferLocal = true }) => {
    // create a require fn that is bound to the parent module's node_modules
    const parentRequire = createRequire(parentModule)

    // create a require fn bound to the cwd project's node_modules
    const root = findProjectRoot({ markers: ['package.json'] })
    const rootRequire = createRequire(
        root ? path.resolve(root, 'package.json') : '/'
    )

    if (!preferLocal) {
        reporter.warn('Project-local module resolution for tools is disabled.')
    }

    return (moduleName) => {
        if (!preferLocal) {
            return parentRequire(moduleName)
        }

        let required

        try {
            required = rootRequire(moduleName)
            reporter.debug(`Loaded ${moduleName} from: ${root}`)
        } catch (err) {
            required = parentRequire(moduleName)
            reporter.debug(`Loaded ${moduleName} from: ${parentModule}`)
        }

        return required
    }
}
