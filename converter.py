import os
import pandas as pd
import requests
import csv
from dotenv import load_dotenv

load_dotenv()

URL = "https://api.census.gov/data/2020/dec/dhc"
PARAMS = {
    "get": "NAME,H1_001N",
    "for": "block:*",
    "in": "state:21 county:*",
    "key": os.getenv("CENSUS_API_KEY")
}

response = requests.get(url= URL, params= PARAMS)

year = "2020_"
census = "census_year.csv"

match response.status_code:
    case 200:
        data = response.json()
        with open(year+census, 'w', newline='') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerows(data)
    case _:
        print(f"Error: {response.status_code}, {response.text}")



df = pd.read_csv(year+census)
county_total_pop = df.groupby("county")["H1_001N"].transform("sum")
df["county_total"] = county_total_pop
sorted_df = df.sort_values(by='county_total', ascending=False)
print(sorted_df.head().to_string())