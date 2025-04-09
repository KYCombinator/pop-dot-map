"use client";

import React, { useEffect, useRef, useState } from "react";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";
import 'leaflet/dist/leaflet.css';

export default function Home() {
  const googleAPIKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

  const [toggleOverlay, setToggleOverlay] = useState(null);
  const [sliderValue, setSliderValue] = useState(99);

  const chosenMark = marks.find((mark) => mark.value === Number(sliderValue));
  const chosenYear = chosenMark.label;

  return (
    <div className="flex flex-col w-screen h-screen bg-zinc-800">
      <div className="pl-10 pt-6">
        <Title />
      </div>

      <div className="flex flex-wrap justify-center w-full bg-zinc-800">
        <div className="p-10">
          {/* <OverlayToggleButton toggleOverlay={toggleOverlay} /> */}
        </div>
      </div>

      <div className="flex flex-grow w-full">
        {/* <MapOverlay /> */}
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
          <SliderBar
            sliderValue={sliderValue}
            setSliderValue={setSliderValue}
          />
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

function SliderBar({ sliderValue, setSliderValue }) {
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

function MapOverlay() {

//   Tile numbers to lon./lat.

//    n = 2 ^ zoom
//    lon_deg = xtile / n * 360.0 - 180.0
//    lat_rad = arctan(sinh(π * (1 - 2 * ytile / n)))
//    lat_deg = lat_rad * 180.0 / π
//    This code returns the coordinate of the _upper left_ (northwest-most)-point of the tile.

  var long = 1092 / (2^12) * 360 -180;
  var lat = 180 / Math.PI * Math.atan(Math.sinh(1576 / 2^12 * Math.PI));

  useEffect(() => {

    let map;

    import('leaflet').then((L) => {
      map = L.map('map', {
        center: [38.67, -85.18],
        zoom: 12,
        minZoom: 12,
        maxZoom: 19
         
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      var imageUrl = "images/0_tile_12_1092_1576.png",
          imageBounds = [
            [38.67, -85.18], // South west corner
            [38.69, -85.16]  // north east corner
          ];
      
      L.imageOverlay(imageUrl, imageBounds).addTo(map);

    });
    
  }, []);

  return (
    <div id="map" className="w-4/5 h-full rounded-3xl overflow-hidden">

    </div>
  );
};

function calcBounds(x, y) {
  const zoom = 12;
  const n = Math.pow(2, zoom);

  const West = (x / n) * 360 - 180;
  const East = ((x + 1) / n) * 360 - 180;

  const North = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * (180 / Math.PI);
  const South = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n))) * (180 / Math.PI);

  return {
    north: North,
    south: South,
    east: East,
    west: West
  };

};

function getCoords(urlString) {

  const re = /tile_(\d+)_(\d+).png/;
  var match = urlString.match(re);

  var xValue = parseInt(match[1]);
  var yValue = parseInt(match[2]);

  return {x: xValue, y: yValue};
};