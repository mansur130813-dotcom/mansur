import { useRef, useState } from 'react';

export type SoundCue = 'move' | 'interact' | 'paper' | 'camera' | 'blackout' | 'ending' | 'voiceAaa' | 'voiceCheck';

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
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(gainValue, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}

function speak(text: string) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
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
    if (!AudioCtor) throw new Error('Web Audio API is not supported in this browser.');
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
    if (cue === 'voiceAaa') speak('aaa');
    if (cue === 'voiceCheck') speak('ok, let us check it');
  }

  return { enabled, start, stop, play };
}
