Upgrading from 6.0.x to 6.1.0
=============================

What changed
------------

- The script `ezgmaplocation_map.js` is an expui module on jQuery 4. The extension now needs
  `expui` (activate it before `ezjscore`). The templates load it with
  `{ezscript_require( array( 'exp::core', 'ezgmaplocation_map.js' ) )}`; the page's own jQuery 4 is
  reused, an older page jQuery stays untouched.
- The Google API is loaded with the dynamic library import (`importLibrary`) and `loading=async`.
  The classic `google.maps.Marker` is used only when no Map ID is set; with `MapId` the markers are
  `AdvancedMarkerElement`.
- New settings: `MapId`, `ApiVersion`, `Language`, `Region`.
- Without a key the edit form shows the latitude and longitude fields and an OpenStreetMap link
  (new) instead of inactive buttons; the view template shows the same link.
- New texts: "Open in OpenStreetMap" and "The map could not be loaded. Enter the latitude and
  longitude by hand." (English until translated).

What to do
----------

1. Make sure `expui` is active (`ActiveExtensions[]=expui`, before `ezjscore`).
2. Add `MapId` if you want advanced markers ([GOOGLE_SETUP.md](GOOGLE_SETUP.md)).
3. If your CSP allowed Google for the old script, it still does ([CSP.md](CSP.md)); add
   `worker-src blob:` when you use a Map ID.
4. Deploy with the packer (`exp:velocity deploy --packer`) so the new script is bundled.

Override templates
------------------

An override of `content/datatype/edit/ezgmaplocation.tpl` or `view/ezgmaplocation.tpl` that printed
its own `<script>` calling `eZGmapLocation_MapControl( id, base )` or
`eZGmapLocation_MapView( id, lat, lng )` keeps working: both functions still exist and start the
map when expui and the script are on the page. New overrides should copy the shipped templates (the
`data-exp-gmaplocation` attribute and the `data-ezgml-*` settings) and print no script.
The attributes `data-ezgml-edit` and `data-ezgml-view` of 6.0.x are gone.

Removed
-------

The sensor parameter, `google.maps.GeocoderStatus` and the `onload` map setup of the old script.
