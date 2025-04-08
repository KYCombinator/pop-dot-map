import os
import pandas as pd
import requests
import csv
import mercantile
import numpy as np
import math


import boto3
import geopandas as gpd
from io import BytesIO
import zipfile
from dotenv import load_dotenv
import tempfile

from PIL import Image, ImageDraw

load_dotenv()

def get_info():
    URL = "https://api.census.gov/data/2020/dec/dhc"
    PARAMS = {
        "get": "NAME,H1_001N,GEO_ID",
        "for": "block:*",
        "in": "state:21 county:111",
        "key": os.getenv("CENSUS_API_KEY")
    }

    year = "2020_"
    census = "census_year.csv"

    response = requests.get(url= URL, params= PARAMS)
    match response.status_code:
        case 200: 
            data = response.json()
            with open(year+census, 'w', newline='') as csvfile:
                writer = csv.writer(csvfile)
                writer.writerows(data)

        case _:
            print(f"Error: {response.status_code}, {response.text}")
    
    census_data = pd.read_csv(year+census)
    return census_data

def connecting_to_s3(census_data):
    census_data["GEO_ID"] = census_data["GEO_ID"].str.replace("1000000US", "", regex=False)

    BUCKET_NAME = "censusawsbucket"
    FILE_KEY = "tl_2020_21_tabblock20.zip"

    s3 = boto3.client("s3")

    obj = s3.get_object(Bucket=BUCKET_NAME, Key=FILE_KEY)
    zip_data = BytesIO(obj['Body'].read())

    with tempfile.TemporaryDirectory() as tempdir:
        with zipfile.ZipFile(zip_data, 'r') as zip_ref:
            zip_ref.printdir()

            shapefile_path = "tl_2020_21_tabblock20/tl_2020_21_tabblock20"
            
            zip_ref.extractall(tempdir)

        shapefile_shp = os.path.join(tempdir, f"{shapefile_path}.shp")
        
        gdf = gpd.read_file(shapefile_shp)
    

    merged_gdf = gdf.merge(census_data, left_on="GEOID20", right_on="GEO_ID", how="left")

    merged_gdf = merged_gdf.to_crs(epsg=4326)
    merged_gdf["centroid"] = merged_gdf.geometry.centroid
    merged_gdf["latitude"] = merged_gdf["centroid"].y
    merged_gdf["longitude"] = merged_gdf["centroid"].x

    print(merged_gdf[["GEOID20", "POP20", "latitude", "longitude"]].head(20))

    return merged_gdf

def start_generation(merged_gdf):
    ZOOM_LEVEL = 12

    for _, row in merged_gdf.iterrows():
        tile_x, tile_y = latitude_longitude_tile(row["latitude"], row["longitude"], ZOOM_LEVEL)
        generate_tile(merged_gdf, ZOOM_LEVEL, tile_x, tile_y)


def latitude_longitude_tile(lat, lon, zoomlevel):
    n = 2.0** zoomlevel
    xtile = (lon + 180.0) / 360.0 * n
    ytile = (1.0 - math.log(math.tan(math.radians(lat)) + (1 / math.cos(math.radians(lat)))) / math.pi) / 2.0 * n
    return int(xtile), int(ytile)

def latlon_to_pixel(lat, lon, zoom):
    n = 2.0 ** zoom
    x = (lon + 180.0) / 360.0 * n * 256
    y = (1.0 - math.log(math.tan(math.radians(lat)) + (1 / math.cos(math.radians(lat)))) / math.pi) / 2.0 * n * 256
    return int(x) % 256, int(y) % 256

def generate_tile(merged_gdf, zoomlevel, tile_x, tile_y, output_folder="tiles"):
    tile_img = Image.new("RGBA", (256, 256), (255, 255, 255, 0))
    draw = ImageDraw.Draw(tile_img)

    tile_bounds = mercantile.bounds(tile_x, tile_y, zoomlevel)

    filtered_df = merged_gdf[
        (merged_gdf["longitude"] >= tile_bounds.west) &
        (merged_gdf["longitude"] <= tile_bounds.east) &
        (merged_gdf["latitude"] >= tile_bounds.south) &
        (merged_gdf["latitude"] <= tile_bounds.north)
    ]

    for _, row in filtered_df.iterrows():
        lat, lon, pop = row['latitude'], row['longitude'], row['POP20']
        dot_x, dot_y = latlon_to_pixel(lat, lon, zoomlevel)
        
        for _ in range(pop):
            jitter_x = np.random.randint(-2, 2)
            jitter_y = np.random.randint(-2, 2)
            draw.ellipse((dot_x + jitter_x, dot_y + jitter_y, dot_x + jitter_x + 2, dot_y + jitter_y + 2), fill="red")

    os.makedirs(output_folder, exist_ok=True)
    tile_path = os.path.join(output_folder, f"tile_{tile_x}_{tile_y}.png")
    tile_img.save(tile_path)
    print(f"Saved {tile_path}")




def main():
    ky_data = get_info()
    merged_gdf = connecting_to_s3(ky_data)
    start_generation(merged_gdf)
main()