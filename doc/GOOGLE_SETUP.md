Google setup: key and Map ID
============================

1. In the Google Cloud console create or pick a project and enable billing (Google requires it for
   Maps Platform; the monthly free usage covers small sites).
2. Enable the APIs: **Maps JavaScript API** and **Geocoding API** (the address search of the edit
   form). Nothing else is needed.
3. Create an API key (Credentials). Restrict it:
   - Application restriction: HTTP referrers. Add `https://your-site.example/*` and the address
     of the administration (`https://edit.your-site.example/*`).
   - API restriction: Maps JavaScript API and Geocoding API.
4. Optional, for advanced markers: Map Management, create a Map ID of type JavaScript, vector.
   A Map ID may carry a cloud-based map style; light and dark styles are possible.
5. Put both into your override:

```ini
[GMapSettings]
ApiKey=...
MapId=...
```

6. Clear the INI cache, open an object with a location attribute in the edit form.

If Google refuses the key (not enabled, referrer not allowed, no billing) it calls
`gm_authFailure`; the form then hides the map, shows a short message and the latitude and longitude
fields keep working with the OpenStreetMap link.

Address search
--------------

"Find address" uses the Geocoding library (`google.maps.Geocoder`, promise form). The older
`maps.google.com` loader, the `sensor` parameter and `google.maps.GeocoderStatus` are not used.
The Places library is not loaded: the form needs no autocomplete widget.
