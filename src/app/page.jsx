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
      <div className="flex md:justify-center w-screen float-left">
        <div className="px-10 py-5 bg-zinc-700 w-fit rounded-3xl ">
          <Title />
        </div>

        <InfoDropdown />
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

        <div className=" bg-zinc-700 rounded-3xl p-8 flex shrink">
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

  useEffect(() => {
    if (!map || !Array.isArray(data)) return;

    overlays.current.forEach((overlay) => overlay.setMap(null));
    overlays.current = [];

    data.forEach((tile) => {
      const tileURL = tile.url;
      const xyVals = getCoords(tileURL);
      const bounds = calcBounds(xyVals.x, xyVals.y);
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
    label: "1990",
  },
  {
    value: 33,
    label: "2000",
  },
  {
    value: 66,
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

function InfoDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-zinc-700 text-white rounded-xl shadow-md p-4 w-fit absolute top-6 right-6 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left text-lg font-semibold text-purple-300 hover:text-purple-200 transition"
      >
        {isOpen ? "▼" : "▶"} More Info
      </button>

      {isOpen && (
        <div className="mt-3 text-sm text-zinc-200">
          <p>
            This website provides a <strong>"Visual Population Dot Map"</strong>{" "}
            overlay for Louisville and surrounding areas. The red dots represent
            population distribution based on census data for selected years from{" "}
            <strong>1990</strong> to <strong>2020</strong>.
          </p>
          <p className="mt-2">
            * Please note: Data from IPUMS NHGIS is used only for the year{" "}
            <strong>1990</strong>.
          </p>

          <p className="mt-2">
            You can use the slider on the right to toggle between census years.
            Each year's population data is retrieved dynamically and displayed
            as map tiles over Google Maps.
          </p>
          <p className="mt-2">
            This project is built with <strong>Next.js</strong>,{" "}
            <strong>Tailwind CSS</strong>, and <strong>Google Maps API</strong>.
            It serves as a tool to visually understand urban growth, migration
            trends, and historical data overlays.
          </p>
          <p className="mt-4 text-sm text-purple-300">
            Data Source:{" "}
            <a
              href="https://www.nhgis.org/citation-and-use-nhgis-data"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-purple-400"
            >
              IPUMS NHGIS - Citation and Use
            </a>
          </p>
        </div>
      )}
    </div>
  );
}


// extract tile x y coords from the url string
function getCoords(urlString) {
  const re = /tile_(\d+)_(\d+).png/;
  const match = urlString.match(re);

  const xValue = parseInt(match[1]);
  const yValue = parseInt(match[2]);

  return { x: xValue, y: yValue };
}

