"use client";

import { useState } from "react";
import ProFormStep, { type ProFormValues } from "@/components/LoginModal/ProFormStep";

export default function ScratchPreviewPage() {
  const [result, setResult] = useState<ProFormValues | null>(null);
  return (
    <div style={{ maxWidth: 640, margin: "40px auto", padding: 16 }}>
      <ProFormStep
        method="email"
        contactValue="preview@example.com"
        countryCode="+91"
        location={{ address: "Kochi, Kerala", lat: 9.9312, lng: 76.2673 }}
        onChangeLocation={() => {}}
        onBack={() => {}}
        onSubmit={async (values) => {
          setResult(values);
          return null;
        }}
      />
      {result && (
        <pre id="submit-result" style={{ marginTop: 20, whiteSpace: "pre-wrap" }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
