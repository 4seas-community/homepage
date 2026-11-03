# Public Header and Footer

`@4seas/site-chrome` is maintained here, in the **homepage repository**. The
homepage, Longevity, Coliving introduction, Event, Booking, Residency and
CoLivingOS public application use this package. Admin layouts and business
toolbars stay in their own applications. The legacy `coliving` repository is
not the application currently served at `/coliving`.

## One source

- `config.js`: navigation, destinations, community links and brand copy.
- `index.js`: one framework-neutral Header/Footer tree and the HTML renderer.
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
