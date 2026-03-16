// app/videocall/page.tsx
// Video call page
"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import VideoCallComponent from "@/components/VideoCallComponent";
export default function VideoCallPage() {
    const router = useRouter();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        // TODO: Replace with actual auth check
        // This should verify JWT token and fetch user data from backend
        // For now, use test data from localStorage or redirect to login
        const userDataStr = localStorage.getItem("userData");
        if (!userDataStr) {
            // Redirect to login if no user data
            router.push("/login");
            return;
        }
        try {
            const userData = JSON.parse(userDataStr);
            setUserData(userData);
        }
        catch (err) {
            setError("Invalid user data");
            router.push("/login");
        }
        finally {
            setLoading(false);
        }
    }, [router]);
    if (loading) {
        return (<div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "100vh",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                fontSize: "18px",
            }}>
        Loading...
      </div>);
    }
    if (error || !userData) {
        return (<div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "100vh",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
            }}>
        <div style={{ textAlign: "center" }}>
          <h1>Error</h1>
          <p>{error || "No user data found"}</p>
          <button onClick={() => router.push("/login")} style={{
                marginTop: "20px",
                padding: "10px 20px",
                background: "white",
                color: "#667eea",
                border: "none",
                borderRadius: "25px",
                cursor: "pointer",
                fontWeight: "bold",
            }}>
            Go to Login
          </button>
        </div>
      </div>);
    }
    return (<VideoCallComponent currentUserId={userData.userId} partnerId={userData.partnerId} coupleId={userData.coupleId} partnerName={userData.partnerName}/>);
}
