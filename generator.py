import os
import pandas as pd
import requests
import csv
import mercantile
import numpy as np
from shapely.geometry import Point, Polygon
import math


import boto3
import geopandas as gpd
from io import BytesIO
import zipfile
from dotenv import load_dotenv
import tempfile
from PIL import Image, ImageDraw
load_dotenv()


def get_info(csv_file):

    census_data = pd.read_csv(csv_file)
    return census_data

def generate_random_points(polygon: Polygon, num_points: int, max_attempts=5000):
    """Generate up to `num_points` random points inside the given polygon."""
    points = []
    minx, miny, maxx, maxy = polygon.bounds
    attempts = 0

    while len(points) < num_points and attempts < max_attempts:
        x = np.random.uniform(minx, maxx)
        y = np.random.uniform(miny, maxy)
        p = Point(x, y)
        if polygon.contains(p):
            points.append(p)
        attempts += 1

    return points

def connecting_to_s3(census_data):
    census_data["GEO_ID"] = census_data["GEO_ID"].str.replace("1000000US", "", regex=False)

    BUCKET_NAME = "censusawsbucket"
    FILE_KEY = "tl_2010_21_tabblock00.zip"
    s3 = boto3.client("s3")
    obj = s3.get_object(Bucket=BUCKET_NAME, Key=FILE_KEY)
    zip_data = BytesIO(obj['Body'].read())

    with tempfile.TemporaryDirectory() as tempdir:
        with zipfile.ZipFile(zip_data, 'r') as zip_ref:
            zip_ref.extractall(tempdir)

        shapefile_path = None
        for root, dirs, files in os.walk(tempdir):
            for file in files:
                if file.endswith(".shp"):
                    shapefile_path = os.path.join(root, file)
                    break

        if shapefile_path is None:
            raise FileNotFoundError("No .shp file found in extracted ZIP archive.")

        gdf = gpd.read_file(shapefile_path)

    gdf = gdf[gdf["COUNTYFP00"] == "111"]  #Jefferson

    print("Columns in shapefile:", gdf.columns)

    gdf["GEOID"] = ( #This had to be done with shapefiles for 2000
    gdf["STATEFP00"] +
    gdf["COUNTYFP00"] +
    gdf["TRACTCE00"] +
    gdf["BLOCKCE00"]
)

    merged_gdf = gdf.merge(census_data, left_on="GEOID", right_on="GEO_ID", how="left")

    # Reproject for centroid
    projected_crs = "EPSG:26916"
    gdf_projected = merged_gdf.to_crs(projected_crs)
    gdf_projected["centroid"] = gdf_projected.geometry.centroid

    gdf_projected = gdf_projected.set_geometry("centroid").to_crs(epsg=4326)
    merged_gdf["latitude"] = gdf_projected.geometry.y
    merged_gdf["longitude"] = gdf_projected.geometry.x
    merged_gdf['P001001'] = merged_gdf['P001001'].fillna(0).astype(int)

    print(merged_gdf[["GEOID", "latitude", "longitude"]].head(20))

    return merged_gdf

def start_generation(merged_gdf):
    ZOOM_LEVEL = 15
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
    return x, y

def generate_tile(merged_gdf, zoomlevel, tile_x, tile_y, output_folder="2000_Tiles"):
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
        lat, lon, pop = row['latitude'], row['longitude'], row['P001001']
        dot_x, dot_y = latlon_to_pixel(lat, lon, zoomlevel)

        pop = row['P001001']
        if pop <= 0:
            continue

        geom = row['geometry']
        if geom.is_empty or geom is None:
            continue

        try:
            points = generate_random_points(geom, pop)
        except Exception as e:
            print(f"Skipping block due to error: {e}")
            continue

        for point in points:
            lat = point.y
            lon = point.x
            global_x, global_y = latlon_to_pixel(lat, lon, zoomlevel)

            tile_origin_x = tile_x * 256
            tile_origin_y = tile_y * 256
            dot_x = global_x - tile_origin_x
            dot_y = global_y - tile_origin_y

            r = 2
            fill = (230, 0, 118, 255)      
            draw.circle((dot_x, dot_y), r, fill=fill)

    tile_img = tile_img.resize((256, 256), resample=Image.LANCZOS)

    os.makedirs(output_folder, exist_ok=True)
    tile_path = os.path.join(output_folder, f"tile_{tile_x}_{tile_y}.png")
    tile_img.save(tile_path)
    print(f"Saved {tile_path}")

def main():
    ky_data = get_info("/Users/sydneyporter/Desktop/pop-dot-map/2000_Census_Year/111.csv")
    merged_gdf = connecting_to_s3(ky_data)
    start_generation(merged_gdf)
main()