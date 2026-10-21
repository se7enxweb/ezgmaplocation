ezgmaplocation documentation
============================

ezgmaplocation adds the `ezgmaplocation` datatype: an address plus a latitude and longitude, edited
on a map and shown on a map. Version 6.1.0 moves it to the current Google Maps JavaScript API and
to expui (jQuery 4).

| Page | What it covers |
|------|----------------|
| [SETTINGS.md](SETTINGS.md) | every setting in `ezgmaplocation.ini` |
| [GOOGLE_SETUP.md](GOOGLE_SETUP.md) | creating the API key and the Map ID in the Google Cloud console |
| [CSP.md](CSP.md) | the Content Security Policy a site with a key needs |
| [UPGRADING.md](UPGRADING.md) | from 6.0.x to 6.1.0, override templates, what changed |
| [TESTING.md](TESTING.md) | the tests and how the maps were checked |

What it does, in short
----------------------

- The edit form: type an address and press "Find address", click the map, or drag the marker. The
  latitude and longitude fields follow. "Restore" returns to what the page loaded with.
- The view template: the coordinates, the address, a link to OpenStreetMap and (with a key) the map.
- Without an API key no script from Google is loaded and no map is drawn. The latitude and longitude
  fields stay (type them by hand) and an OpenStreetMap link shows where they point.
- Requires the extensions `ezjscore` and `expui` (jQuery 4, `Exp.$`).
