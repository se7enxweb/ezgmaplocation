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
<script type="text/javascript" src="//maps.google.com/maps/api/js?key={ezini('GMapSettings', 'ApiKey', 'ezgmaplocation.ini')}&sensor={ezini('GMapSettings', 'UseSensor', 'ezgmaplocation.ini')}"></script>
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
<div id="ezgml-map-{$attribute.id}" style="width: {$width}px; height: {$height}px;" data-ezgml-view="{$attribute.id}" data-ezgml-lat="{first_set( $latitude, '0.0' )|wash}" data-ezgml-lng="{first_set( $longitude, '0.0' )|wash}"></div>
{/if}
