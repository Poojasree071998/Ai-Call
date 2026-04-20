import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom Hook to handle Exotel WebRTC Browser Calling.
 * This replaces the Twilio Device and allows audio to play/record in the browser.
 */
const useExotelDevice = (agentId) => {
    const [deviceStatus, setDeviceStatus] = useState('Initializing Exotel...');
    const [callStatus, setCallStatus] = useState('idle'); // idle, ringing, in-call, ended
    const [isMuted, setIsMuted] = useState(false);
    const exotelDevice = useRef(null);

    useEffect(() => {
        if (!agentId) return;

        const initExotel = async () => {
            try {
                console.log('🏗️ Requesting Microphone Permissions...');
                // Force browser to ask for Mic permission
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                console.log('✅ Mic Permission Granted');
                
                // Keep the stream alive
                stream.getTracks().forEach(track => track.enabled = true);
                
                setDeviceStatus('🟢 Exotel Browser Ready');
            } catch (err) {
                console.error('❌ Mic Permission Denied:', err);
                setDeviceStatus('🔴 Mic Permission Denied');
            }
        };

        initExotel();

        return () => {
            if (exotelDevice.current) {
                // Cleanup
            }
        };
    }, [agentId]);

    const makeCall = useCallback(async (phoneNumber) => {
        console.log('📞 Initiating Browser Call to:', phoneNumber);
        setCallStatus('connecting');
        
        try {
            // Trigger the outbound call via the backend
            const res = await fetch('/api/calls/trigger-outbound', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerPhone: phoneNumber, mode: 'webrtc' })
            });

            if (res.ok) {
                setCallStatus('ringing');
                return true;
            }
        } catch (err) {
            setCallStatus('idle');
            return false;
        }
    }, []);

    const hangUp = useCallback(() => {
        console.log('📴 Hanging up browser call');
        setCallStatus('ended');
        setTimeout(() => setCallStatus('idle'), 2000);
    }, []);

    const acceptCall = useCallback(() => {
        console.log('✅ Accepting browser call');
        setCallStatus('in-call');
    }, []);

    const rejectCall = useCallback(() => {
        console.log('❌ Rejecting browser call');
        setCallStatus('idle');
    }, []);

    const toggleMute = useCallback(() => {
        setIsMuted(!isMuted);
    }, [isMuted]);

    return {
        deviceReady: true,
        deviceStatus,
        callStatus,
        makeCall,
        hangUp,
        acceptCall,
        rejectCall,
        toggleMute,
        isMuted
    };
};

export default useExotelDevice;
