"use client";

import React, { useEffect, useRef, useState } from "react";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";

export default function Home() {
  const googleAPIKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

  const [data, setData] = useState({});
  // to make sure the map doesn't load before the data is pulled from S3
  const [dataLoaded, setDataLoaded] = useState(false);
  // starts slider at year 2020
  const [sliderValue, setSliderValue] = useState(99);

  // get image urls for all years and store into data
  const getS3Images = async () => {
    try {
      const res = await fetch("/api/get-urls");
      const datajson = await res.json();
      setData(datajson);
      setDataLoaded(true);
    } catch (err) {
      console.error("Something went wrong fetching images from S3!: ", err);
    }
  };

  // fetches when first loading site
  useEffect(() => {
    getS3Images();
  }, []);

  // get year based on value from slider
  const getYearLabel = (newValue) => {
    const newMark = marks.find((newMark) => newMark.value === newValue);
    const newYear = newMark.label;
    return newYear;
  };

  // grab that year's image urls
  const newYear = getYearLabel(sliderValue);
  const yearFolderName = `${newYear}_Census_Year`;
  const newYearData = data[yearFolderName];

  return (
    <div className="flex flex-col w-screen h-screen bg-zinc-800">
      <div className="flex justify-center w-screen">
        <div className="px-10 py-5 bg-zinc-700 w-fit rounded-3xl ">
          <Title />
        </div>
      </div>
      

      <div className="flex flex-grow w-full">
        <div className="w-full h-full rounded-3xl overflow-hidden">
          {dataLoaded && (
            <APIProvider apiKey={googleAPIKey}>
              <Map
                defaultZoom={12}
                defaultCenter={{ lat: 38.19185, lng: -85.70211 }}
                streetViewControl={false}
              />
              <MapComponent data={newYearData} newYear={newYear} />
            </APIProvider>
          )}
        </div>

        <div className="w-90 h-full bg-zinc-700 rounded-3xl p-8">
          <div className="bg-zinc-600 rounded-3xl h-full flex flex-col items-center p-8 justify-evenly">
            <SliderBar
              sliderValue={sliderValue}
              setSliderValue={setSliderValue}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MapComponent({ data, newYear }) {
  const map = useMap();
  const overlays = useRef([]);
  // const urls = data["2020_Census_Year"];

  // console.log(data);
  // console.log(newYear, typeof newYear);

  useEffect(() => {
    if (!map) return;

    // clear old year's overlays
    overlays.current.forEach((overlay) => overlay.setMap(null));
    overlays.current = [];

    // overlay each image/tile
    data.forEach((tile) => {
      // console.log(tile.url);
      const tileURL = tile.url;

      const xyVals = getCoords(tileURL);
      // console.log(xyVals);

      const bounds = calcBounds(xyVals.x, xyVals.y);
      // console.log(bounds);

      const overlay = new google.maps.GroundOverlay(tileURL, bounds);
      overlay.setMap(map);
      overlays.current.push(overlay);
    });


  }, [map, data, newYear]);

  return null;
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

function SliderBar({ sliderValue, setSliderValue }) {
  // called when the slider has changed to a new year
  const updateSliderValue = (event) => {
    const newValue = Number(event.target.value);
    setSliderValue(newValue);
  };

  return (
    <div>
      <Box sx={{ height: 800 }}>
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

function Title() {
  return (
    <h1 className="mb-4 text-3xl font-extrabold text-white dark:text-zinc-200 md:text-5xl lg:text-6xl">
      <span className="text-transparent bg-clip-text bg-gradient-to-r to-pink-700 from-purple-600">
        Population
      </span>{" "}
      Dot Map
    </h1>
  );
}

// calculate bounds of tile based on given x y
function calcBounds(x, y) {
  const zoom = 15;
  const n = Math.pow(2, zoom);

  const North =
    Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * (180 / Math.PI);
  const South =
    Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / n))) * (180 / Math.PI);
  const East = ((x + 1) / n) * 360 - 180;
  const West = (x / n) * 360 - 180;

  return {
    north: North,
    south: South,
    east: East,
    west: West,
  };
}

// extract tile x y coords from the url string
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
// map takes a few seconds to load first time, add a spinner or something?
// add a button to remove all overlays in case user wants to look at normal map?