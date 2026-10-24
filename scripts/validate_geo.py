"""Validate GeoJSON name matching against dataset."""
import json
import csv

ALIAS = {
    "DI. ACEH": "Aceh",
    "DAERAH ISTIMEWA YOGYAKARTA": "DI Yogyakarta",
    "BANGKA BELITUNG": "Kepulauan Bangka Belitung",
    "NUSATENGGARA BARAT": "Nusa Tenggara Barat",
}

with open("public/provinces.geojson", encoding="utf-8") as f:
    gj = json.load(f)

dataset_names = set()
with open("data/processed/dataset_dashboard_seluruh_provinsi.csv", encoding="utf-8-sig") as f:
    reader = csv.DictReader(f)
    for row in reader:
        if int(row["tahun"]) <= 2023:
            dataset_names.add(row["provinsi"].strip())

matched = 0
unmatched = []
for feat in gj["features"]:
    geo = feat["properties"]["Propinsi"].strip().upper()
    resolved = ALIAS.get(geo, None)
    direct = geo in {n.upper() for n in dataset_names}
    if direct:
        matched += 1
    elif resolved and resolved in dataset_names:
        matched += 1
        print(f"  ALIAS: {geo!r} -> {resolved!r}")
    else:
        unmatched.append(geo)

print(f"\nMatched: {matched}/{len(gj['features'])}")
if unmatched:
    print("UNMATCHED:", unmatched)
else:
    print("All 34 features matched successfully.")
