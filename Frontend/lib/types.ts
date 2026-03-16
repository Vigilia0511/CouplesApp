// lib/types.ts
// TypeScript type definitions

export enum CallStatus {
  Pending = 0,
  Active = 1,
  Ended = 2,
  Rejected = 3,
  Missed = 4,
}

export interface User {
  userId: number;
  email: string;
  displayName: string;
  coupleId: number;
}

export interface VideoCall {
  videoCallId: number;
  coupleId: number;
  initiatorUserId: number;
  receiverUserId: number;
  status: CallStatus;
  sessionId: string;
  initiatedAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  durationSeconds?: number;
}

export interface Couple {
  coupleId: number;
  user1Id: number;
  user2Id: number;
  createdAt: Date;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
