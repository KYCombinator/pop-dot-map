"use client";

import React, { useEffect, useRef, useState } from "react";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";

export default function Home() {
  const googleAPIKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

  const [toggleOverlay, setToggleOverlay] = useState(null);

  return (
    <div className="w-dvw h-dvh bg-zinc-800">
      <div className="flex flex-wrap justify-center w-full bg-zinc-800">
        <div className="p-10">
          <OverlayToggleButton toggleOverlay={toggleOverlay} />
        </div>
        <div className="p-10">
          <SliderBar />
        </div>
      </div>

      <div className="flex h-full w-full">
        <div className="flex-grow w-full h-full bg-zinc-400 rounded-3xl overflow-hidden">
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
      </div>
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

const marks = [
  {
    value: 0,
    label: "1960",
  },
  {
    value: 17,
    label: "1970",
  },
  {
    value: 34,
    label: "1980",
  },
  {
    value: 51,
    label: "1990",
  },
  {
    value: 68,
    label: "2000",
  },
  {
    value: 84,
    label: "2010",
  },
  {
    value: 100,
    label: "2020",
  },
];

function SliderBar() {
  return (
    <Box sx={{ width: 500 }}>
      <Slider
        aria-label="Custom Marks"
        defaultValue={50}
        getAriaValueText={(value) => "{value}"}
        step={null}
        valueLabelDisplay="off"
        marks={marks}
        color="secondary"
        sx={{
          "& .MuiSlider-markLabel": {
            color: "white",
          },
        }}
      />
    </Box>
  );
}