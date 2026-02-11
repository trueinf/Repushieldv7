# Getting Accurate Uttarakhand GeoJSON Data

To display the exact map shape of Uttarakhand with proper district boundaries, you need to obtain accurate GeoJSON data.

## Option 1: Download from GADM (Recommended)
1. Visit https://gadm.org/download_country.html
2. Select "India" and download the GeoPackage file
3. Extract Uttarakhand state and district boundaries
4. Convert to GeoJSON format
5. Replace the data in `uttarakhand-districts.ts`

## Option 2: Use India Maps Portal
1. Visit https://indiamaps.gov.in/soiapp/
2. Download Uttarakhand district boundaries
3. Convert to GeoJSON if needed
4. Update `uttarakhand-districts.ts`

## Option 3: Use GitHub Repositories
- https://github.com/geohacker/india (has state-level GeoJSON)
- https://github.com/sterkhedkar/india-geojson (has district-level data)

## Format Required
The GeoJSON should have this structure:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "District Name",
        "district": "District Name"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[lon, lat], ...]]
      }
    }
  ]
}
```

## District Names (must match exactly):
- Almora
- Bageshwar
- Chamoli
- Champawat
- Dehradun
- Haridwar
- Nainital
- Pauri Garhwal
- Pithoragarh
- Rudraprayag
- Tehri Garhwal
- Udham Singh Nagar
- Uttarkashi

