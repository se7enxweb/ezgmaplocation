<?php
/**
 * The edit and view templates load the Google Maps JavaScript API only with an API key, over https from
 * maps.googleapis.com, with the key URL-encoded: without a key Google draws no map, so the page loads nothing from
 * another host (and a Content Security Policy has nothing to allow). The script keeps the map buttons inactive when
 * the API is missing. Reads the files only, without the kernel or a database.
 *
 *   php extension/ezgmaplocation/tests/ezgmaplocation_maps_api_key_test.php
 *
 *  MK-01 - every template that loads the Maps API does so inside {if ... ApiKey ...|trim|ne( '' )}
 *  MK-02 - the API is loaded from https://maps.googleapis.com/maps/api/js with the key |urlencode'd; no maps.google.com
 *          and no protocol-relative address
 *  MK-03 - ezgmaplocation_map.js leaves the maps alone when google.maps is undefined
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

$loading = array_filter( $templates, function ( $s ) { return stripos( $s, 'maps/api/js' ) !== false; } );
mkCheck( count( $loading ) >= 2, 'MK-00 the edit and the view template load the Maps API (' . count( $loading ) . ' templates)' );

$unguarded = $badUrl = array();
foreach ( $loading as $name => $source )
{
    if ( !preg_match( "#\{if ezini\( 'GMapSettings', 'ApiKey', 'ezgmaplocation\.ini' \)\|trim\|ne\( '' \)\}\s*<script[^>]*maps/api/js[^>]*></script>\s*\{/if\}#", $source ) )
        $unguarded[] = $name;
    if ( !preg_match( "#src=\"https://maps\.googleapis\.com/maps/api/js\?key=\{ezini\( 'GMapSettings', 'ApiKey', 'ezgmaplocation\.ini' \)\|trim\|urlencode\}\"#", $source )
         || preg_match( '#maps\.google\.com|src="//#', $source ) )
        $badUrl[] = $name;
}
mkCheck( !$unguarded, 'MK-01 the Maps API is loaded only with an API key' . ( $unguarded ? ': ' . implode( ', ', $unguarded ) : '' ) );
mkCheck( !$badUrl, 'MK-02 the Maps API comes from https://maps.googleapis.com with the key URL-encoded' . ( $badUrl ? ': ' . implode( ', ', $badUrl ) : '' ) );

$js = (string)@file_get_contents( $root . '/design/standard/javascript/ezgmaplocation_map.js' );
mkCheck( substr_count( $js, "typeof google === 'undefined' || !google.maps" ) >= 2, 'MK-03 the script leaves the edit and view maps alone without the API' );

echo $failures ? "FAIL: $failures\n" : "PASS: all\n";
exit( $failures ? 1 : 0 );
