import os
import pandas as pd
import requests
import csv


import boto3
import geopandas as gpd
from io import BytesIO
import zipfile
from dotenv import load_dotenv
import tempfile

load_dotenv()

# constants
TILE_SIZE = 256
ZOOM_LEVEL = 12
URL = "https://api.census.gov/data/2020/dec/dhc"
PARAMS = {
    "get": "NAME,H1_001N,GEO_ID",
    "for": "block:*",
    "in": "state:21 county:*",
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

merged_gdf["latitude"] = merged_gdf.geometry.centroid.y
merged_gdf["longitude"] = merged_gdf.geometry.centroid.x

#Hello test test
print(merged_gdf[["GEOID20", "POP20", "latitude", "longitude"]].head())
