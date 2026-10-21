{if is_unset( $width )}
    {def $width=500}
{/if}
{if is_unset( $height )}
    {def $height=280}
{/if}

{* Make sure to normalize floats from db  *}
{* PHP 8.3 version or PHP 8.5 version *}
{* def $latitude  = $attribute.content.latitude|explode(',')|implode('.')
     $longitude = $attribute.content.longitude|explode(',')|implode('.') *}
{* concat() forces value to string so explode/implode works on both float and string values (PHP 8 compat) *}
{def $latitude  = concat( $attribute.content.latitude, '' )|explode(',')|implode('.')
     $longitude = concat( $attribute.content.longitude, '' )|explode(',')|implode('.')}
{def $gml_key = ezini( 'GMapSettings', 'ApiKey', 'ezgmaplocation.ini' )|trim
     $gml_attrs = concat( ' data-ezgml-key="', $gml_key|wash, '" data-ezgml-map-id="', ezini( 'GMapSettings', 'MapId', 'ezgmaplocation.ini' )|trim|wash,
                          '" data-ezgml-api-version="', ezini( 'GMapSettings', 'ApiVersion', 'ezgmaplocation.ini' )|trim|wash,
                          '" data-ezgml-language="', ezini( 'GMapSettings', 'Language', 'ezgmaplocation.ini' )|trim|wash,
                          '" data-ezgml-region="', ezini( 'GMapSettings', 'Region', 'ezgmaplocation.ini' )|trim|wash,
                          '" data-ezgml-msg-map-error="', 'The map could not be loaded. Enter the latitude and longitude by hand.'|i18n( 'extension/ezgmaplocation/datatype' )|wash, '"' )}
{run-once}
{* expui (Exp.$ is jQuery 4) runs the map: no inline script. The Google Maps API is added by the script itself, and only
   with an API key (see doc/SETTINGS.md); without one the coordinates and an OpenStreetMap link are shown. *}
{ezscript_require( array( 'exp::core', 'ezgmaplocation_map.js' ) )}
{/run-once}

{if $attribute.has_content}
<div class="block">
<label>{'Latitude'|i18n('extension/ezgmaplocation/datatype')}:</label> {$latitude}
<label>{'Longitude'|i18n('extension/ezgmaplocation/datatype')}:</label> {$longitude}
  {if $attribute.content.address}
    <label>{'Address'|i18n('extension/ezgmaplocation/datatype')}:</label> {$attribute.content.address|wash}
  {/if}
  <a class="ezgml-osm" href="https://www.openstreetmap.org/?mlat={$latitude|urlencode}&amp;mlon={$longitude|urlencode}#map=15/{$latitude|urlencode}/{$longitude|urlencode}" target="_blank" rel="noopener noreferrer">{'Open in OpenStreetMap'|i18n('extension/ezgmaplocation/datatype')|wash}</a>
</div>

{if $gml_key|ne( '' )}
<label>{'Map'|i18n('extension/ezgmaplocation/datatype')}:</label>
<div id="ezgml-map-{$attribute.id}" class="ezgml-map ezgml-map-view" data-exp-gmaplocation="view"{$gml_attrs} data-ezgml-width="{$width|int}" data-ezgml-height="{$height|int}" data-ezgml-lat="{first_set( $latitude, '0.0' )|wash}" data-ezgml-lng="{first_set( $longitude, '0.0' )|wash}"></div>
{/if}
