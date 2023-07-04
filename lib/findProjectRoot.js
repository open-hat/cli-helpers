import path from 'path'
import process from 'process'
import {findUp} from 'find-up'

/*
 * cwd		Specifies the current working directory to start the search from
 * markers	Override the default markers that identify the root project directory
 *
 * returns the absolute path to the project root, or undefined if not found.
 */
export default ({
    cwd = process.cwd(),
    markers = ['.git', '.github', 'yarn.lock', 'package-lock.json'],
} = {}) =>
    findUp.sync(
        (directory) => {
            const amiroot = markers.map((i) =>
                findUp.sync.exists(path.join(directory, i))
            )
            return amiroot.includes(true) && directory
        },
        {
            cwd,
            type: 'directory',
        }
    )
