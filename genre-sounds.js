import * as strudel from './assets/vendor/strudel.mjs';
import { midiOf } from './motion.js';

function frequency(value) {
  return value.freq ?? 440 * 2 ** (((midiOf(value.note) ?? 60) - 69) / 12);
}

function voice(at, value, ended, build) {
  const context = strudel.getAudioContext();
  const graph = build(context, frequency(value));
  const amp = context.createGain();
  graph.output.connect(amp);
  const duration = Math.max(0.015, value.duration ?? 0.3);
  const attack = Math.min(value.attack ?? 0.02, duration * 0.45);
  const decay = Math.min(value.decay ?? 0.12, duration - attack);
  const sustain = Math.max(0, Math.min(1, value.sustain ?? 0.45)) * 0.28;
  const release = Math.max(0.01, value.release ?? 0.2);
  const end = at + duration;
  amp.gain.setValueAtTime(0, at);
  amp.gain.linearRampToValueAtTime(0.28, at + attack);
  amp.gain.linearRampToValueAtTime(sustain, at + attack + decay);
  amp.gain.setValueAtTime(sustain, end);
  amp.gain.linearRampToValueAtTime(0, end + release);
  // One source owns cleanup; stopping other sources cannot disconnect its inputs twice.
  graph.sources[0].onended = () => {
    for (const node of [...graph.nodes, amp]) node.disconnect();
    ended();
  };
  for (const source of graph.sources) {
    source.start(at);
    source.stop(end + release + 0.01);
  }
  return { node: amp, nodes: { source: graph.sources }, stop: when => graph.sources.forEach(source => source.stop(when)) };
}

export function saturationCurve(drive = 3) {
  const curve = new Float32Array(2049);
  const amount = Math.max(0.2, Math.min(8, drive));
  for (let i = 0; i < curve.length; i++) curve[i] = Math.tanh(amount * (i * 2 / (curve.length - 1) - 1)) / Math.tanh(amount);
  return curve;
}

export function registerGenreSounds() {
  strudel.registerSound('haze', (at, value, ended) => voice(at, value, ended, (context, hz) => {
    const mix = context.createGain();
    const sources = [];
    const nodes = [mix];
    const spread = Math.max(0, Math.min(1, value.spread ?? 0.2)) * 24;
    for (const [index, cents] of [-spread, 0, spread].entries()) {
      const oscillator = context.createOscillator();
      oscillator.type = index === 1 ? 'triangle' : 'sawtooth';
      oscillator.frequency.value = hz;
      oscillator.detune.value = cents;
      const level = context.createGain();
      level.gain.value = index === 1 ? value.calm ? 0.96 : 0.9 : value.calm ? 0.02 : 0.05;
      const pan = context.createStereoPanner();
      pan.pan.value = (index - 1) * 0.55;
      oscillator.connect(level).connect(pan).connect(mix);
      sources.push(oscillator);
      nodes.push(oscillator, level, pan);
    }
    if ((value.vib ?? 0) > 0) {
      const lfo = context.createOscillator();
      lfo.frequency.value = value.vib;
      const depth = context.createGain();
      depth.gain.value = (value.vibmod ?? 0.05) * 100;
      lfo.connect(depth);
      for (const oscillator of sources) depth.connect(oscillator.detune);
      sources.push(lfo);
      nodes.push(lfo, depth);
    }
    return {output:mix,sources,nodes};
  }), {type:'synth'});

  strudel.registerSound('grit', (at, value, ended) => voice(at, value, ended, (context, hz) => {
    const saw = context.createOscillator();
    saw.type = 'sawtooth';
    saw.frequency.value = hz;
    const sub = context.createOscillator();
    sub.frequency.value = hz / 2;
    const subLevel = context.createGain();
    subLevel.gain.value = 0.3;
    const mix = context.createGain();
    mix.gain.value = 0.65;
    saw.connect(mix);
    sub.connect(subLevel).connect(mix);
    const shaper = context.createWaveShaper();
    shaper.curve = saturationCurve(value.drive ?? 4);
    shaper.oversample = '2x';
    mix.connect(shaper);
    return {output:shaper,sources:[saw,sub],nodes:[saw,sub,subLevel,mix,shaper]};
  }), {type:'synth'});
}
