# Public Header, Footer and 404

**Required for engineers and AI contributors:** read [公共组件协作规范](CONTRIBUTING.zh-CN.md) before changing public pages or integrating a new system.

`@4seas/site-chrome` is maintained here, in the **homepage repository**. The
homepage, Longevity, Coliving introduction, Event, Booking, Residency and
CoLivingOS public application use this package. Admin layouts and business
toolbars stay in their own applications. The legacy `coliving` repository is
not the application currently served at `/coliving`.

## One source

- `config.js`: navigation, destinations, community links and brand copy.
- `index.js`: one framework-neutral Header/Footer/404 tree and the HTML renderer.
- `react.js`: thin React renderer of that same tree; no duplicate JSX template.
- `interaction.js`: the same accessible menu controller for static and React.
- `style.css`, `assets/`: isolated public styles and original brand artwork.

The global **Coliving** item always opens `/coliving-community/`; application
buttons continue to open `/coliving/en/start`. Public menus expand above 900px.
On smaller screens the menu aligns beneath the Menu button. Without JavaScript
the links remain visible. Escape closes the menu and returns focus to its button.

## Static pages

Edit this directory, then run `npm run chrome:generate` and `npm test`.
The generator replaces only the marked Header/Footer regions in ten HTML files
and writes the production CSS, script and logo under the existing allowlist.
`npm run chrome:check` fails if generated output was edited manually or is stale;
CI and release tests run this check. No runtime network request is needed to
fetch the Header or Footer. Language routes and page content stay local.

## React applications

Depend on an immutable Git commit of this public repository:

```json
"@4seas/site-chrome": "git+https://github.com/4seas-community/homepage.git#<full-commit-sha>"
```

```tsx
import { Header, Footer } from '@4seas/site-chrome/react';
import '@4seas/site-chrome/style.css';

<Header assetBase="/event/site-chrome" section="events" />
<Footer assetBase="/event/site-chrome" />
```

Run `4seas-chrome-assets public/site-chrome` before development and builds. It
copies package artwork into each app's own deployment; do not maintain those
generated files by hand. Supply the application's base path explicitly. Optional
`locale` and `languages` props integrate existing locale routing. Never drop
query tokens from verification or receipt language links. Footer `children`
can carry an application build badge without duplicating the footer.

## Updating all sites

1. Change and review this package in homepage; regenerate and test static pages.
2. Pin the resulting full commit SHA in the four consuming repositories and
   regenerate their lockfiles. Test each app; open coordinated PRs.
3. Merge homepage first, then the consumer PRs. Deploy through each existing
   approval process. Updating this source alone does not silently change live apps.

All production assets are local and versioned. Rollback means reverting each
consumer's package pin (or the static generation commit), not editing live HTML.

## Shared 404

`NotFound` (React) and `renderNotFound` (static HTML) use the same tree,
translations, canonical recovery links and stylesheet. App wrappers supply only
`pathname` and their deployment `basePath`. The page detects the first locale
segment after that prefix, and offers Chinese, English and Thai switching.
No extra navigation element is introduced; the existing Header/Footer are used
once by each route layout. The booking destination is `https://book.4seas.xyz/`.

`404.html` and `js/site-not-found.js` are generated output. Run
`python3 scripts/preview.py --port 4200` (or `npm run preview`) to preview static
pages with that real 404 fallback. A missing nested URL keeps HTTP 404 and its
original address; HEAD has the same status/headers and no response body. The
preview is bound to localhost and does not expose directory listings or source
files. A plain `python -m http.server` instead shows Python's built-in error page.

When changing published styles/scripts, bump the package version and `VERSION`
in `config.js` before generation, so all static asset URLs invalidate caches.

## Language-selector contract

The public Header always renders exactly one language selector. Apps supply
localized native links, including their deployment prefix and current query.
Pages without translated routes use a `lang` query choice for public chrome;
their existing page content is not presented as newly translated. The static
404 uses that same selector to translate the error body and Header together;
it has no separate body language bar. Omitted/empty language options fall back
to the shared query adapter instead of silently hiding the control.
