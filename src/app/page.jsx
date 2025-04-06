"use client";

import React, { useEffect, useRef, useState } from "react";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";

export default function Home() {
  const googleAPIKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

  const [toggleOverlay, setToggleOverlay] = useState(null);

  return (
    <div className="flex flex-col w-screen h-screen bg-zinc-800">
      <div className="pl-10 pt-6">
        <Title />
      </div>

      <div className="flex flex-wrap justify-center w-full bg-zinc-800">
        <div className="p-10">
          <OverlayToggleButton toggleOverlay={toggleOverlay} />
        </div>
      </div>

      <div className="flex flex-grow w-full">
        <div className="w-4/5 h-full rounded-3xl overflow-hidden">
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

        <div className="w-1/5 h-full bg-zinc-700 rounded-3xl px-8">
          <SliderBar />
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
      className="bg-purple-600 hover:bg-purple-800 text-white font-bold py-2 px-4 rounded"
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
    value: 1,
    label: "1950",
  },
  {
    value: 15,
    label: "1960",
  },
  {
    value: 29,
    label: "1970",
  },
  {
    value: 43,
    label: "1980",
  },
  {
    value: 57,
    label: "1990",
  },
  {
    value: 71,
    label: "2000",
  },
  {
    value: 85,
    label: "2010",
  },
  {
    value: 99,
    label: "2020",
  },
];

function SliderBar() {
  const [sliderValue, setSliderValue] = useState(99);

  const handleSliderChange = (event) => {
    setSliderValue(event.target.value);
  };

  const chosenMark = marks.find((mark) => mark.value === Number(sliderValue));
  const chosenYear = chosenMark.label;

  return (
    <div>
      <h1 className="p-10">Current Year: {chosenYear}</h1>
      <Box sx={{ height: 600 }}>
        <Slider
          orientation="vertical"
          defaultValue={99}
          step={null}
          valueLabelDisplay="off"
          marks={marks}
          color="secondary"
          onChange={handleSliderChange}
          sx={{
            width: 15,
            color: "#7e22ce",
            "& .MuiSlider-markLabel": {
              color: "white",
              fontSize: "1.4rem",
            },
            "& .MuiSlider-thumb": {
              backgroundColor: "#581c87",
            },
          }}
        />
      </Box>
    </div>
  );
}

function Title() {
  return (
    <h1 className="mb-4 text-3xl font-extrabold text-gray-900 dark:text-white md:text-5xl lg:text-6xl">
      <span className="text-transparent bg-clip-text bg-gradient-to-r to-fuchsia-600 from-purple-600">
        Population
      </span>{" "}
      Dot Map
    </h1>
  );
}