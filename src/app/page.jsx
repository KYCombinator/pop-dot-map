"use client";

import React from "react";
import { APIProvider, Map} from "@vis.gl/react-google-maps";

export default function Home() {
  const googleAPIKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

  return (
    <div className="h-screen w-screen">
      <APIProvider
        apiKey={googleAPIKey}
        onLoad={() => console.log("Maps API has loaded.")}
      >
        <Map
          defaultZoom={12}
          defaultCenter={{ lat: 38.2469, lng: -85.7664 }}
          onCameraChanged={(ev) =>
            console.log("Camera changed:", ev.detail.center, "Zoom:", ev.detail.zoom)
          }
        />
      </APIProvider>
    </div>
  );
}
