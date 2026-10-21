<?php
/**
 * The templates of ezgmaplocation carry no inline CSS: no <style> block and no style="" attribute. A
 * Content-Security-Policy without 'unsafe-inline' for style-src drops those. The map's size is in
 * design/standard/stylesheets/ezgmaplocation.css, loaded by settings/design.ini.append.php [StylesheetSettings]; a
 * size given to the view template travels in data-ezgml-width and data-ezgml-height. Reads the files only, without
 * the kernel or a database.
 *
 *   php extension/ezgmaplocation/tests/ezgmaplocation_inline_css_test.php
 *
 *  GC-01 - no <style> block and no style="" attribute in any template (template comments left out)
 *  GC-02 - design.ini loads ezgmaplocation.css for the administration and the public designs, and it sizes .ezgml-map
 *  GC-03 - the edit and view maps carry the class; the view passes its size in data attributes the script reads
 *
 * Prints PASS/FAIL per check and a summary; the exit code is 1 on a failure.
 *
 * @license GNU General Public License v2.0 (or any later version)
 */

$failures = 0;
function gcCheck( $ok, $message )
{
    global $failures;
    echo ( $ok ? 'PASS' : 'FAIL' ), ": $message\n";
    if ( !$ok )
        $failures++;
}

$root = dirname( __DIR__ );
$sheetPath = 'design/standard/stylesheets/ezgmaplocation.css';

$templates = array();
$it = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $root . '/design', FilesystemIterator::SKIP_DOTS ) );
foreach ( $it as $file )
    if ( substr( (string)$file, -4 ) === '.tpl' )
        $templates[substr( (string)$file, strlen( $root ) + 1 )] = preg_replace( '/\{\*.*?\*\}/s', '', file_get_contents( (string)$file ) );
ksort( $templates );

// GC-01
$inline = array();
foreach ( $templates as $path => $source )
    if ( preg_match_all( '/<style\b/i', $source ) + preg_match_all( '/(?<![\w.\-])style\s*=\s*["\'{]/i', $source ) )
        $inline[] = $path;
gcCheck( count( $templates ) > 0 && !$inline, 'GC-01 no inline CSS in ' . count( $templates ) . ' templates' . ( $inline ? ': ' . implode( ', ', $inline ) : '' ) );

// GC-02
$ini = (string)@file_get_contents( $root . '/settings/design.ini.append.php' );
$sheet = is_file( $root . '/' . $sheetPath ) ? preg_replace( '~/\*.*?\*/~s', '', file_get_contents( $root . '/' . $sheetPath ) ) : '';
gcCheck( preg_match( '/^\[StylesheetSettings\]\s*$/m', $ini )
         && preg_match( '/^BackendCSSFileList\[\]=ezgmaplocation\.css\s*$/m', $ini )
         && preg_match( '/^FrontendCSSFileList\[\]=ezgmaplocation\.css\s*$/m', $ini )
         && preg_match( '/\.ezgml-map\s*\{[^}]*\bwidth:[^}]*\bmax-width:\s*100%[^}]*\bheight:/', $sheet ),
         "GC-02 design.ini loads $sheetPath, which sizes .ezgml-map" );

// GC-03
$edit = isset( $templates['design/standard/templates/content/datatype/edit/ezgmaplocation.tpl'] ) ? $templates['design/standard/templates/content/datatype/edit/ezgmaplocation.tpl'] : '';
$view = isset( $templates['design/standard/templates/content/datatype/view/ezgmaplocation.tpl'] ) ? $templates['design/standard/templates/content/datatype/view/ezgmaplocation.tpl'] : '';
$script = (string)@file_get_contents( $root . '/design/standard/javascript/ezgmaplocation_map.js' );
gcCheck( preg_match( '/class="ezgml-map ezgml-map-edit"/', $edit ) && preg_match( '/class="ezgml-map ezgml-map-view"/', $view )
         && strpos( $view, 'data-ezgml-width="{$width|int}"' ) !== false && strpos( $view, 'data-ezgml-height="{$height|int}"' ) !== false
         && strpos( $script, "attr('data-ezgml-width')" ) !== false && strpos( $script, "attr('data-ezgml-height')" ) !== false,
         'GC-03 the maps carry .ezgml-map and the view passes its size to the script' );

echo $failures ? "FAIL: $failures\n" : "PASS: all\n";
exit( $failures ? 1 : 0 );
