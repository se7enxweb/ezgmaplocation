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
{run-once}
{* The Google Maps API only with an API key: Google draws no map without one, and the page would load a script from
   another host for nothing (which a Content Security Policy then has to allow). Without a key the coordinates and the
   address are shown, without the map. *}
{if ezini( 'GMapSettings', 'ApiKey', 'ezgmaplocation.ini' )|trim|ne( '' )}
<script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?key={ezini( 'GMapSettings', 'ApiKey', 'ezgmaplocation.ini' )|trim|urlencode}"></script>
{/if}
{ezscript( array( 'ezgmaplocation_map.js' ) )}
{/run-once}

{if $attribute.has_content}
<div class="block">
<label>{'Latitude'|i18n('extension/ezgmaplocation/datatype')}:</label> {$latitude}
<label>{'Longitude'|i18n('extension/ezgmaplocation/datatype')}:</label> {$longitude}
  {if $attribute.content.address}
    <label>{'Address'|i18n('extension/ezgmaplocation/datatype')}:</label> {$attribute.content.address|wash}
  {/if}
</div>

<label>{'Map'|i18n('extension/ezgmaplocation/datatype')}:</label>
<div id="ezgml-map-{$attribute.id}" class="ezgml-map ezgml-map-view" data-ezgml-width="{$width|int}" data-ezgml-height="{$height|int}" data-ezgml-view="{$attribute.id}" data-ezgml-lat="{first_set( $latitude, '0.0' )|wash}" data-ezgml-lng="{first_set( $longitude, '0.0' )|wash}"></div>
{/if}
