import os
import csv
import requests

from dotenv import load_dotenv

# https://data.louisvilleky.gov/datasets/LOJIC::louisville-metro-ky-county-boundaries-1/about
COUNTY_CODES = {'029', '093', '111', '049', '185', '103', '163', '097', '211', '215', '223', '071'}

output_folder="2000_Census_Year"
os.makedirs(output_folder, exist_ok=True)

load_dotenv()

for county_code in COUNTY_CODES:
    URL = "https://api.census.gov/data/2000/sf1"
    PARAMS = {
        "get": "NAME,P001001",  # Total population
        "for": "block group:*",
        "in": f"state:21 county:{county_code} tract:*",  # Use your county_code variable here
        "key": os.getenv("CENSUS_API_KEY")
    }

    # URL = "https://api.census.gov/data/2010/dec/sf1"
    # PARAMS = {
    #     "get": "NAME,P001001,GEO_ID",
    #     "for": "block:*",
    #     "in": f"state:21 county:{county_code}",
    #     "key": os.getenv("CENSUS_API_KEY")
    # }

    # URL = "https://api.census.gov/data/2020/dec/dhc"
    # PARAMS = {
    #     "get": "NAME,H1_001N,GEO_ID",
    #     "for": "block:*",
    #     "in": f"state:21 county:{county_code}",
    #     "key": os.getenv("CENSUS_API_KEY")
    # }

    year = "2000_"
    census = "census_year.csv"

    response = requests.get(url= URL, params= PARAMS)
    match response.status_code:
        case 200:
            data = response.json()
            path = os.path.join(output_folder, f"{county_code}.csv")
            with open(path, 'w', newline='') as csvfile:
                writer = csv.writer(csvfile)
                writer.writerows(data)
                print(f"Saved {path}")

        case _:
            print(f"Error for county {county_code}: {response.status_code}, {response.text}")

