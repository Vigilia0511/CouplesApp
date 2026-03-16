// lib/signalr.ts
// SignalR client for real-time communication

import * as signalR from "@microsoft/signalr";

let connection: signalR.HubConnection | null = null;

const SIGNALR_URL =
  process.env.NEXT_PUBLIC_SIGNALR_URL ||
  "http://localhost:5000/signalr";

export async function initializeSignalR(userId: number, coupleId: number) {
  if (connection?.state === signalR.HubConnectionState.Connected) {
    console.log("SignalR already connected");
    return connection;
  }

  connection = new signalR.HubConnectionBuilder()
    .withUrl(SIGNALR_URL, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
      },
    })
    .withAutomaticReconnect([0, 1000, 3000, 5000, 10000])
    .withHubMethodInvocation(true)
    .configureLogging(signalR.LogLevel.Information)
    .build();

  try {
    await connection.start();
    console.log("SignalR connected");

    // Register user
    await connection.invoke("RegisterUser", userId, coupleId);
    console.log("User registered on SignalR");

    return connection;
  } catch (error) {
    console.error("SignalR connection error:", error);
    throw error;
  }
}

export function getSignalRConnection() {
  return connection;
}

export async function disconnectSignalR() {
  if (connection?.state === signalR.HubConnectionState.Connected) {
    await connection.stop();
    console.log("SignalR disconnected");
  }
}

export function onReceiveOffer(
  callback: (receiverId: number, offer: string) => void
) {
  if (connection) {
    connection.on("receiveOffer", callback);
  }
}

export function onReceiveAnswer(
  callback: (receiverId: number, answer: string) => void
) {
  if (connection) {
    connection.on("receiveAnswer", callback);
  }
}

export function onReceiveIceCandidate(
  callback: (receiverId: number, candidate: string) => void
) {
  if (connection) {
    connection.on("receiveIceCandidate", callback);
  }
}

export function onCallEnded(callback: () => void) {
  if (connection) {
    connection.on("callEnded", callback);
  }
}

export function onCallRejected(callback: () => void) {
  if (connection) {
    connection.on("callRejected", callback);
  }
}

export async function sendOffer(
  receiverId: number,
  coupleId: number,
  offer: string
) {
  if (connection?.state === signalR.HubConnectionState.Connected) {
    await connection.invoke("SendOffer", receiverId, coupleId, offer);
  }
}

export async function sendAnswer(
  receiverId: number,
  coupleId: number,
  answer: string
) {
  if (connection?.state === signalR.HubConnectionState.Connected) {
    await connection.invoke("SendAnswer", receiverId, coupleId, answer);
  }
}

export async function sendIceCandidate(
  receiverId: number,
  coupleId: number,
  candidate: string
) {
  if (connection?.state === signalR.HubConnectionState.Connected) {
    await connection.invoke("SendIceCandidate", receiverId, coupleId, candidate);
  }
}

export async function endCall(coupleId: number) {
  if (connection?.state === signalR.HubConnectionState.Connected) {
    await connection.invoke("EndCall", coupleId);
  }
}

export async function rejectCall(coupleId: number) {
  if (connection?.state === signalR.HubConnectionState.Connected) {
    await connection.invoke("RejectCall", coupleId);
  }
}
