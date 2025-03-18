"use client";

import React, { useEffect, useRef, useState } from "react";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";

export default function Home() {
  const googleAPIKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

  const [toggleOverlay, setToggleOverlay] = useState(null);

  return (
    <div className="h-screen w-screen bg-white">
      <div className="flex flex-row justify-center items-center">
        <OverlayToggleButton toggleOverlay={toggleOverlay} />
      </div>

      <APIProvider apiKey={googleAPIKey}>
        <Map
          defaultZoom={12}
          defaultCenter={{ lat: 38.2469, lng: -85.7664 }}
          onCameraChanged={(ev) =>
            console.log(
              "Camera changed:",
              ev.detail.center,
              "Zoom:",
              ev.detail.zoom
            )
          }
        />
        <OverlayMap setToggleOverlay={setToggleOverlay} />
      </APIProvider>
    </div>
  );
}

function OverlayMap({ setToggleOverlay }) {
  const map = useMap();
  const overlayImgRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    const imageBounds = {
      north: 38.28507,
      south: 38.21274,
      west: -85.848,
      east: -85.67,
    };

    overlayImgRef.current = new google.maps.GroundOverlay(
      "/images/louisville1865.jpg",
      imageBounds
    );

    overlayImgRef.current.setMap(map);

    setToggleOverlay(() => () => {
      if (overlayImgRef.current) {
        const currentMap = overlayImgRef.current.getMap();
        overlayImgRef.current.setMap(currentMap ? null : map);
      }
    });
  }, [map, setToggleOverlay]);

  return null;
}

function OverlayToggleButton({ toggleOverlay }) {
  return (
    <button
      className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
      onClick={() => {
        toggleOverlay();
      }}
    >
      Toggle Overlay
    </button>
  );
}