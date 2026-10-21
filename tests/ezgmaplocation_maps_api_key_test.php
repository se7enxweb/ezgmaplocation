<?php
/**
 * The edit and view templates and the script, read as files (no kernel, no database, no browser):
 *
 *   php extension/ezgmaplocation/tests/ezgmaplocation_maps_api_key_test.php
 *
 *  MK-00 - the templates print no script element, no on* attribute and no javascript: URL (CSP-friendly)
 *  MK-01 - both templates load expui and the script through ezscript_require( 'exp::core', 'ezgmaplocation_map.js' )
 *  MK-02 - the Google script is created by the script itself, over https from maps.googleapis.com, with loading=async,
 *          the key URL-encoded, and only when a key is set; no maps.google.com, no protocol-relative address
 *  MK-03 - the script uses importLibrary, AdvancedMarkerElement with a Map ID and the classic Marker as the fallback,
 *          the promise form of the Geocoder; no eval, no new Function, no document.write, no YUI, no jQuery 1/2 calls
 *  MK-04 - without a key the script loads nothing: the map element is hidden, the OpenStreetMap link is there
 *  MK-05 - the INI declares ApiKey, MapId, ApiVersion, Language, Region
 *
 * Prints PASS/FAIL per check and a summary; the exit code is 1 on a failure.
 *
 * @license GNU General Public License v2.0 (or any later version)
 */

$failures = 0;
function mkCheck( $ok, $message )
{
    global $failures;
    echo ( $ok ? 'PASS' : 'FAIL' ), ": $message\n";
    if ( !$ok )
        $failures++;
}

$root = dirname( __DIR__ );
$templates = array();
$it = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $root . '/design', FilesystemIterator::SKIP_DOTS ) );
foreach ( $it as $file )
    if ( substr( (string)$file, -4 ) === '.tpl' )
        $templates[substr( (string)$file, strlen( $root ) + 1 )] = preg_replace( '/\{\*.*?\*\}/s', '', file_get_contents( (string)$file ) );

$bad = array();
foreach ( $templates as $name => $source )
    if ( preg_match( '/<script|\son[a-z]+\s*=|javascript:|maps\.googleapis/i', $source ) )
        $bad[] = $name;
mkCheck( !$bad, 'MK-00 the templates print no script, no event attribute, no javascript: URL' . ( $bad ? ': ' . implode( ', ', $bad ) : '' ) );

$missing = array();
foreach ( array( 'content/datatype/edit', 'content/datatype/view' ) as $kind )
{
    $s = $templates["design/standard/templates/$kind/ezgmaplocation.tpl"];
    if ( strpos( $s, "ezscript_require( array( 'exp::core', 'ezgmaplocation_map.js' ) )" ) === false || strpos( $s, 'data-exp-gmaplocation=' ) === false )
        $missing[] = $kind;
}
mkCheck( !$missing, 'MK-01 edit and view load expui and the script and mark the map for the module' . ( $missing ? ': ' . implode( ', ', $missing ) : '' ) );

$js = (string)@file_get_contents( $root . '/design/standard/javascript/ezgmaplocation_map.js' );
mkCheck( strpos( $js, "'https://maps.googleapis.com/maps/api/js?'" ) !== false && strpos( $js, "loading: 'async'" ) !== false
         && strpos( $js, 'encodeURIComponent(k)' ) !== false && strpos( $js, 'if (!opt.key) { return; }' ) !== false
         && !preg_match( '#maps\.google\.com|[\'"]//#', $js ), 'MK-02 Google is loaded by the script, over https, async, key encoded, only with a key' );

mkCheck( strpos( $js, "importLibrary('maps')" ) !== false && strpos( $js, 'AdvancedMarkerElement' ) !== false
         && strpos( $js, 'new gm.Marker(' ) !== false && strpos( $js, "importLibrary('geocoding')" ) !== false
         && strpos( $js, 'geocoder.geocode({ address: address }).then' ) !== false
         && !preg_match( '/\beval\s*\(|new Function|document\.write|YUI\(|\.size\(\)|\$\.browser|GeocoderStatus/', $js ),
         'MK-03 importLibrary, AdvancedMarkerElement with the classic Marker as fallback, promise Geocoder, nothing forbidden' );

$edit = $templates['design/standard/templates/content/datatype/edit/ezgmaplocation.tpl'];
mkCheck( strpos( $edit, 'ezgml-osm-{$attribute.id}' ) !== false && strpos( $edit, "{if \$gml_key|eq( '' )} hidden=\"hidden\"{/if}{\$gml_attrs}" ) !== false
         && strpos( $templates['design/standard/templates/content/datatype/view/ezgmaplocation.tpl'], 'openstreetmap.org' ) !== false,
         'MK-04 without a key the map is hidden and the OpenStreetMap link is there' );

$ini = (string)file_get_contents( $root . '/settings/ezgmaplocation.ini.append.php' );
$all = true;
foreach ( array( 'ApiKey', 'MapId', 'ApiVersion', 'Language', 'Region' ) as $k )
    $all = $all && preg_match( '/^' . $k . '=/m', $ini );
mkCheck( $all, 'MK-05 the INI declares ApiKey, MapId, ApiVersion, Language and Region' );

echo $failures ? "FAIL: $failures\n" : "PASS: all\n";
exit( $failures ? 1 : 0 );
