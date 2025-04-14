"use client";

import React, { useEffect, useRef, useState } from "react";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";

export default function Home() {
  const googleAPIKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

  const [toggleOverlay, setToggleOverlay] = useState(() => () => {});
  const [data, setData] = useState({});

  // makes api call to get image urls and store into "data" variable
  const fetchS3Images = async () => {
    try {
      const res = await fetch("/api/get-urls");
      const datajson = await res.json();
      setData(datajson);
    } catch (err) {
      console.error("Error: ", err);
    }
  };

  // runs upon first loading website, so that it is only run once and fetches all images
  useEffect(() => {
    fetchS3Images();
  }, []);

  return (
    <div className="flex flex-col w-screen h-screen bg-zinc-800">
      <div className="px-10 py-5 bg-zinc-700 w-fit rounded-3xl">
        <Title />
      </div>

      <div className="flex flex-grow w-full">
        <div className="w-4/5 h-full rounded-3xl overflow-hidden">
          <APIProvider apiKey={googleAPIKey}>
            <Map
              defaultZoom={12}
              defaultCenter={{ lat: 38.2469, lng: -85.7664 }}
              // onCameraChanged={(ev) =>
              //   console.log(
              //     "Camera changed:",
              //     ev.detail.center,
              //     "Zoom:",
              //     ev.detail.zoom
              //   )
              // }
            />
            <OverlayMap setToggleOverlay={setToggleOverlay} />
          </APIProvider>
        </div>

        <div className="w-1/5 h-full bg-zinc-700 rounded-3xl p-8">
          <div className="bg-zinc-600 rounded-3xl h-full flex flex-col items-center p-8 justify-evenly">
            <OverlayToggleButton toggleOverlay={toggleOverlay} />
            <SliderBar data={data} />
          </div>
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

    // temp, just so I could make sure url worked
    overlayImgRef.current = new google.maps.GroundOverlay(
      "https://censusawsbucket.s3.us-east-2.amazonaws.com/2020_Census_Year/tile_1092_1576.png",
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
      className="bg-purple-600 hover:bg-purple-800 text-zinc-200 font-bold py-2 px-4 rounded"
      onClick={toggleOverlay}
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

function SliderBar({ data }) {
  const [sliderValue, setSliderValue] = useState(1);

  // called when the slider has changed to a new year
  const updateSliderValue = (event) => {

    const newValue = Number(event.target.value);
    setSliderValue(newValue);

    // finds mark with the associated value and sets the "newYear" to the label of that mark
    const newMark = marks.find((newMark) => newMark.value === newValue);
    const newYear = newMark.label;
    handleYear(newYear);
  };

  // called when a new year is chosen via slider
  const handleYear = (newYearValue) => {

    // accesses the relevant data for the new chosen year
    const yearFolder = `${newYearValue}_Census_Year`;
    const yearData = data[yearFolder];

    // logs array of urls for associated year, just for testing currently
    console.log(`Data for ${newYearValue}: `, yearData);

    // use google.maps.ImageMapType ?
    // use a loading indicator of some sort if slow? show a spinner or something while the
    // images are placed on the map?
  };

  return (
    <div>
      <Box sx={{ height: 600 }}>
        <Slider
          orientation="vertical"
          value={sliderValue}
          step={null}
          valueLabelDisplay="off"
          marks={marks}
          onChange={updateSliderValue}
          sx={{
            width: 15,
            color: "#9333ea",
            "& .MuiSlider-markLabel": {
              color: "#e5e7eb",
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

// change gradient color to match color of dots to tie them in?
function Title() {
  return (
    <h1 className="mb-4 text-3xl font-extrabold text-white dark:text-zinc-200 md:text-5xl lg:text-6xl">
      <span className="text-transparent bg-clip-text bg-gradient-to-r to-violet-500 from-purple-600">
        Population
      </span>{" "}
      Dot Map
    </h1>
  );
}

// take in an x and y coordinate and returns an object with associated NSEW boundaries
function calcBounds(x, y) {
  const zoom = 12;
  const n = Math.pow(2, zoom);

  const North = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * (180 / Math.PI);
  const South = Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / n))) * (180 / Math.PI);
  const East = ((x + 1) / n) * 360 - 180;
  const West = (x / n) * 360 - 180;

  return {
    north: North,
    south: South,
    east: East,
    west: West,
  };
}

// take in a url string and returns an object that contains the x and y values contained in the string
function getCoords(urlString) {
  const re = /tile_(\d+)_(\d+).png/;
  const match = urlString.match(re);

  const xValue = parseInt(match[1]);
  const yValue = parseInt(match[2]);

  return { x: xValue, y: yValue };
}


// things to add?
// add something that gives the user more information about what they are looking at and why
// it was created, etc.
// add option to overlay the old image from 1800s or something - for fun
// customize layout so it still looks good on mobile/smaller screens?