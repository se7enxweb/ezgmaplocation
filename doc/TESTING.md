Testing
=======

DB-less tests (no kernel, no browser), run from the extension directory:

    php tests/ezgmaplocation_maps_api_key_test.php
    php tests/ezgmaplocation_inline_css_test.php

They check that the templates print no script, event attribute or style, that expui and the
script are loaded, that Google is loaded by the script only with a key, over https, async, with the
key encoded, that importLibrary, `AdvancedMarkerElement`, the classic fallback marker and the
promise Geocoder are used, and that the INI declares the settings.

Browser check (release 6.1.0)
-----------------------------

A throwaway class with an `ezgmaplocation` attribute was edited and viewed in the administration and
on the public site, on Apache (port 443) and on Velocity (port 8080), in light and dark mode, in
three configurations: no key, key without Map ID, key with Map ID. The administration ran under its
enforced Content Security Policy with the hosts of [CSP.md](CSP.md) added.

- No key: no request to Google, map hidden, fields and OpenStreetMap link present, the link follows
  typed coordinates.
- Key (stand-in for Google's script): one async request, `importLibrary` for the right libraries,
  the right marker class, address search, marker drag, click on the map, restore, and a save that
  stored the new coordinates and address. No console error or warning (the page's jQuery Migrate
  warnings included).

The stand-in matters: the tests had no real Google key, so the calls into Google were answered by
a script that implements the used parts of `google.maps` (`importLibrary`, `Map`, `Marker`,
`AdvancedMarkerElement`, `Geocoder`). Run the same check once with your own key before relying on
a new key or Map ID setup.
