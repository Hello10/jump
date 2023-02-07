import isSupported from '../helpers/isSupported'

const events = ['onStart','onError', 'onEnd', 'onResult']

// TODO: finish implementation
// https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition

export class SpeechRecognizer {
  constructor(args = {}) {
    if (!this.constructor.isSupported()) {
      throw new Error('Speech recognition is not supported')
    }

    const defaults = {
      continuous: false,
      interimResult: false,
      lang: 'en-us',
      maxAlternatives: 1
    }

    this.recognizer = new window.webkitSpeechRecognition()
    for (const key of Object.keys(defaults)) {
      this.recognizer[key] = key in args ? args[key] : defaults[key]
    }

    for (const event of events) {
      this[`_${event}`] = event in args ? args[event] : null
      const levent = event.toLowerCase()
      recognizer[levent] = this[event]
    }
  }

  static isSupported() {
    return isSupported(['webkitSpeechRecognition'])
  }
}

export default SpeechRecognizer