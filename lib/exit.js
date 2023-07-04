import process from 'process'
import reporter from './reporter.js'

export default (code, msg) => {
    if (msg && code > 0) {
        reporter.print('')
        reporter.error(msg)
    }
    process.exit(code)
}
