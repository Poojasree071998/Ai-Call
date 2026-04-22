import React, { useState, useEffect, useCallback, useRef } from 'react';
import './Dashboard.css';

// Import Modular Components
import QueueTab from '../components/employee/QueueTab';
import HistoryTab from '../components/employee/HistoryTab';
import ProfileTab from '../components/employee/ProfileTab';
import InboundCallPopup from '../components/employee/InboundCallPopup';
import TransferModal from '../components/employee/TransferModal';
import Dialpad from '../components/employee/Dialpad';
import Toast from '../components/common/Toast';
import { io } from 'socket.io-client';
import useExotelDevice from '../services/useExotelDevice';
import useRingtone from '../services/useRingtone';

const EmployeeDashboard = () => {
  const [activeTab, setActiveTab] = useState('queue');
  const [isCalling, setIsCalling] = useState(false);
  const [activeCall, setActiveCall] = useState(null);
  const [notes, setNotes] = useState('');
  const [disposition, setDisposition] = useState('Interested');
  const [filter, setFilter] = useState('All');
  const [incomingCalls, setIncomingCalls] = useState([]);
  const [callHistory, setCallHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [dialNumber, setDialNumber] = useState('');
  const [sentiment, setSentiment] = useState(50);
  const [suggestions, setSuggestions] = useState([]);
  const [deviceStatus, setDeviceStatus] = useState('Exotel Bridging Ready');
  const [showInboundPopup, setShowInboundPopup] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const prevQueueLength = useRef(0);
  const socketRef = useRef(null);
  // Web Audio API ringtone — no external URLs, works after any user click
  const ringtone = useRef(useRingtone());
  // Notification beep for new queue items
  const notifyAudioRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3'));

  // Initialize Exotel Device for Browser Audio
  const { 
    deviceReady, 
    callStatus, 
    makeCall, 
    hangUp, 
    acceptCall, 
    rejectCall, 
    toggleMute, 
    isMuted,
    setCallStatus
  } = useExotelDevice(currentUser?.id);

  // Track whether current call is a real Exotel call or demo mode
  const isExotelCallRef = useRef(false);

  // Sync UI state with Exotel Call Status
  useEffect(() => {
    if (callStatus === 'in-call' || callStatus === 'connecting' || callStatus === 'ringing') {
      isExotelCallRef.current = true;
      setIsCalling(true);
      setDeviceStatus(
        callStatus === 'in-call' ? '🟢 Two-Way Audio Live' : 
        callStatus === 'ringing' ? '📳 Ringing Customer...' : '⏳ Connecting...'
      );
      if (callStatus === 'ringing' && !showInboundPopup && !activeCall) {
        setShowInboundPopup({
          id: 'exotel_' + Date.now(),
          from: 'Incoming Call',
          department: 'Direct Inbound'
        });
      }
    } else if ((callStatus === 'idle' || callStatus === 'ended') && isExotelCallRef.current) {
      isExotelCallRef.current = false;
      setIsCalling(false);
      setActiveCall(null);
      setDeviceStatus('Exotel Browser Ready');
    }
  }, [callStatus]);

  const fetchData = useCallback(async () => {
    try {
      const queueRes = await fetch(`/api/calls/active?department=${filter}`);
      if (queueRes.ok) {
        const data = await queueRes.json();
        if (Array.isArray(data)) {
          setIncomingCalls(data);
          if (data.length > prevQueueLength.current) {
            notifyAudioRef.current.play().catch(() => {});
          }
          prevQueueLength.current = data.length;
        }
      }

      const historyRes = await fetch(`/api/calls/history`);
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        if (Array.isArray(historyData)) {
          const myHistory = historyData.filter(h => h.handledBy === currentUser?.name);
          setCallHistory(myHistory.length > 0 ? myHistory : historyData.slice(0, 10));
        }
      }
    } catch (err) {
      console.error('🚀 Dashboard Sync Error:', err);
    }
  }, [filter, currentUser]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) { window.location.href = '/login'; return; }
    const user = JSON.parse(savedUser);
    setCurrentUser({ ...user, status: user.status || 'Free' });
  }, []);

  // SOCKET.IO REAL-TIME INTEGRATION
  useEffect(() => {
    if (!currentUser?.id) return;

    // Socket.io Real-time Monitoring
    const socket = io('/', {
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('📡 [SOCKET] Dashboard connected to FIC Engine:', socket.id);
      socket.emit('join_department', currentUser.department);
    });

    socket.on('incoming-call', (callData) => {
      console.log('📡 [SOCKET] New call assignment detected:', callData);
      setShowInboundPopup(callData);
      notifyAudioRef.current.play().catch(() => {});
    });

    socket.on('call-live', (data) => {
      console.log('📡 [SOCKET] Call is now LIVE:', data);
      setIsCalling(true);
      setCallStatus('in-call');
      setDeviceStatus(data.status || '🟢 Two-Way Audio Live');
      addToast('🟢 Call Connected!', 'success');
    });

    socket.on('call-status-updated', (data) => {
      console.log('📡 [SOCKET] Call status updated:', data);
      if (data.status === 'Completed' || data.status === 'Missed') {
        setIsCalling(false);
        setCallStatus('idle');
        setActiveCall(null);
        setDeviceStatus('Exotel Browser Ready');
        addToast(`📴 Call ${data.status}`, 'info');
      }
    });

    socket.on('audio_data', (audioBase64) => {
      if (isCalling) {
        // Convert base64 audio to sound and play it in the browser
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0)).buffer;
        audioCtx.decodeAudioData(arrayBuffer, (buffer) => {
          const source = audioCtx.createBufferSource();
          source.buffer = buffer;
          source.connect(audioCtx.destination);
          source.start(0);
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser]);

  // CALL DURATION TIMER
  useEffect(() => {
    if (isCalling) {
      const interval = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);
    } else {
      if (timerInterval) clearInterval(timerInterval);
      setSeconds(0);
    }
    return () => { if (timerInterval) clearInterval(timerInterval); };
  }, [isCalling]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const addToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const simulateCall = () => {
    const hour = new Date().getHours();
    if (hour >= 8 && hour < 20) {
      const number = "+91 " + Math.floor(9000000000 + Math.random() * 1000000000);
      const fakeCall = {
        id: 'sim_' + Date.now(),
        from: number,
        department: filter === 'All' ? 'General' : filter,
        isSimulated: true
      };
      setShowInboundPopup(fakeCall);
      addToast('🚀 Simulation: Incoming call generated', 'demo');
    } else {
      addToast('🌙 Our team is unavailable. AI is handling your call.', 'info');
    }
  };

  const handleAttendFromPopup = (callData) => {
    if (callStatus === 'ringing') {
      acceptCall();
      setActiveCall({ _id: callData.id, from: callData.from, department: callData.department });
    } else {
      handleAttend({ _id: callData.id, from: callData.from, department: callData.department });
    }
    setShowInboundPopup(null);
  };

  const filteredCalls = filter === 'All' 
    ? incomingCalls 
    : incomingCalls.filter(c => c.department && c.department.includes(filter));

  const handleAttend = async (call) => {
    if (!call?._id && !call?.isSimulated) return;
    
    if (call.isSimulated) {
      setActiveCall(call);
      setIsCalling(true);
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch(`/api/calls/attend/${call._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: currentUser?.id }) 
      });
      
      if (res.ok) {
        // For real-time browser audio, we just wait for the device to ring 
        // or we can manually accept if the backend routed it already.
        acceptCall();
        setActiveCall(call);
      }
    } catch (err) {
      console.error('Attend Error:', err);
      addToast('❌ Connection Error: backend unreachable', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualCall = async () => {
    if (!dialNumber) return;
    try {
      setIsLoading(true);
      let finalNumber = dialNumber.trim();
      if (finalNumber.length === 10 && !finalNumber.startsWith('+')) finalNumber = '+91' + finalNumber;
      
      console.log(`🚀 [EXOTEL] Triggering outbound bridge to: ${finalNumber}`);
      
      // Trigger the real browser call via Exotel which automatically calls our backend API
      const data = await makeCall(finalNumber, currentUser?.id);
      
      if (data && data.success) {
        setActiveCall({ _id: data.id, from: finalNumber, status: 'In-Progress' });
        setDialNumber('');
        addToast('📞 Ringing your mobile phone... Please answer to connect to customer!', 'success');
      } else {
        addToast(`❌ Dial Failed: ${data?.error || 'Browser audio failed'}`, 'error');
      }
    } catch (err) {
      console.error('Dial Error:', err);
      addToast(`❌ Dial Error: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const simulateAICoPilot = () => {
    setNotes('🎧 AI Co-Pilot: Analyzing call intent...');
    setSentiment(60);
    setSuggestions([{ id: 1, type: 'info', text: 'Welcome the customer and confirm their account ID.' }]);
    
    setTimeout(() => {
      setNotes(prev => prev + '\n📌 Detected: "SBI Credit Card", "Annual Fee"');
      setSentiment(75);
      setSuggestions(prev => [
        { id: 2, type: 'success', text: 'Offer the new Platinum Rewards upgrade (Annual Fee waived).' },
        ...prev
      ]);
    }, 3000);

    setTimeout(() => {
      setNotes(prev => prev + '\n🤖 Suggestion: Offer the lifetime-free card variant based on customer history.');
      setSentiment(45);
      setSuggestions(prev => [
        { id: 3, type: 'warning', text: 'Customer seems frustrated about fees. Maintain polite tone.' },
        ...prev
      ]);
    }, 6000);

    setTimeout(() => {
      setNotes(prev => prev + '\n✅ Summary: Customer interested in SBI Elite Card. Requested callback.');
      setDisposition('Interested');
      setSentiment(80);
    }, 9000);
  };

  const updateStatus = async (newStatus) => {
    try {
      const res = await fetch('/api/calls/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: currentUser?.id, status: newStatus })
      });
      if (res.ok) setCurrentUser({ ...currentUser, status: newStatus });
    } catch (err) {
      console.error('Status update failed');
    }
  };

  const handleEndCall = () => {
    hangUp();
    isExotelCallRef.current = false;
    ringtone.current.stop();
    setIsCalling(false);
    setActiveCall(null);
    setNotes('');
    setDisposition('Interested');
    setDeviceStatus('Exotel Browser Ready');
    updateStatus('Free');
  };

  const handleFinishCall = async () => {
    if (!activeCall?._id) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/calls/finish/${activeCall._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          notes, 
          disposition,
          employeeId: currentUser?.id 
        })
      });
      
      if (res.ok) {
        addToast('✅ Call details saved successfully!', 'success');
        handleEndCall();
      }
    } catch (err) {
      console.error('Finish Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePerformTransfer = (dept, agent) => {
    addToast(`🚀 Transferring call to ${dept || agent}...`, 'success');
    setShowTransferModal(false);
    // In a real app, this would trigger an Exotel bridge to the new destination
    setTimeout(() => {
      handleEndCall();
      addToast('✅ Call transferred successfully', 'success');
    }, 2000);
  };

  return (
    <div className="dashboard-container">
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast 
            key={toast.id} 
            message={toast.message} 
            type={toast.type} 
            duration={toast.duration} 
            onClose={() => removeToast(toast.id)} 
          />
        ))}
      </div>
      {showInboundPopup && (
        <InboundCallPopup 
          call={showInboundPopup} 
          onAccept={handleAttendFromPopup}
          onReject={() => {
            if (callStatus === 'ringing') rejectCall();
            setShowInboundPopup(null);
          }}
        />
      )}
      <aside className="sidebar glass">
        <div className="sidebar-logo">FIC <span>SC</span></div>
        <nav>
          <button className={activeTab === 'queue' ? 'active' : ''} onClick={() => setActiveTab('queue')}>📥 My Queue</button>
          <button className={activeTab === 'dialer' ? 'active' : ''} onClick={() => setActiveTab('dialer')}>🔢 Dial Pad</button>
          <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>🕒 My History</button>
          <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>👤 Profile</button>
        </nav>
        <div className="sidebar-footer">
          <p>{currentUser?.role || 'Employee'} Mode</p>
          <button className="btn-text" style={{ color: '#00e676', fontSize: '0.8rem', marginBottom: '10px' }} onClick={simulateCall}>🚀 Simulate Call</button>
          <button className="btn-text" style={{ color: '#ff4b2b', fontSize: '0.8rem', marginBottom: '10px' }} onClick={async () => {
            if (window.confirm('Clear all test calls from queue?')) {
              await fetch('/api/calls/purge', { method: 'POST' });
              fetchData();
            }
          }}>🧹 Clean Queue</button>
          <button className="btn-logout" onClick={() => { localStorage.clear(); window.location.href = '/login'; }}>Logout</button>
        </div>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1>Employee Dashboard</h1>
          <div className="user-profile">
            <div className="status-selector" style={{ marginRight: '20px' }}>
              <select value={currentUser?.status || 'Free'} onChange={(e) => updateStatus(e.target.value)}>
                <option value="Free">🟢 Free</option>
                <option value="Busy">🔴 Busy</option>
                <option value="On-Hold">⏸️ On-Hold</option>
                <option value="Offline">⚪ Offline</option>
              </select>
            </div>
            <div className="avatar">{currentUser?.name?.charAt(0) || 'U'}</div>
            <span>{currentUser?.name || 'Loading...'}</span>
          </div>
        </header>

        <section className="dashboard-content">
          {(() => {
            switch(activeTab) {
              case 'queue': 
                return <QueueTab 
                  incomingCalls={incomingCalls} 
                  filteredCalls={filteredCalls} 
                  filter={filter} 
                  setFilter={setFilter} 
                  handleAttend={handleAttend} 
                  isLoading={isLoading} 
                  currentUser={currentUser} 
                  isCalling={isCalling} 
                  activeCall={activeCall} 
                  handleHold={() => addToast('⏸ Call placed on hold', 'info')} 
                  handleTransfer={() => setShowTransferModal(true)} 
                  notes={notes} 
                  setNotes={setNotes} 
                  handleEndCall={handleEndCall} 
                  dialNumber={dialNumber} 
                  setDialNumber={setDialNumber} 
                  handleManualCall={handleManualCall} 
                  disposition={disposition} 
                  setDisposition={setDisposition} 
                  handleFinishCall={handleFinishCall}
                  deviceStatus={deviceStatus}
                  deviceReady={deviceReady}
                  callDuration={formatTime(seconds)}
                  sentiment={sentiment}
                  suggestions={suggestions}
                  setActiveTab={setActiveTab}
                />;
              case 'dialer':
                return (
                  <div className="content-card card glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                    <div style={{ width: '100%', maxWidth: '400px' }}>
                      <h2 style={{ textAlign: 'center', marginBottom: '30px', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Quick Dialer</h2>
                      <Dialpad 
                        dialNumber={dialNumber} 
                        setDialNumber={setDialNumber} 
                        handleManualCall={handleManualCall} 
                        isLoading={isLoading} 
                        isCalling={isCalling}
                        activeCall={activeCall}
                        deviceStatus={deviceStatus}
                        callDuration={formatTime(seconds)}
                        handleEndCall={handleEndCall}
                      />
                    </div>
                  </div>
                );
              case 'history': return <HistoryTab callHistory={callHistory} />;
              case 'profile': return <ProfileTab currentUser={currentUser} />;
              default: return <div>Select a tab</div>;
            }
          })()}
        </section>
        
        <TransferModal 
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          onTransfer={handlePerformTransfer}
          departments={['SBI', 'IT', 'Insurance', 'Job Consulting']}
        />
      </main>
    </div>
  );
};

export default EmployeeDashboard;
