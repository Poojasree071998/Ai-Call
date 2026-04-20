import { useState, useEffect, useRef, useCallback } from 'react';
import { Device } from '@twilio/voice-sdk';

/**
 * useTwilioDevice
 * ─────────────────────────────────────────────────────────────────────────────
 * React hook that wraps Twilio.Device for browser-based WebRTC calling.
 *
 * Usage:
 *   const { makeCall, hangUp, deviceReady, callStatus, isMuted, toggleMute } = useTwilioDevice(userId);
 *
 * Flow:
 *   1. Fetches a JWT token from /api/voice/token on mount.
 *   2. Initialises Twilio.Device with that token.
 *   3. Requests microphone permission.
 *   4. makeCall(to) → employee hears customer in browser, speaks via mic.
 *   5. hangUp() → cleanly disconnects.
 */
const useTwilioDevice = (userId) => {
  const deviceRef       = useRef(null);
  const connectionRef   = useRef(null);

  const [deviceReady,   setDeviceReady]   = useState(false);
  const [deviceError,   setDeviceError]   = useState(null);
  const [callStatus,    setCallStatus]    = useState('idle');   // idle | connecting | ringing | in-call | ended
  const [isMuted,       setIsMuted]       = useState(false);
  const [isConfigured,  setIsConfigured]  = useState(true);    // false if Twilio keys missing

  // ─── Initialise Device ────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    let device = null;

    const init = async () => {
      try {
        console.log('🔑 [TWILIO] Fetching browser token...');
        const res = await fetch(`/api/voice/token?id=${userId}`);
        const data = await res.json();

        // Graceful degradation — if Twilio keys aren't set up yet
        if (!res.ok || data.configured === false) {
          console.warn('⚠️  [TWILIO] Browser audio not configured. Demo mode active.');
          setIsConfigured(false);
          setCallStatus('unconfigured');
          return;
        }

        console.log(`✅ [TWILIO] Token received for ${data.identity}`);

        // Create the device
        device = new Device(data.token, {
          logLevel: 1,
          codecPreferences: ['opus', 'pcmu'],
          fakeLocalDTMF: false,
          enableRingingState: true,
        });

        deviceRef.current = device;

        // ── Device Events ──────────────────────────────────────────────────
        device.on('registered', () => {
          console.log('📡 [TWILIO] Device registered — browser ready to call!');
          setDeviceReady(true);
          setCallStatus('idle');
          setDeviceError(null);
        });

        device.on('unregistered', () => {
          console.log('📴 [TWILIO] Device unregistered.');
          setDeviceReady(false);
        });

        device.on('error', (err) => {
          console.error('❌ [TWILIO] Device error:', err.message);
          setDeviceError(err.message);
          setCallStatus('error');
        });

        // Incoming call to browser (customer calls in)
        device.on('incoming', (call) => {
          console.log('📞 [TWILIO] Incoming call from:', call.parameters.From);
          connectionRef.current = call;
          setCallStatus('ringing');

          call.on('accept',     () => setCallStatus('in-call'));
          call.on('disconnect', () => { setCallStatus('idle'); connectionRef.current = null; });
          call.on('cancel',     () => { setCallStatus('idle'); connectionRef.current = null; });
        });

        // Register so it can receive calls too
        await device.register();

      } catch (err) {
        console.error('❌ [TWILIO] Init failed:', err.message);
        setDeviceError(err.message);
        setIsConfigured(false);
      }
    };

    init();

    return () => {
      if (device) {
        device.destroy();
        console.log('🔌 [TWILIO] Device destroyed (cleanup).');
      }
    };
  }, [userId]);

  // ─── Make an outbound call ─────────────────────────────────────────────────
  const makeCall = useCallback(async (toNumber) => {
    // Wait up to 6 seconds for the device to become ready
    if (!deviceRef.current) {
      console.warn('⚠️  [TWILIO] Device not initialised — Twilio keys may be missing.');
      return null;
    }

    if (!deviceReady) {
      console.log('⏳ [TWILIO] Device not yet registered — waiting up to 6s...');
      const ready = await new Promise((resolve) => {
        let waited = 0;
        const check = setInterval(() => {
          waited += 200;
          if (deviceRef.current?.state === 'registered') {
            clearInterval(check);
            resolve(true);
          } else if (waited >= 6000) {
            clearInterval(check);
            resolve(false);
          }
        }, 200);
      });
      if (!ready) {
        console.warn('❌ [TWILIO] Device registration timed out.');
        return null;
      }
    }

    try {
      console.log(`📞 [TWILIO] Dialling: ${toNumber}`);
      setCallStatus('connecting');

      const call = await deviceRef.current.connect({
        params: { To: toNumber }
      });

      connectionRef.current = call;

      call.on('ringing',     () => { console.log('🔔 [TWILIO] Ringing...'); setCallStatus('ringing'); });
      call.on('accept',      () => { console.log('✅ [TWILIO] Call accepted — two-way audio live!'); setCallStatus('in-call'); setIsMuted(false); });
      call.on('disconnect',  () => { console.log('📴 [TWILIO] Call ended.'); setCallStatus('ended'); connectionRef.current = null; });
      call.on('cancel',      () => { console.log('❌ [TWILIO] Call cancelled.'); setCallStatus('idle'); connectionRef.current = null; });
      call.on('error',   (e) => { console.error('❌ [TWILIO] Call error:', e.message); setCallStatus('error'); });

      return call;
    } catch (err) {
      console.error('❌ [TWILIO] makeCall failed:', err.message);
      setCallStatus('error');
      return null;
    }
  }, [deviceReady]);

  // ─── Hang up ──────────────────────────────────────────────────────────────
  const hangUp = useCallback(() => {
    if (connectionRef.current) {
      connectionRef.current.disconnect();
      connectionRef.current = null;
    } else if (deviceRef.current) {
      deviceRef.current.disconnectAll();
    }
    setCallStatus('idle');
    setIsMuted(false);
    console.log('📴 [TWILIO] Hung up.');
  }, []);

  // ─── Accept incoming call ─────────────────────────────────────────────────
  const acceptCall = useCallback(() => {
    if (connectionRef.current) {
      connectionRef.current.accept();
      setCallStatus('in-call');
    }
  }, []);

  // ─── Reject incoming call ─────────────────────────────────────────────────
  const rejectCall = useCallback(() => {
    if (connectionRef.current) {
      connectionRef.current.reject();
      connectionRef.current = null;
      setCallStatus('idle');
    }
  }, []);

  // ─── Mute / Unmute ────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    if (connectionRef.current) {
      const next = !isMuted;
      connectionRef.current.mute(next);
      setIsMuted(next);
      console.log(`🔇 [TWILIO] Mic ${next ? 'muted' : 'unmuted'}`);
    }
  }, [isMuted]);

  // ─── Send DTMF digit ──────────────────────────────────────────────────────
  const sendDigit = useCallback((digit) => {
    if (connectionRef.current) {
      connectionRef.current.sendDigits(digit);
    }
  }, []);

  return {
    deviceReady,
    deviceError,
    callStatus,
    isMuted,
    isConfigured,
    makeCall,
    hangUp,
    acceptCall,
    rejectCall,
    toggleMute,
    sendDigit,
  };
};

export default useTwilioDevice;
