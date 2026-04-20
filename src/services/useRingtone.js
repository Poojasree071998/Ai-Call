/**
 * useRingtone
 * Generates a realistic phone ringing sound using the Web Audio API.
 * No external URLs. Works immediately after a user gesture.
 */
const useRingtone = () => {
  let audioCtx = null;
  let ringInterval = null;
  let isPlaying = false;

  const createRingBurst = (ctx) => {
    const duration = 1.5; // ring for 1.5 seconds
    const now = ctx.currentTime;

    // Sine wave oscillator — classic phone ring tone
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Dual-tone ring (like a real phone)
    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.setValueAtTime(440, now + 0.02);
    osc.frequency.setValueAtTime(480, now + 0.04);

    // Fade in and out for naturalness
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.4, now + 0.05);
    gainNode.gain.setValueAtTime(0.4, now + duration - 0.1);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);

    osc.start(now);
    osc.stop(now + duration);
  };

  const play = () => {
    if (isPlaying) return;
    isPlaying = true;

    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();

      // Ring immediately then every 3 seconds (ring 1.5s, pause 1.5s)
      createRingBurst(audioCtx);
      ringInterval = setInterval(() => {
        if (audioCtx) createRingBurst(audioCtx);
      }, 3000);
    } catch (e) {
      console.warn('⚠️ [RINGTONE] Web Audio API not available:', e);
    }
  };

  const stop = () => {
    isPlaying = false;
    if (ringInterval) {
      clearInterval(ringInterval);
      ringInterval = null;
    }
    if (audioCtx) {
      try { audioCtx.close(); } catch (e) {}
      audioCtx = null;
    }
  };

  return { play, stop };
};

export default useRingtone;
