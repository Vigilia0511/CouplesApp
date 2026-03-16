// lib/api.ts
// API client for communicating with the backend

import axios, { AxiosInstance } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true, // Send cookies with requests
    });

    // Add authorization token if available
    this.axiosInstance.interceptors.request.use((config) => {
      const token = localStorage.getItem("authToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Video Call APIs
  async initiateCall(receiverId: number) {
    return this.axiosInstance.post("/api/videocall/initiatecall", {
      receiverId,
    });
  }

  async acceptCall(videoCallId: number) {
    return this.axiosInstance.post("/api/videocall/acceptcall", videoCallId);
  }

  async rejectCall(videoCallId: number) {
    return this.axiosInstance.post("/api/videocall/rejectcall", videoCallId);
  }

  async endCall(videoCallId: number) {
    return this.axiosInstance.post("/api/videocall/endcall", videoCallId);
  }

  async getCallStatus(videoCallId: number) {
    return this.axiosInstance.get("/api/videocall/callstatus", {
      params: { videoCallId },
    });
  }

  async getPendingCalls() {
    return this.axiosInstance.get("/api/videocall/pendingcalls");
  }

  async getRecentCalls() {
    return this.axiosInstance.get("/api/videocall/recentcalls");
  }

  // Auth APIs
  async login(email: string, password: string) {
    return this.axiosInstance.post("/api/account/login", { email, password });
  }

  async logout() {
    return this.axiosInstance.post("/api/account/logout");
  }

  async getCurrentUser() {
    return this.axiosInstance.get("/api/account/current");
  }
}

export const apiClient = new ApiClient();
