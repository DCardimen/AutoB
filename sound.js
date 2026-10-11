// Local Web Audio score and element-specific foley. No downloads or autoplay.
export class Soundscape {
  constructor() {
    this.context = null;
    this.enabled = false;
    this.lastEffect = -10;
    this.beat = -1;
    this.noise = null;
  }
  init() {
    if (this.context) return;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    this.context = new Audio();
    this.master = this.context.createGain();
    this.master.gain.value = 0.22;
    const compressor = this.context.createDynamicsCompressor();
    this.master.connect(compressor);
    compressor.connect(this.context.destination);
    this.noise = this.context.createBuffer(
      1,
      this.context.sampleRate * 0.5,
      this.context.sampleRate,
    );
    const channel = this.noise.getChannelData(0);
    let seed = 17;
    for (let i = 0; i < channel.length; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      channel[i] = (seed / 4294967296) * 2 - 1;
    }
  }
  setEnabled(enabled) {
    this.enabled = enabled;
    if (this.context)
      this.master.gain.setTargetAtTime(
        enabled ? 0.22 : 0,
        this.context.currentTime,
        0.03,
      );
  }
  begin(planet, enabled) {
    this.setEnabled(enabled);
    if (!enabled) return;
    this.init();
    this.context?.resume();
    this.beat = -1;
  }
  tone(
    frequency,
    duration = 0.18,
    type = "sine",
    volume = 0.2,
    delay = 0,
    slide = 1,
  ) {
    if (!this.context || !this.enabled) return;
    const t = this.context.currentTime + delay,
      osc = this.context.createOscillator(),
      gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, t);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(20, frequency * slide),
      t + duration,
    );
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + duration + 0.01);
  }
  hiss(frequency, duration = 0.16, volume = 0.18) {
    if (!this.context || !this.enabled) return;
    const source = this.context.createBufferSource(),
      filter = this.context.createBiquadFilter(),
      gain = this.context.createGain(),
      t = this.context.currentTime;
    source.buffer = this.noise;
    filter.type = "bandpass";
    filter.frequency.value = frequency;
    filter.Q.value = 0.7;
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(t);
    source.stop(t + duration);
  }
  event(event) {
    if (!this.enabled || !this.context) return;
    const time = this.context.currentTime;
    if (
      time - this.lastEffect < 0.075 &&
      !["death", "phase", "capture"].includes(event.type)
    )
      return;
    this.lastEffect = time;
    if (event.type === "death") {
      this.tone(160, 0.4, "triangle", 0.18, 0, 0.3);
      this.hiss(250, 0.3, 0.16);
      return;
    }
    if (event.type === "phase") {
      [65, 98, 130].forEach((f, i) =>
        this.tone(f, 0.8, "triangle", 0.2, i * 0.09, 0.7),
      );
      return;
    }
    if (event.type === "capture") {
      this.action("capture");
      return;
    }
    const heavy = event.type === "crit" || event.type === "skill",
      volume = heavy ? 0.24 : 0.12,
      element = event.element;
    if (element === "ember") {
      this.hiss(700, heavy ? 0.25 : 0.1, volume);
      this.tone(95, 0.12, "triangle", volume, 0, 0.45);
    } else if (element === "tide") {
      this.tone(420, 0.17, "sine", volume, 0, 1.8);
      this.hiss(1700, 0.12, volume * 0.4);
    } else if (element === "storm") {
      this.hiss(3800, 0.08, volume);
      this.tone(820, 0.11, "sawtooth", volume * 0.3, 0, 0.25);
    } else if (element === "grove") {
      this.hiss(350, 0.11, volume);
      this.tone(150, 0.12, "triangle", volume, 0, 0.5);
    } else {
      this.tone(90, 0.22, "sine", volume, 0, 0.45);
      this.tone(260, 0.18, "triangle", volume * 0.4, 0, 0.55);
    }
    if (heavy) this.tone(55, 0.14, "sine", 0.24, 0, 0.6);
  }
  update(time, planet) {
    if (!this.enabled || !this.context) return;
    const beat = Math.floor(time / 0.55);
    if (beat === this.beat) return;
    this.beat = beat;
    const root = [130.81, 110, 98][planet],
      scale = [0, 3, 7, 10, 7, 3, 5, 7],
      note = root * 2 ** (scale[beat % 8] / 12);
    this.tone(note, 0.35, "triangle", 0.035);
    if (beat % 4 === 0) {
      this.tone(root / 2, 0.55, "sine", 0.12);
      this.hiss(90, 0.13, 0.09);
    }
    if (beat % 8 === 0)
      [0, 7, 12].forEach((n) =>
        this.tone(root * 2 ** (n / 12), 1.3, "sine", 0.028),
      );
  }
  action(kind) {
    this.enabled = true;
    this.init();
    if (!this.context) return;
    this.setEnabled(true);
    this.context.resume();
    const notes = {
      start: [196, 293, 392],
      win: [392, 493, 587, 784],
      loss: [220, 196],
      capture: [523, 659, 784, 1046],
      buy: [440, 660],
    };
    (notes[kind] || [330]).forEach((f, i) =>
      this.tone(f, 0.26, "triangle", 0.12, i * 0.1),
    );
  }
}
