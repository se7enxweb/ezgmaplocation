/**
 * ezgmaplocation: the map picker of the edit form and the map of the view template.
 *
 * Built on expui (Exp.$ is jQuery 4; load it with {ezscript_require( array( 'exp::core', 'ezgmaplocation_map.js' ) )}).
 * No inline code, no eval: the templates print only data attributes, and this file adds Google's script itself, as a
 * script element with a src (the "dynamic library import" bootstrap, loading=async), so a Content Security Policy
 * needs script-src for https://maps.googleapis.com and nothing else for scripts (see doc/CSP.md).
 *
 *   edit: <div id="ezgml-map-<attribute id>" data-exp-gmaplocation="edit" data-ezgml-base="<lat/long id base>"
 *              data-ezgml-key data-ezgml-map-id data-ezgml-language data-ezgml-region
 *              data-ezgml-msg-not-found data-ezgml-msg-location-error data-ezgml-msg-map-error>
 *   view: <div id="ezgml-map-<attribute id>" data-exp-gmaplocation="view" data-ezgml-lat data-ezgml-lng
 *              data-ezgml-width data-ezgml-height data-ezgml-key data-ezgml-map-id ...>
 *
 * With a Map ID the markers are AdvancedMarkerElement (the classic google.maps.Marker is deprecated and takes no
 * Map ID styling); without one the classic marker is the fallback. Without an API key no Google script is loaded:
 * the coordinate fields and an OpenStreetMap link remain (the template renders them), the map element stays hidden.
 * Addresses are found with the Geocoding library (google.maps.Geocoder, promise form).
 */
(function (window, document) {
    'use strict';

    var Exp = window.Exp;
    if (!Exp || !Exp.$) { return; }
    var $ = Exp.$;
    var ZOOM_MAX = 13;
    var loading = null;

    /** The Google Maps JavaScript API, once per page: resolves with google.maps, rejects when it cannot load. */
    function loadGoogle(opt) {
        if (window.google && window.google.maps && window.google.maps.importLibrary) {
            return Promise.resolve(window.google.maps);
        }
        if (loading) { return loading; }
        loading = new Promise(function (resolve, reject) {
            var params = { key: opt.key, v: opt.version || 'weekly', loading: 'async' };
            if (opt.language) { params.language = opt.language; }
            if (opt.region) { params.region = opt.region; }
            var query = Object.keys(params).map(function (k) {
                return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
            }).join('&');
            var script = document.createElement('script');
            script.async = true;
            script.src = 'https://maps.googleapis.com/maps/api/js?' + query;
            script.onload = function () {
                // the real loader defines google.maps.importLibrary a moment after the script has run
                var tries = 0;
                (function wait() {
                    if (window.google && window.google.maps && window.google.maps.importLibrary) {
                        resolve(window.google.maps);
                    } else if (++tries > 100) {
                        reject(new Error('The Google Maps API did not start'));
                    } else {
                        window.setTimeout(wait, 50);
                    }
                }());
            };
            script.onerror = function () { reject(new Error('The Google Maps script could not be loaded')); };
            document.head.appendChild(script);
        });
        loading.catch(function () { loading = null; });
        return loading;
    }

    // Google calls this when the key is refused (wrong key, API not enabled, referrer not allowed, billing)
    var authListeners = [];
    window.gm_authFailure = function () { authListeners.forEach(function (fn) { fn('Google refused the API key (gm_authFailure): see the console message from Google above'); }); };

    /** Reads the element's settings. */
    function settings($el) {
        var d = function (name) { return $el.attr('data-ezgml-' + name) || ''; };
        return { key: d('key'), mapId: d('map-id'), language: d('language'), region: d('region'), version: d('api-version') };
    }

    function colorScheme() {
        var root = document.documentElement, theme = root.getAttribute('data-a4-theme') || root.getAttribute('data-theme');
        if (theme === 'dark') { return 'DARK'; }
        if (theme === 'light') { return 'LIGHT'; }
        return 'FOLLOW_SYSTEM';
    }

    /** The libraries the map needs: maps, marker (with a Map ID) and geocoding (the edit form). */
    function libraries(opt, edit) {
        var wanted = [window.google.maps.importLibrary('maps')];
        wanted.push(opt.mapId ? window.google.maps.importLibrary('marker') : Promise.resolve(null));
        wanted.push(edit ? window.google.maps.importLibrary('geocoding') : Promise.resolve(null));
        return Promise.all(wanted).then(function (l) { return { maps: l[0], marker: l[1], geocoding: l[2] }; });
    }

    function lat(p) { return typeof p.lat === 'function' ? p.lat() : Number(p.lat); }
    function lng(p) { return typeof p.lng === 'function' ? p.lng() : Number(p.lng); }

    /** A marker: AdvancedMarkerElement with a Map ID, the classic marker without. */
    function makeMarker(gm, libs, opt, map, position, draggable) {
        if (opt.mapId && libs.marker && libs.marker.AdvancedMarkerElement) {
            return { advanced: true, m: new libs.marker.AdvancedMarkerElement({ map: map, position: position, gmpDraggable: draggable, title: '' }) };
        }
        return { advanced: false, m: new gm.Marker({ map: map, position: position, draggable: draggable }) };
    }
    function setMarker(marker, position) {
        if (marker.advanced) { marker.m.position = position; } else { marker.m.setPosition(position); }
    }
    function onDragEnd(marker, fn) {
        var read = function () {
            var p = marker.advanced ? marker.m.position : marker.m.getPosition();
            fn({ lat: lat(p), lng: lng(p) });
        };
        if (marker.advanced) {
            // the advanced marker is a web component: its events are gmp-* events (addListener is deprecated for it)
            marker.m.addEventListener('gmp-dragend', read);
        } else {
            marker.m.addListener('dragend', read);
        }
    }

    function mapFailed($el, text, reason) {
        $el.attr('hidden', 'hidden');
        if (reason && window.console) { window.console.warn('ezgmaplocation:', reason); }
        var $note = $('<p class="ezgml-map-error" role="status"></p>').text(text);
        $el.after($note);
        if (window.console) { window.console.warn('ezgmaplocation: ' + text); }
    }

    function osmUrl(la, lo) {
        return 'https://www.openstreetmap.org/?mlat=' + encodeURIComponent(la) + '&mlon=' + encodeURIComponent(lo)
            + '#map=15/' + encodeURIComponent(la) + '/' + encodeURIComponent(lo);
    }

    function initView($el) {
        var opt = settings($el);
        var w = parseInt($el.attr('data-ezgml-width'), 10), h = parseInt($el.attr('data-ezgml-height'), 10);
        if (w > 0) { $el.css('width', w + 'px'); }
        if (h > 0) { $el.css('height', h + 'px'); }
        if (!opt.key) { return; } // the template shows the coordinates and the OpenStreetMap link
        var la = parseFloat($el.attr('data-ezgml-lat')) || 0, lo = parseFloat($el.attr('data-ezgml-lng')) || 0;
        var has = !!(la || lo);
        var failed = function (reason) { mapFailed($el, $el.attr('data-ezgml-msg-map-error') || 'The map could not be loaded.', reason); };
        authListeners.push(failed);
        loadGoogle(opt).then(function (gm) {
            return libraries(opt, false).then(function (libs) {
                var center = { lat: la, lng: lo };
                var mapOptions = { center: center, zoom: has ? ZOOM_MAX : 0, gestureHandling: 'cooperative' };
                if (opt.mapId) { mapOptions.mapId = opt.mapId; mapOptions.colorScheme = colorScheme(); }
                var map = new libs.maps.Map($el[0], mapOptions);
                makeMarker(gm, libs, opt, map, center, false);
            });
        }).catch(failed);
    }

    function initEdit($el) {
        var opt = settings($el);
        var id = ($el.attr('id') || '').replace('ezgml-map-', '');
        var base = $el.attr('data-ezgml-base');
        var $lat = $('#ezcoa-' + base + '_latitude'), $lng = $('#ezcoa-' + base + '_longitude');
        var $address = $('#ezgml-address-' + id), $find = $('#ezgml-address-button-' + id);
        var $restore = $('#ezgml-restore-button-' + id), $here = $('#ezgml-mylocation-button-' + id);
        var $osm = $('#ezgml-osm-' + id);
        var msg = function (name, fallback) { return $el.attr('data-ezgml-msg-' + name) || fallback; };

        function syncLink() {
            var la = parseFloat($lat.val()), lo = parseFloat($lng.val());
            if ($osm.length && isFinite(la) && isFinite(lo) && (la || lo)) {
                $osm.attr('href', osmUrl(la, lo)).prop('hidden', false);
            } else {
                $osm.prop('hidden', true);
            }
        }
        $lat.add($lng).on('input change', syncLink);
        syncLink();

        if (!opt.key) { return; } // no key: the fields and the OpenStreetMap link are the editor

        var failed = function (reason) { mapFailed($el, msg('map-error', 'The map could not be loaded.'), reason); };
        authListeners.push(failed);

        loadGoogle(opt).then(function (gm) {
            return libraries(opt, true).then(function (libs) {
                var geocoder = new libs.geocoding.Geocoder();
                var la = parseFloat($lat.val()), lo = parseFloat($lng.val());
                var has = isFinite(la) && isFinite(lo) && (la || lo);
                var start = { lat: has ? la : 0, lng: has ? lo : 0 };
                var mapOptions = { center: start, zoom: has ? ZOOM_MAX : 0, gestureHandling: 'cooperative' };
                if (opt.mapId) { mapOptions.mapId = opt.mapId; mapOptions.colorScheme = colorScheme(); }
                var map = new libs.maps.Map($el[0], mapOptions);
                var marker = makeMarker(gm, libs, opt, map, start, true);

                function update(point) {
                    $lat.val(point.lat);
                    $lng.val(point.lng);
                    $restore.prop('disabled', false).attr('class', 'button');
                    syncLink();
                }
                function place(point, zoom) {
                    setMarker(marker, point);
                    if (zoom) { map.setOptions({ center: point, zoom: zoom }); } else { map.panTo(point); }
                }

                onDragEnd(marker, function (point) { update(point); $address.val(''); });
                map.addListener('click', function (event) {
                    var point = { lat: event.latLng.lat(), lng: event.latLng.lng() };
                    place(point);
                    update(point);
                    $address.val('');
                });

                $find.prop('disabled', false).off('click.ezgml').on('click.ezgml', function (e) {
                    e.preventDefault();
                    var address = String($address.val()).trim();
                    if (!address) { return; }
                    geocoder.geocode({ address: address }).then(function (response) {
                        var loc = response.results[0].geometry.location;
                        var point = { lat: loc.lat(), lng: loc.lng() };
                        place(point, ZOOM_MAX);
                        update(point);
                    }).catch(function () {
                        window.alert(msg('not-found', '%address not found').replace('%address', address));
                    });
                });

                $restore.off('click.ezgml').on('click.ezgml', function (e) {
                    e.preventDefault();
                    $lat.val($('#ezgml_hidden_latitude_' + id).val());
                    $lng.val($('#ezgml_hidden_longitude_' + id).val());
                    $address.val($('#ezgml_hidden_address_' + id).val());
                    var rl = parseFloat($lat.val()), ro = parseFloat($lng.val());
                    if (isFinite(rl) && isFinite(ro) && (rl || ro)) { place({ lat: rl, lng: ro }); }
                    $restore.prop('disabled', true).attr('class', 'button-disabled');
                    syncLink();
                });

                if (navigator.geolocation) {
                    $here.prop('disabled', false).attr('class', 'button').off('click.ezgml').on('click.ezgml', function (e) {
                        e.preventDefault();
                        navigator.geolocation.getCurrentPosition(function (position) {
                            var point = { lat: position.coords.latitude, lng: position.coords.longitude };
                            $address.val('');
                            place(point, ZOOM_MAX);
                            update(point);
                        }, function (err) {
                            window.alert(msg('location-error', 'Could not get your location, error was: %error').replace('%error', err.message));
                        });
                    });
                }
                $el.attr('data-ezgml-ready', '1');
            });
        }).catch(failed);
    }

    Exp.register('gmaplocation', function ($el, options) {
        if (options && options.value === 'view') { initView($el); } else { initEdit($el); }
    });

    // for override templates written against the old script: the attribute id (and the lat/long id base) of a map
    window.eZGmapLocation_MapControl = function (attributeId, base) {
        var $el = $('#ezgml-map-' + attributeId);
        if ($el.length) { $el.attr('data-ezgml-base', base); initEdit($el); }
    };
    window.eZGmapLocation_MapView = function (attributeId) {
        var $el = $('#ezgml-map-' + attributeId);
        if ($el.length) { initView($el); }
    };
}(window, document));
