Content Security Policy
=======================

Without `ApiKey` the pages load nothing from Google and a policy needs no change.

With a key the script `ezgmaplocation_map.js` adds one script element,
`https://maps.googleapis.com/maps/api/js?key=...&v=weekly&loading=async`. The templates print no
inline script, there is no `eval`, so `script-src` needs Google's host and no `'unsafe-inline'`:

```ini
[ContentSecurityPolicy]
AdditionalSources[]=script-src https://*.googleapis.com https://*.gstatic.com *.google.com https://*.ggpht.com *.googleusercontent.com
AdditionalSources[]=img-src https://*.googleapis.com https://*.gstatic.com *.google.com *.googleusercontent.com
AdditionalSources[]=connect-src https://*.googleapis.com *.google.com https://*.gstatic.com
AdditionalSources[]=font-src https://fonts.gstatic.com
AdditionalSources[]=style-src https://fonts.googleapis.com
AdditionalSources[]=frame-src *.google.com
AdditionalSources[]=worker-src blob:
```

(`site.ini` of the siteaccess; the lines above are the ones Google's documentation lists for the
Maps JavaScript API.) `worker-src blob:` is for the vector map renderer used with a Map ID.

Notes
-----

- Google's own code sets inline `style` on the map's elements. A `style-src` without
  `'unsafe-inline'` therefore needs `style-src-attr 'unsafe-inline'` (or the page keeps
  `'unsafe-inline'` for `style-src`, as Exponential's default does) for the map to draw. The
  extension's templates carry no style attribute and no `<style>` block; the size comes from
  `ezgmaplocation.css` and, for a view given another `$width` or `$height`, is set with
  `element.style` (the DOM, which a policy allows).
- Nonce-based policies work: the script is added by a script that already runs.
- Test the policy in report-only mode first and watch the reports.
