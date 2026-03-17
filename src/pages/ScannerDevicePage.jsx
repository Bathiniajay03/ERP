import React from "react";
import MobileScanner from "../components/MobileScanner";

export default function ScannerDevicePage() {
  return (
    <div className="scanner-device-page" style={{ minHeight: "100vh", background: "#f3f6ff" }}>
      <MobileScanner />
    </div>
  );
}
