"""
generate_dataset.py
-------------------
Generates a synthetic ride demand dataset with 10,000 ride requests over 6 months.
Saves the aggregated demand CSV to ride_demand_aggregated.csv.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

random.seed(42)
np.random.seed(42)

# -- Config --------------------------------------------------------------------
ROUTES = [
    ("Chennai",   "Bangalore"),
    ("Chennai",   "Coimbatore"),
    ("Bangalore", "Chennai"),
    ("Bangalore", "Hyderabad"),
    ("Mumbai",    "Pune"),
    ("Delhi",     "Jaipur"),
]

WEATHER_OPTIONS = ["sunny", "cloudy", "rainy"]
TOTAL_REQUESTS  = 10_000
START_DATE      = datetime(2024, 1, 1)
END_DATE        = datetime(2024, 6, 30)
DATE_RANGE_DAYS = (END_DATE - START_DATE).days

PEAK_MORNING = range(8, 11)   # 8-10 AM
PEAK_EVENING = range(17, 21)  # 5-8 PM


def pick_hour():
    """Return a random hour that is more likely to be in peak periods."""
    if random.random() < 0.50:          # 50% chance of peak hour
        if random.random() < 0.5:
            return random.choice(list(PEAK_MORNING))
        else:
            return random.choice(list(PEAK_EVENING))
    return random.randint(0, 23)


def pick_weather():
    """Pick weather; rainy is less common."""
    return random.choices(WEATHER_OPTIONS, weights=[0.60, 0.25, 0.15], k=1)[0]


# -- Generate raw requests -----------------------------------------------------
records = []
for _ in range(TOTAL_REQUESTS):
    origin, destination = random.choice(ROUTES)

    # Bias date towards weekends
    offset = random.randint(0, DATE_RANGE_DAYS)
    request_date = START_DATE + timedelta(days=offset)
    day_of_week  = request_date.strftime("%A")          # Monday … Sunday

    # Friday / Saturday get 1.5× more requests – handled by sampling weight above;
    # here we additionally duplicate ~50% of Fri/Sat records after the loop.
    hour          = pick_hour()
    passengers    = random.choices([1, 2, 3, 4], weights=[0.4, 0.35, 0.15, 0.10], k=1)[0]
    weather       = pick_weather()
    request_time  = f"{hour:02d}:00"

    # Whether the ride was fulfilled (not used in ML target, but useful for EDA)
    fulfilled = 1 if weather != "rainy" or random.random() > 0.30 else 0

    records.append({
        "origin":         origin,
        "destination":    destination,
        "request_date":   request_date.strftime("%Y-%m-%d"),
        "request_time":   request_time,
        "day_of_week":    day_of_week,
        "hour":           hour,
        "passenger_count": passengers,
        "weather":        weather,
        "fulfilled":      fulfilled,
    })

df = pd.DataFrame(records)

# -- Apply Friday/Saturday 1.5x boost by duplicating rows ---------------------
weekend_mask = df["day_of_week"].isin(["Friday", "Saturday"])
extra = df[weekend_mask].sample(frac=0.50, random_state=42)
df = pd.concat([df, extra], ignore_index=True)
print(f"Total raw requests (with weekend boost): {len(df):,}")

# -- Apply rainy-weather demand reduction -------------------------------------
# Drop ~30% of rainy-day requests to simulate lower demand
rainy_mask  = df["weather"] == "rainy"
drop_idx    = df[rainy_mask].sample(frac=0.30, random_state=42).index
df          = df.drop(index=drop_idx).reset_index(drop=True)
print(f"Total requests after rainy-day reduction: {len(df):,}")

# -- Aggregate to demand count per route/day/hour/weather ---------------------
agg = (
    df.groupby(["origin", "destination", "request_date",
                "day_of_week", "hour", "weather"])
      .size()
      .reset_index(name="demand_count")
)

# -- Save ----------------------------------------------------------------------
output_path = "ride_demand_aggregated.csv"
agg.to_csv(output_path, index=False)
print(f"\nDataset saved -> {output_path}")
print(f"Rows: {len(agg):,}  |  Columns: {list(agg.columns)}")
print(agg.head(10).to_string())
