// components/VideoCallComponent.tsx
// Main video call UI component

"use client";

import React, { useEffect, useRef, useState } from "react";
import { apiClient } from "@/lib/api";
import {
  initializeSignalR,
  disconnectSignalR,
  getSignalRConnection,
  sendOffer,
  sendAnswer,
  sendIceCandidate,
  endCall,
  onReceiveOffer,
  onReceiveAnswer,
  onReceiveIceCandidate,
  onCallEnded,
  onCallRejected,
} from "@/lib/signalr";
import IncomingCallModal from "./IncomingCallModal";
import styles from "./VideoCallComponent.module.css";

interface VideoCallProps {
  currentUserId: number;
  partnerId: number;
  coupleId: number;
  partnerName: string;
}

const ICE_SERVERS = [
  { urls: ["stun:stun.l.google.com:19302"] },
  { urls: ["stun:stun1.l.google.com:19302"] },
];

export default function VideoCallComponent({
  currentUserId,
  partnerId,
  coupleId,
  partnerName,
}: VideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [videoCallId, setVideoCallId] = useState<number | null>(null);
  const [callStatus, setCallStatus] = useState("Ready");
  const [callDuration, setCallDuration] = useState("00:00");
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [incomingCall, setIncomingCall] = useState<{
    id: number;
    initiatorName: string;
  } | null>(null);
  const [showIncomingModal, setShowIncomingModal] = useState(false);

  const callDurationRef = useRef<NodeJS.Timeout | null>(null);
  const callStartRef = useRef<number | null>(null);

  // Initialize local video stream
  useEffect(() => {
    const initializeVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing media devices:", error);
        alert("Unable to access camera/microphone");
      }
    };

    initializeVideo();

    return () => {
      localStream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // Initialize SignalR
  useEffect(() => {
    const initSignalR = async () => {
      try {
        await initializeSignalR(currentUserId, coupleId);

        // Set up SignalR event handlers
        onReceiveOffer((receiverId, offer) => {
          handleReceiveOffer(offer);
        });

        onReceiveAnswer((receiverId, answer) => {
          handleReceiveAnswer(answer);
        });

        onReceiveIceCandidate((receiverId, candidate) => {
          handleReceiveIceCandidate(candidate);
        });

        onCallEnded(() => {
          endCallLocally();
        });

        onCallRejected(() => {
          endCallLocally();
          setCallStatus("Call rejected");
        });

        // Start polling for incoming calls
        checkForIncomingCalls();
      } catch (error) {
        console.error("SignalR initialization failed:", error);
      }
    };

    initSignalR();

    return () => {
      disconnectSignalR();
    };
  }, [currentUserId, coupleId]);

  const createPeerConnection = async () => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && videoCallId) {
        sendIceCandidate(partnerId, coupleId, JSON.stringify(event.candidate));
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc.connectionState);
      if (pc.connectionState === "connected") {
        setCallStatus("Connected");
        startCallDurationTimer();
      }
    };

    setPeerConnection(pc);
    return pc;
  };

  const initiateCall = async () => {
    try {
      setCallStatus("Calling...");
      const response = await apiClient.initiateCall(partnerId);

      if (response.data.success) {
        setVideoCallId(response.data.videoCallId);
        setIsCallActive(true);

        const pc = await createPeerConnection();

        // Create and send offer
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });

        await pc.setLocalDescription(offer);
        await sendOffer(partnerId, coupleId, JSON.stringify(offer));

        // Wait for acceptance
        await waitForCallAcceptance(response.data.videoCallId);
      }
    } catch (error) {
      console.error("Error initiating call:", error);
      alert("Failed to initiate call");
    }
  };

  const waitForCallAcceptance = (callId: number) => {
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const response = await apiClient.getCallStatus(callId);
          if (response.data.isActive) {
            clearInterval(interval);
            setCallStatus("Connected - Establishing video...");
            resolve(null);
          }
        } catch (error) {
          console.error("Error checking call status:", error);
        }
      }, 500);

      // Timeout after 60 seconds
      setTimeout(() => {
        clearInterval(interval);
        reject(new Error("Call acceptance timeout"));
      }, 60000);
    });
  };

  const handleReceiveOffer = async (offerJson: string) => {
    try {
      const offer = JSON.parse(offerJson);

      if (!peerConnection) {
        await createPeerConnection();
      }

      if (peerConnection?.signalingState === "stable") {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(offer)
        );

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        await sendAnswer(partnerId, coupleId, JSON.stringify(answer));

        setCallStatus("Connected - Establishing video...");
      }
    } catch (error) {
      console.error("Error handling offer:", error);
    }
  };

  const handleReceiveAnswer = async (answerJson: string) => {
    try {
      const answer = JSON.parse(answerJson);

      if (
        peerConnection?.signalingState === "have-local-offer"
      ) {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
        setCallStatus("Connected - Video stream active");
        startCallDurationTimer();
      }
    } catch (error) {
      console.error("Error handling answer:", error);
    }
  };

  const handleReceiveIceCandidate = async (candidateJson: string) => {
    try {
      const candidate = JSON.parse(candidateJson);
      if (peerConnection?.signalingState !== "closed") {
        await peerConnection?.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error("Error handling ICE candidate:", error);
    }
  };

  const endCallLocally = () => {
    setIsCallActive(false);
    if (callDurationRef.current) {
      clearInterval(callDurationRef.current);
    }
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    setCallDuration("00:00");
    setCallStatus("Call ended");
  };

  const handleEndCall = async () => {
    if (videoCallId) {
      try {
        await apiClient.endCall(videoCallId);
        await endCall(coupleId);
        endCallLocally();
      } catch (error) {
        console.error("Error ending call:", error);
      }
    }
  };

  const checkForIncomingCalls = async () => {
    const interval = setInterval(async () => {
      if (isCallActive) return;

      try {
        const response = await apiClient.getPendingCalls();
        if (response.data.success && response.data.videoCallId) {
          setIncomingCall({
            id: response.data.videoCallId,
            initiatorName: response.data.initiatorName,
          });
          setShowIncomingModal(true);
          setVideoCallId(response.data.videoCallId);
        }
      } catch (error) {
        // Silently fail - not critical
      }
    }, 500);

    return () => clearInterval(interval);
  };

  const toggleMicrophone = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMicEnabled(!isMicEnabled);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const startCallDurationTimer = () => {
    callStartRef.current = Date.now();
    callDurationRef.current = setInterval(() => {
      if (callStartRef.current) {
        const elapsed = Math.floor((Date.now() - callStartRef.current) / 1000);
        const hours = Math.floor(elapsed / 3600);
        const minutes = Math.floor((elapsed % 3600) / 60);
        const seconds = elapsed % 60;

        const formatted =
          (hours > 0 ? hours + ":" : "") +
          String(minutes).padStart(2, "0") +
          ":" +
          String(seconds).padStart(2, "0");

        setCallDuration(formatted);
      }
    }, 1000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.videosContainer}>
          <div className={styles.videoBox}>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={styles.video}
            />
            <div className={styles.videoLabel}>You</div>
            <div className={styles.videoBadge}>
              {isVideoEnabled ? "Camera On" : "Camera Off"}
            </div>
          </div>

          <div className={styles.videoBox}>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={styles.video}
            />
            <div className={styles.videoLabel}>Partner</div>
            <div className={styles.callStatus}>{callStatus}</div>
            <div className={styles.callInfo}>
              <span className={styles.duration}>?? {callDuration}</span>
            </div>
          </div>
        </div>

        <div className={styles.controls}>
          {!isCallActive ? (
            <button
              className={styles.btnCall}
              onClick={initiateCall}
            >
              ?? Call Partner
            </button>
          ) : (
            <>
              <button
                className={`${styles.btn} ${
                  isMicEnabled ? styles.btnActive : styles.btnOff
                }`}
                onClick={toggleMicrophone}
                title="Toggle Microphone"
              >
                ??
              </button>
              <button
                className={`${styles.btn} ${
                  isVideoEnabled ? styles.btnActive : styles.btnOff
                }`}
                onClick={toggleCamera}
                title="Toggle Camera"
              >
                ??
              </button>
              <button
                className={`${styles.btn} ${styles.btnEnd}`}
                onClick={handleEndCall}
                title="End Call"
              >
                ?
              </button>
            </>
          )}
        </div>
      </div>

      {showIncomingModal && incomingCall && (
        <IncomingCallModal
          callId={incomingCall.id}
          initiatorName={incomingCall.initiatorName}
          onAccept={async () => {
            setShowIncomingModal(false);
            try {
              await apiClient.acceptCall(incomingCall.id);
              setIsCallActive(true);
              const pc = await createPeerConnection();
              setVideoCallId(incomingCall.id);
            } catch (error) {
              console.error("Error accepting call:", error);
            }
          }}
          onReject={async () => {
            setShowIncomingModal(false);
            try {
              await apiClient.rejectCall(incomingCall.id);
            } catch (error) {
              console.error("Error rejecting call:", error);
            }
          }}
        />
      )}
    </div>
  );
}
