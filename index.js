// Under-the-hood utilities for building CLI modules
import groupGlobalOptions from './lib/groupGlobalOptions.js'
import makeEntryPoint from './lib/makeEntryPoint.js'
import namespace from './lib/namespace.js'
import notifyOfUpdates from './lib/notifyOfUpdates.js'
import tryCatchAsync from './lib/tryCatchAsync.js'
import configDefaults from './lib/configDefaults.js'
import findProjectRoot from './lib/findProjectRoot.js'
import createModuleLoader from './lib/createModuleLoader.js'

// The Cache constructor
import Cache from './lib/cache/index.js'

// Utility functions for interacting with the cli user or spawning sidecar processes
import exec from './lib/exec.js'
import reporter from './lib/reporter.js'
import exit from './lib/exit.js'
import prompt from './lib/prompt.js'
import prettyPrint from './lib/prettyPrint.js'

// Access to wrapped libraries
import chalk from 'chalk'
import inquirer from 'inquirer'

import installTemplate from './lib/installTemplate.js'
import walkDir from './lib/walkDir.js'

export default {
    groupGlobalOptions,
    makeEntryPoint,
    namespace,
    notifyOfUpdates,
    tryCatchAsync,
    configDefaults,
    findProjectRoot,
    createModuleLoader,
    Cache,
    exec,
    reporter,
    exit,
    prompt,
    prettyPrint,
    chalk,
    inquirer,
    installTemplate,
    walkDir
}
