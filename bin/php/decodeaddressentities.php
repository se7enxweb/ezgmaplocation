#!/usr/bin/env php
<?php
/**
 * One-off conversion: decode the HTML entities that the edit form used to store in ezgmaplocation.address.
 *
 * Up to 6.0.7 the datatype passed a posted address through htmlentities() before it stored it, so "Müllerstraße 5"
 * was stored as "M&uuml;llerstra&szlig;e 5". The datatype now stores the address as typed and the templates escape
 * it on output; without this conversion the old rows would show their entities on the page.
 *
 * Run it once, as an upgrade step, before editors work with the new version: an address saved through the edit form
 * after the upgrade is stored as typed, and a second run would decode it as well.
 *
 * It decodes every row that holds something like an entity ("&xxx;"), including rows that were never encoded (from a
 * package import or fromString()) and contain a literal "&amp;" or similar on purpose. Check the dry-run list first.
 *
 * It looks at the database of the given siteaccess only, and says so. An installation with several databases runs
 * it once per siteaccess. Without --apply it only lists what it would change; with --apply all rows are written in
 * one transaction, which is rolled back when an update fails.
 *
 *   php extension/ezgmaplocation/bin/php/decodeaddressentities.php -s <siteaccess>
 *   php extension/ezgmaplocation/bin/php/decodeaddressentities.php -s <siteaccess> --apply
 *
 * What it does not do: the search index, the sort key and the object names were built from the encoded value. They
 * follow on the next publish of the object, or with a reindex of the objects listed here.
 *
 * @copyright Copyright (C) 1998 - 2026 7x & Exponential Foundation. All rights reserved.
 * @license GNU General Public License v2.0 (or any later version)
 * @package ezgmaplocation
 */

require 'autoload.php';

$cli = eZCLI::instance();
$script = eZScript::instance( array( 'description' => 'Decodes HTML entities stored in ezgmaplocation.address (dry run unless --apply)',
                                     'use-session' => false,
                                     'use-modules' => false,
                                     'use-extensions' => true ) );
$script->startup();
// getOptions() before initialize(): only then does the database connection belong to the siteaccess given with -s
$options = $script->getOptions( '[apply]', '', array( 'apply' => 'Write the decoded addresses (default: list only)' ),
                                false, array( 'siteaccess' => true ) );
if ( empty( $options['siteaccess'] ) )
{
    $cli->error( 'Name the siteaccess with -s <siteaccess>: the script changes the database of that siteaccess only.' );
    $script->shutdown( 1 );
}
$script->initialize();

$db = eZDB::instance();
$apply = (bool)$options['apply'];
$cli->output( sprintf( 'Siteaccess %s, database %s%s. Other siteaccesses with their own database were not looked at.',
                       $script->usedSiteAccess(), $db->DB, $apply ? '' : ' (dry run, nothing is written)' ) );
$cli->output( 'Run this once only, before editors save addresses with the new version. Rows that were never encoded'
              . ' (package import, fromString()) and hold a literal "&xxx;" are decoded as well: check the list below.' );

$rows = $db->arrayQuery( "SELECT contentobject_attribute_id, contentobject_version, address FROM ezgmaplocation WHERE address LIKE '%&%;%'" );
$changed = 0;
if ( $apply )
    $db->begin();
try
{
    foreach ( $rows as $row )
    {
        $address = (string)$row['address'];
        $decoded = html_entity_decode( $address, ENT_QUOTES | ENT_HTML401, 'UTF-8' );
        if ( $decoded === $address )
            continue;
        ++$changed;
        $cli->output( sprintf( '  attribute %d version %d: %s -> %s', $row['contentobject_attribute_id'],
                               $row['contentobject_version'], $address, $decoded ) );
        if ( $apply && $db->query( sprintf( "UPDATE ezgmaplocation SET address = '%s' WHERE contentobject_attribute_id = %d AND contentobject_version = %d",
                                            $db->escapeString( $decoded ), (int)$row['contentobject_attribute_id'],
                                            (int)$row['contentobject_version'] ) ) === false )
            throw new RuntimeException( sprintf( 'Update of attribute %d version %d failed', $row['contentobject_attribute_id'],
                                                 $row['contentobject_version'] ) );
    }
    if ( $apply )
        $db->commit();
}
catch ( Throwable $e )
{
    if ( $apply )
        $db->rollback();
    $cli->error( $e->getMessage() . ( $apply ? ' - rolled back, nothing was written.' : '' ) );
    $script->shutdown( 1 );
}

$cli->output( sprintf( '%d of %d candidate row(s) %s.', $changed, count( $rows ), $apply ? 'decoded' : 'would be decoded' ) );
$script->shutdown( 0 );
