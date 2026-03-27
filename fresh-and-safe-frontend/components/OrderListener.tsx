"use client";
import { useEffect } from "react";

export default function OrderListener() {
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/orders");
    const audio = new Audio("/bell.mp3");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "new_order") {
        console.log("🔔 New order received");
        audio.play().catch(() => {});
      }
    };

    // 🔓 Unlock audio on first click
    const unlockAudio = () => {
      audio.play().catch(() => {});
      document.removeEventListener("click", unlockAudio);
    };
    document.addEventListener("click", unlockAudio);

    return () => {
      ws.close();
      document.removeEventListener("click", unlockAudio);
    };
  }, []);

  return null;
}