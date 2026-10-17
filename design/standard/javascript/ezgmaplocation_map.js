/**
 * ezgmaplocation: the map picker of the edit form and the map of the view template.
 *
 * The templates print no inline code (so the pages work under a Content Security Policy without 'unsafe-inline'):
 *   edit: <div id="ezgml-map-<attribute id>" data-ezgml-edit="<attribute id>" data-ezgml-base="<lat/long id base>"
 *              data-ezgml-msg-not-found="..." data-ezgml-msg-location-error="...">
 *   view: <div id="ezgml-map-<attribute id>" data-ezgml-view="<attribute id>" data-ezgml-lat="..." data-ezgml-lng="...">
 * Every such map is set up once, on window load (after the Google Maps API script), as before.
 * eZGmapLocation_MapControl() and eZGmapLocation_MapView() stay global functions for override templates that call them.
 */
(function ()
{
    if ( window.eZGmapLocation_MapControl && window.eZGmapLocation_MapView && window.eZGmapLocation_setUpMaps )
        return;

    var messages = {};

    function message( attributeId, key, fallback )
    {
        var m = messages[attributeId];
        return m && m[key] ? m[key] : fallback;
    }

    window.eZGmapLocation_MapControl = function ( attributeId, latLongAttributeBase )
    {
        var mapid = 'ezgml-map-' + attributeId;
        var latid  = 'ezcoa-' + latLongAttributeBase + '_latitude';
        var longid = 'ezcoa-' + latLongAttributeBase + '_longitude';
        var geocoder = null;
        var addressid = 'ezgml-address-' + attributeId;
        var zoommax = 13;

        var showAddress = function ()
        {
            var address = document.getElementById( addressid ).value;
            if ( geocoder )
            {
                geocoder.geocode( { 'address': address }, function ( results, status )
                {
                    if ( status == google.maps.GeocoderStatus.OK )
                    {
                        map.setOptions( { center: results[0].geometry.location, zoom: zoommax } );
                        marker.setPosition( results[0].geometry.location );
                        updateLatLngFields( results[0].geometry.location );
                    }
                    else
                    {
                        alert( message( attributeId, 'notFound', '%address not found' ).replace( '%address', address ) );
                    }
                } );
            }
        };

        var updateLatLngFields = function ( point )
        {
            document.getElementById( latid ).value = point.lat();
            document.getElementById( longid ).value = point.lng();
            document.getElementById( 'ezgml-restore-button-' + attributeId ).disabled = false;
            document.getElementById( 'ezgml-restore-button-' + attributeId ).className = 'button';
        };

        var restoretLatLngFields = function ()
        {
            document.getElementById( latid ).value     = document.getElementById( 'ezgml_hidden_latitude_' + attributeId ).value;
            document.getElementById( longid ).value    = document.getElementById( 'ezgml_hidden_longitude_' + attributeId ).value;
            document.getElementById( addressid ).value = document.getElementById( 'ezgml_hidden_address_' + attributeId ).value;
            if ( document.getElementById( latid ).value && document.getElementById( latid ).value != 0 )
            {
                var point = new google.maps.LatLng( document.getElementById( latid ).value, document.getElementById( longid ).value );
                marker.setPosition( point );
                map.panTo( point );
            }
            document.getElementById( 'ezgml-restore-button-' + attributeId ).disabled = true;
            document.getElementById( 'ezgml-restore-button-' + attributeId ).className = 'button-disabled';
            return false;
        };

        var getUserPosition = function ()
        {
            navigator.geolocation.getCurrentPosition( function ( position )
            {
                var location = '';
                var point = new google.maps.LatLng( position.coords.latitude, position.coords.longitude );

                if ( navigator.geolocation.type == 'Gears' && position.gearsAddress )
                    location = [position.gearsAddress.city, position.gearsAddress.region, position.gearsAddress.country].join( ', ' );
                else if ( navigator.geolocation.type == 'ClientLocation' )
                    location = [position.address.city, position.address.region, position.address.country].join( ', ' );

                document.getElementById( addressid ).value = location;
                map.setOptions( { zoom: zoommax, center: point } );
                marker.setPosition( point );
                updateLatLngFields( point );
            },
            function ( e )
            {
                alert( message( attributeId, 'locationError', 'Could not get your location, error was: %error' ).replace( '%error', e.message ) );
            },
            { 'gearsRequestAddress': true } );
        };

        var startPoint = null;
        var zoom = 0;
        var map = null;
        var marker = null;

        if ( document.getElementById( latid ).value && document.getElementById( latid ).value != 0 )
        {
            startPoint = new google.maps.LatLng( document.getElementById( latid ).value, document.getElementById( longid ).value );
            zoom = zoommax;
        }
        else
        {
            startPoint = new google.maps.LatLng( 0, 0 );
        }

        map = new google.maps.Map( document.getElementById( mapid ), { center: startPoint, zoom: zoom, mapTypeId: google.maps.MapTypeId.ROADMAP } );
        marker = new google.maps.Marker( { map: map, position: startPoint, draggable: true } );
        google.maps.event.addListener( marker, 'dragend', function ( event )
        {
            updateLatLngFields( event.latLng );
            document.getElementById( addressid ).value = '';
        } );

        geocoder = new google.maps.Geocoder();
        google.maps.event.addListener( map, 'click', function ( event )
        {
            marker.setPosition( event.latLng );
            map.panTo( event.latLng );
            updateLatLngFields( event.latLng );
            document.getElementById( addressid ).value = '';
        } );

        document.getElementById( 'ezgml-address-button-' + attributeId ).onclick = showAddress;
        document.getElementById( 'ezgml-restore-button-' + attributeId ).onclick = restoretLatLngFields;

        if ( navigator.geolocation )
        {
            document.getElementById( 'ezgml-mylocation-button-' + attributeId ).onclick = getUserPosition;
            document.getElementById( 'ezgml-mylocation-button-' + attributeId ).className = 'button';
            document.getElementById( 'ezgml-mylocation-button-' + attributeId ).disabled = false;
        }
    };

    window.eZGmapLocation_MapView = function ( attributeId, latitude, longitude )
    {
        var zoommax = 13;
        var startPoint, zoom;

        if ( latitude && longitude )
        {
            startPoint = new google.maps.LatLng( latitude, longitude );
            zoom = zoommax;
        }
        else
        {
            startPoint = new google.maps.LatLng( 0, 0 );
            zoom = 0;
        }

        var map = new google.maps.Map( document.getElementById( 'ezgml-map-' + attributeId ), { center: startPoint, zoom: zoom, mapTypeId: google.maps.MapTypeId.ROADMAP } );
        var marker = new google.maps.Marker( { map: map, position: startPoint } );
    };

    // sets up every map of the page that is not set up yet; a template may print this file more than once
    window.eZGmapLocation_setUpMaps = function ()
    {
        var i, el, id, nodes;
        nodes = document.querySelectorAll( '[data-ezgml-edit]' );
        for ( i = 0; i < nodes.length; i++ )
        {
            el = nodes[i];
            if ( el.getAttribute( 'data-ezgml-ready' ) )
                continue;
            el.setAttribute( 'data-ezgml-ready', '1' );
            id = el.getAttribute( 'data-ezgml-edit' );
            messages[id] = { notFound: el.getAttribute( 'data-ezgml-msg-not-found' ),
                             locationError: el.getAttribute( 'data-ezgml-msg-location-error' ) };
            if ( typeof google === 'undefined' || !google.maps )
            {
                // the map API did not load (no API key, blocked, offline): the buttons stay inactive, as with "return false"
                document.getElementById( 'ezgml-address-button-' + id ).onclick = function () { return false; };
                document.getElementById( 'ezgml-restore-button-' + id ).onclick = function () { return false; };
                document.getElementById( 'ezgml-mylocation-button-' + id ).onclick = function () { return false; };
                continue;
            }
            window.eZGmapLocation_MapControl( id, el.getAttribute( 'data-ezgml-base' ) );
        }
        nodes = document.querySelectorAll( '[data-ezgml-view]' );
        for ( i = 0; i < nodes.length; i++ )
        {
            el = nodes[i];
            if ( el.getAttribute( 'data-ezgml-ready' ) )
                continue;
            el.setAttribute( 'data-ezgml-ready', '1' );
            if ( typeof google === 'undefined' || !google.maps )
                continue;
            window.eZGmapLocation_MapView( el.getAttribute( 'data-ezgml-view' ),
                                           parseFloat( el.getAttribute( 'data-ezgml-lat' ) ) || 0,
                                           parseFloat( el.getAttribute( 'data-ezgml-lng' ) ) || 0 );
        }
    };

    if ( document.readyState === 'complete' )
        window.eZGmapLocation_setUpMaps();
    else
        window.addEventListener( 'load', window.eZGmapLocation_setUpMaps, false );
})();
