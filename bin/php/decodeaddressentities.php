#!/usr/bin/env php
<?php
/**
 * One-off conversion: decode the HTML entities that the edit form used to store in ezgmaplocation.address.
 *
 * Up to 6.0.6 the datatype passed a posted address through htmlentities() before it stored it, so "Müllerstraße 5"
 * was stored as "M&uuml;llerstra&szlig;e 5". The datatype now stores the address as typed and the templates escape
 * it on output; without this conversion the old rows would show their entities on the page.
 *
 * It looks at the database of the given siteaccess only, and says so. An installation with several databases runs
 * it once per siteaccess. Without --apply it only lists what it would change.
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

$rows = $db->arrayQuery( "SELECT contentobject_attribute_id, contentobject_version, address FROM ezgmaplocation WHERE address LIKE '%&%;%'" );
$changed = 0;
if ( $apply )
    $db->begin();
foreach ( $rows as $row )
{
    $address = (string)$row['address'];
    $decoded = html_entity_decode( $address, ENT_QUOTES | ENT_HTML401, 'UTF-8' );
    if ( $decoded === $address )
        continue;
    ++$changed;
    $cli->output( sprintf( '  attribute %d version %d: %s -> %s', $row['contentobject_attribute_id'],
                           $row['contentobject_version'], $address, $decoded ) );
    if ( $apply )
        $db->query( sprintf( "UPDATE ezgmaplocation SET address = '%s' WHERE contentobject_attribute_id = %d AND contentobject_version = %d",
                             $db->escapeString( $decoded ), (int)$row['contentobject_attribute_id'], (int)$row['contentobject_version'] ) );
}
if ( $apply )
    $db->commit();

$cli->output( sprintf( '%d of %d candidate row(s) %s.', $changed, count( $rows ), $apply ? 'decoded' : 'would be decoded' ) );
$script->shutdown( 0 );
