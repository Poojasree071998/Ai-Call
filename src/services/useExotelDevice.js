import { useState, useEffect, useCallback, useRef } from 'react';
import { ExotelWebClient } from '@exotel-npm-dev/webrtc-client-sdk';

/**
 * Custom Hook to handle Exotel WebRTC Browser Calling.
 */
const useExotelDevice = (agentId) => {
    const [deviceStatus, setDeviceStatus] = useState('Initializing Exotel...');
    const [callStatus, setCallStatus] = useState('idle'); // idle, ringing, in-call, ended
    const [isMuted, setIsMuted] = useState(false);
    
    const exotelClientRef = useRef(null);
    const activeCallRef = useRef(null);
    const outboundCallPendingRef = useRef(false);

    useEffect(() => {
        if (!agentId) return;

        let client = null;

        const initExotel = async () => {
            try {
                console.log('🏗️ Fetching Exotel Credentials...');
                const res = await fetch('/api/voice/exotel-credentials');
                const creds = await res.json();

                // Request microphone permissions before initializing
                await navigator.mediaDevices.getUserMedia({ audio: true });
                console.log('✅ Mic Permission Granted');

                const sipAccountInfo = {
                    userName: creds.username,
                    authUser: creds.username,
                    domain: creds.host,
                    sipdomain: creds.host,
                    displayName: agentId,
                    secret: creds.password,
                    port: creds.port || 5062,
                    security: "wss",
                    endpoint: "wss"
                };

                client = new ExotelWebClient();
                exotelClientRef.current = client;

                const RegisterEventCallBack = (event, phone, param) => {
                    const status = event.toLowerCase();
                    if (status === 'registered') {
                        setDeviceStatus('🟢 Exotel Browser Ready');
                    } else if (status === 'unregistered' || status === 'terminated') {
                        setDeviceStatus('🔴 Exotel Offline');
                    }
                };

                const CallListenerCallback = (event, phone, param) => {
                    const e = event.toLowerCase();
                    if (e === 'i_new_call') {
                        console.log('📥 Incoming Call via WebRTC');
                        // Exotel WebRTC creates a Call object automatically
                        activeCallRef.current = client.getCall();
                        
                        if (outboundCallPendingRef.current) {
                            console.log('🚀 Auto-answering outbound bridge call...');
                            activeCallRef.current.Answer();
                            setCallStatus('in-call');
                            outboundCallPendingRef.current = false;
                        } else {
                            setCallStatus('ringing');
                        }
                    } else if (e === 'ringing') {
                        setCallStatus('ringing');
                    } else if (e === 'connected') {
                        console.log('🗣️ Call Connected');
                        setCallStatus('in-call');
                    } else if (e === 'terminated') {
                        console.log('🔚 Call Terminated');
                        setCallStatus('ended');
                        activeCallRef.current = null;
                        setTimeout(() => setCallStatus('idle'), 2000);
                    }
                };

                const SessionCallback = () => {};

                const initSuccess = await client.initWebrtc(
                    sipAccountInfo, 
                    RegisterEventCallBack, 
                    CallListenerCallback, 
                    SessionCallback, 
                    true
                );

                if (initSuccess) {
                    client.DoRegister();
                } else {
                    setDeviceStatus('🔴 Initialization Failed');
                }

            } catch (err) {
                console.error('❌ Exotel Init Error:', err);
                setDeviceStatus('🔴 Init Failed / Mic Denied');
            }
        };

        initExotel();

        return () => {
            if (client) {
                client.UnRegister();
            }
        };
    }, [agentId]);

    const makeCall = useCallback(async (phoneNumber, employeeId) => {
        console.log('📞 Triggering Outbound Call API for:', phoneNumber);
        outboundCallPendingRef.current = true;
        setCallStatus('connecting');
        
        try {
            // Trigger the outbound call via the backend. 
            // The backend will call Exotel Connect API which rings this WebRTC client.
            const res = await fetch('/api/calls/trigger-outbound', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerPhone: phoneNumber, employeeId, mode: 'mobile' })
            });

            if (res.ok) {
                const data = await res.json();
                return data;
            } else {
                const errorData = await res.json();
                outboundCallPendingRef.current = false;
                setCallStatus('idle');
                return { success: false, error: errorData.error || 'Unknown Exotel Error' };
            }
        } catch (err) {
            outboundCallPendingRef.current = false;
            setCallStatus('idle');
            return { success: false, error: err.message };
        }
    }, []);

    const hangUp = useCallback(() => {
        if (activeCallRef.current) {
            activeCallRef.current.Hangup();
        } else {
            setCallStatus('idle');
        }
    }, []);

    const acceptCall = useCallback(() => {
        if (activeCallRef.current) {
            activeCallRef.current.Answer();
            setCallStatus('in-call');
        }
    }, []);

    const rejectCall = useCallback(() => {
        if (activeCallRef.current) {
            activeCallRef.current.Hangup();
            setCallStatus('idle');
        }
    }, []);

    const toggleMute = useCallback(() => {
        if (activeCallRef.current) {
            if (isMuted) {
                activeCallRef.current.UnMute();
            } else {
                activeCallRef.current.Mute();
            }
            setIsMuted(!isMuted);
        }
    }, [isMuted]);

    return {
        deviceReady: deviceStatus.includes('Ready'),
        deviceStatus,
        callStatus,
        makeCall,
        hangUp,
        acceptCall,
        rejectCall,
        toggleMute,
        isMuted,
        setCallStatus
    };
};

export default useExotelDevice;
