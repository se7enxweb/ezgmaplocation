Settings
========

`extension/ezgmaplocation/settings/ezgmaplocation.ini.append.php`, group `[GMapSettings]`. Put your
own values in `settings/override/ezgmaplocation.ini.append.php` or a siteaccess, never in the
extension. After a change clear the INI cache (`php bin/php/ezcache.php --clear-tag=ini`); a
long-running server such as Velocity also needs a restart to see it.

| Setting | Default | Meaning |
|---------|---------|---------|
| `ApiKey` | empty | Google Maps JavaScript API key. Empty: nothing is loaded from Google, no map is drawn, the coordinate fields and an OpenStreetMap link remain. |
| `MapId` | empty | Map ID from the Google Cloud console. Set: vector maps, `AdvancedMarkerElement` markers and the light or dark color scheme. Empty: classic map and classic `google.maps.Marker`. |
| `ApiVersion` | `weekly` | The API release channel (`weekly`, `quarterly`). |
| `Language` | empty | Language of the map labels (`de`, `fr-CA`). Empty: the visitor's browser language. |
| `Region` | empty | Region bias of the address search (`DE`, `US`). Empty: none. |
| `UseSensor` | `false` | Not used any more. Kept so old overrides still parse. |

```ini
[GMapSettings]
ApiKey=AIza...your-key...
MapId=1234567890abcdef
Region=DE
```

The key is written into the page (it has to be: the browser calls Google). Protect it in the Google
Cloud console with an HTTP referrer restriction and restrict it to the APIs listed in
[GOOGLE_SETUP.md](GOOGLE_SETUP.md).

How the script gets its settings
--------------------------------

The templates print the settings as `data-ezgml-*` attributes on the map element and mark it with
`data-exp-gmaplocation`. The expui module of that name (design/standard/javascript/ezgmaplocation_map.js,
loaded with `ezscript_require( array( 'exp::core', 'ezgmaplocation_map.js' ) )`) reads them. No
template prints a script.

Which marker you get
--------------------

| `MapId` | Marker | Map |
|---------|--------|-----|
| set | `AdvancedMarkerElement` (library `marker`) | vector, follows the admin's light or dark mode (`colorScheme`) |
| empty | classic `google.maps.Marker` (deprecated by Google, still works) | raster |

Google asks for a Map ID before advanced markers work. That is why the classic marker stays as the
fallback: a site that has not created a Map ID keeps a working map.
