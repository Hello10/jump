import Minimist from 'minimist'

export class Script {
  async run (args) {
    const error = new Error('Pass --action or implement .run')
    console.error(error.msg, { args })
    return Promise.reject(error)
  }

  async runAction (args) {
    const { action = 'run' } = args

    if (!(action in this)) {
      console.error(`Invalid action: ${action}`)
      return
    }

    await this[action](args)
  }

  parseArgs () {
    const args = Minimist(process.argv.slice(2))
    return args
  }

  expose () {
    return async () => {
      try {
        const args = this.parseArgs()
        await this.runAction(args)
        process.exit(0)
      } catch (error) {
        console.error(error)
        process.exit(1)
      }
    }
  }

  static expose (args = {}) {
    const script = new this(args)
    return script.expose()
  }
}

export default Script
