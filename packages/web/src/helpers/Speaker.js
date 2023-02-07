import {
  clipper,
  isNullOrUndefined,
  isString,
  randomElement,
  randomFloatMaker,
} from '@jump/util'

import isSupported from './isSupported'

const volumeRange = { min: 0, max: 1 }
const clipVolume = clipper(volumeRange)
const randomVolume = randomFloatMaker(volumeRange)

const clipRange = { min: 0.1, max: 10 }
const clipRate = clipper(clipRange)
const randomRate = randomFloatMaker(clipRange)

const pitchRange = { min: 0, max: 2 }
const clipPitch = clipper(pitchRange)
const randomPitch = randomFloatMaker(pitchRange)

export class Speaker {
  constructor(args = {}) {
    const { defaults } = this
    this.voice = defaults.voice
    this.rate = defaults.rate
    this.pitch = defaults.pitch
    this.volume = defaults.volume
    this.lang = defaults.lang

    this._setAttrs(args)
  }

  static isSupported() {
    return isSupported(['speechSynthesis', 'SpeechSynthesisUtterance'])
  }

  static async create(args = {}) {
    if (!this.isSupported()) {
      throw new Error('Speech synthesis is not supported')
    }

    if (!this._synthVoices) {
      this._synthVoices = await this._loadSynthVoices()
    }

    return new this(args)
  }

  static _loadSynthVoices() {
    const { speechSynthesis } = window
    return new Promise((resolve) => {
      const voices = speechSynthesis.getVoices()
      if (voices.length) {
        resolve(voices)
      } else {
        speechSynthesis.addEventListener('voiceschanged', () => {
          resolve(speechSynthesis.getVoices())
        })
      }
    })
  }

  get defaults() {
    return {
      rate: 1,
      pitch: 1,
      volume: 0.5,
      voice: 'Alex',
      lang: 'en-us'
    }
  }

  set voice(voice) {
    if (isString(voice)) {
      this._voice = voice
    } else if (voice?.name) {
      this._voice = voice.name
    } else {
      throw new Error(`Invalid voice: ${voice}`)
    }
  }

  get voice() {
    return this._voice
  }

  get synthVoice() {
    const voice = this.synthVoices.find((v) => v.name === this.voice)
    if (!voice) {
      throw new Error(`No speech synthesis voice found for name: ${this.voice}`)
    }
    return voice
  }

  get synthVoices() {
    return this.constructor._synthVoices
  }

  get rate() {
    return this._rate
  }

  set rate(rate) {
    this._rate = clipRate(rate)
  }

  get pitch() {
    return this._pitch
  }

  set pitch(pitch) {
    this._pitch = clipPitch(pitch)
  }

  get volume() {
    return this._volume
  }

  set volume(volume) {
    this._volume = clipVolume(volume)
  }

  get lang() {
    return this._lang
  }

  set lang(lang) {
    // TODO: validate
    this._lang = lang
  }

  // Purposefully not randomizing volume to avoid deafening the user
  randomize() {
    this.randomizeVoice()
    this.randomizeRate()
    this.randomizePitch()
  }

  randomizeRateAndPitch() {
    this.randomizeRate()
    this.randomizePitch()
  }

  randomizeVoice() {
    this.voice = randomElement(this.constructor._synthVoices)
  }

  randomizeRate() {
    this._rate = randomRate()
  }

  randomizePitch() {
    this._pitch = randomPitch()
  }

  randomizeVolume() {
    this._volume = randomVolume()
  }

  async speak ({ text, ...args }) {
    this._setAttrs(args)
    console.log(`Speaking with voice ${this.voice} at ${this.rate}x speed and ${this.pitch} pitch`)
    const utterance = new window.SpeechSynthesisUtterance(text)
    utterance.voice = this.synthVoice
    utterance.rate = this.rate
    utterance.pitch = this.pitch
    utterance.volume = this.volume
    utterance.lang = this.lang

    window.speechSynthesis.speak(utterance)
  }

  _setAttrs(args) {
    const attrs = ['voice', 'rate', 'pitch', 'volume', 'lang']
    for (const attr of attrs) {
      const value = args[attr]
      if (!isNullOrUndefined(value)) {
        this[attr] = value
      }
    }
  }
}

export default Speaker