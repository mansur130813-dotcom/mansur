import { useRef, useState } from 'react';

export type SoundCue =
  | 'move'
  | 'interact'
  | 'paper'
  | 'camera'
  | 'blackout'
  | 'ending'
  | 'scream'
  | 'voiceAaa'
  | 'voiceCheck'
  | 'hintPaper'
  | 'hintLight'
  | 'hintCamera'
  | 'hintSteps'
  | 'hintObject';

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

function makeOscillator(
  context: AudioContext,
  type: OscillatorType,
  frequency: number,
  gainValue: number,
  duration: number,
  delay = 0,
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const startAt = context.currentTime + delay;
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(gainValue, startAt);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration);
}

function makeNoiseBlast(context: AudioContext, duration: number, gainValue: number, delay = 0) {
  const sampleRate = context.sampleRate;
  const buffer = context.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
  const data = buffer.getChannelData(0);
  const startAt = context.currentTime + delay;

  for (let index = 0; index < data.length; index += 1) {
    const fade = 1 - index / data.length;
    data[index] = (Math.random() * 2 - 1) * fade;
  }

  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  filter.type = 'bandpass';
  filter.frequency.value = 2100;
  filter.Q.value = 5.5;
  gain.gain.setValueAtTime(gainValue, startAt);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  source.start(startAt);
  source.stop(startAt + duration);
}

function makeImpact(context: AudioContext) {
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -28;
  compressor.knee.value = 8;
  compressor.ratio.value = 16;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.18;
  compressor.connect(context.destination);

  const distortion = context.createWaveShaper();
  const curve = new Float32Array(256);
  for (let index = 0; index < curve.length; index += 1) {
    const x = (index / 128) - 1;
    curve[index] = Math.tanh(x * 8);
  }
  distortion.curve = curve;
  distortion.oversample = '4x';
  distortion.connect(compressor);

  const hit = context.createOscillator();
  const hitGain = context.createGain();
  hit.type = 'square';
  hit.frequency.setValueAtTime(96, context.currentTime);
  hit.frequency.exponentialRampToValueAtTime(32, context.currentTime + 0.16);
  hitGain.gain.setValueAtTime(0.34, context.currentTime);
  hitGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.24);
  hit.connect(hitGain);
  hitGain.connect(distortion);
  hit.start();
  hit.stop(context.currentTime + 0.25);

  const shriek = context.createOscillator();
  const shriekGain = context.createGain();
  shriek.type = 'sawtooth';
  shriek.frequency.setValueAtTime(1850, context.currentTime);
  shriek.frequency.exponentialRampToValueAtTime(3100, context.currentTime + 0.11);
  shriekGain.gain.setValueAtTime(0.16, context.currentTime);
  shriekGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.34);
  shriek.connect(shriekGain);
  shriekGain.connect(distortion);
  shriek.start(context.currentTime + 0.015);
  shriek.stop(context.currentTime + 0.36);
}

function speak(text: string) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ru-RU';
  utterance.rate = 0.85;
  utterance.pitch = 0.75;
  utterance.volume = 0.8;
  window.speechSynthesis.speak(utterance);
}

export function useGameSound() {
  const contextRef = useRef<AudioContext | null>(null);
  const droneRef = useRef<OscillatorNode | null>(null);
  const droneGainRef = useRef<GainNode | null>(null);
  const [enabled, setEnabled] = useState(false);

  function getContext() {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) throw new Error('Web Audio API не поддерживается в этом браузере.');
    if (!contextRef.current) contextRef.current = new AudioCtor();
    return contextRef.current;
  }

  function start() {
    const context = getContext();
    if (context.state === 'suspended') void context.resume();
    if (!droneRef.current) {
      const drone = context.createOscillator();
      const gain = context.createGain();
      drone.type = 'sawtooth';
      drone.frequency.value = 43;
      gain.gain.value = 0.018;
      drone.connect(gain);
      gain.connect(context.destination);
      drone.start();
      droneRef.current = drone;
      droneGainRef.current = gain;
    }
    setEnabled(true);
  }

  function stop() {
    droneGainRef.current?.gain.exponentialRampToValueAtTime(0.001, getContext().currentTime + 0.2);
    setEnabled(false);
  }

  function play(cue: SoundCue) {
    if (!enabled) return;
    const context = getContext();
    if (context.state === 'suspended') void context.resume();

    if (cue === 'move') makeOscillator(context, 'sine', 92, 0.025, 0.08);
    if (cue === 'interact') makeOscillator(context, 'triangle', 240, 0.03, 0.12);
    if (cue === 'paper') makeOscillator(context, 'sawtooth', 390, 0.025, 0.18);
    if (cue === 'camera') makeOscillator(context, 'square', 66, 0.035, 0.28);
    if (cue === 'blackout') makeOscillator(context, 'sawtooth', 31, 0.06, 0.5);
    if (cue === 'ending') makeOscillator(context, 'sine', 28, 0.08, 0.9);
    if (cue === 'hintPaper') {
      makeNoiseBlast(context, 0.14, 0.035);
      makeNoiseBlast(context, 0.1, 0.025, 0.16);
    }
    if (cue === 'hintLight') {
      makeOscillator(context, 'triangle', 540, 0.028, 0.09);
      makeOscillator(context, 'triangle', 760, 0.022, 0.08, 0.1);
    }
    if (cue === 'hintCamera') {
      makeOscillator(context, 'square', 82, 0.03, 0.12);
      makeNoiseBlast(context, 0.18, 0.028, 0.08);
    }
    if (cue === 'hintSteps') {
      makeOscillator(context, 'sine', 72, 0.035, 0.07);
      makeOscillator(context, 'sine', 58, 0.03, 0.08, 0.22);
    }
    if (cue === 'hintObject') makeOscillator(context, 'triangle', 260, 0.026, 0.18);
    if (cue === 'scream') {
      makeImpact(context);
      makeNoiseBlast(context, 0.34, 0.52);
      makeOscillator(context, 'sawtooth', 1780, 0.24, 0.28);
      makeOscillator(context, 'square', 42, 0.38, 0.72);
      makeNoiseBlast(context, 0.52, 0.22, 0.32);
      makeNoiseBlast(context, 0.22, 0.18, 0.78);
      makeOscillator(context, 'triangle', 190, 0.14, 0.95, 0.28);
      makeOscillator(context, 'sawtooth', 760, 0.08, 0.42, 0.62);
    }
    if (cue === 'voiceAaa') speak('а-а-а');
    if (cue === 'voiceCheck') speak('хорошо, проверим');
  }

  return { enabled, start, stop, play };
}
