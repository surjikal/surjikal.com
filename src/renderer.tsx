import { jsxRenderer } from 'hono/jsx-renderer'
import { Link, ViteClient } from 'vite-ssr-components/hono'
import { MUSIC_LINKS, SITE } from './site'

function buildJsonLd(origin: string): string {
  const canonical = `${origin}/`
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${origin}/#person`,
        name: SITE.artist,
        alternateName: SITE.name,
        url: canonical,
        description: `${SITE.artist} (${SITE.name}) — music artist based in ${SITE.location}.`,
        sameAs: MUSIC_LINKS.map((link) => link.href),
        homeLocation: {
          '@type': 'Place',
          name: SITE.location,
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        url: canonical,
        name: SITE.name,
        description: SITE.description,
        publisher: {
          '@id': `${origin}/#person`,
        },
      },
      {
        '@type': 'ProfilePage',
        '@id': `${origin}/#webpage`,
        url: canonical,
        name: SITE.name,
        isPartOf: {
          '@id': `${origin}/#website`,
        },
        mainEntity: {
          '@id': `${origin}/#person`,
        },
      },
    ],
  }).replaceAll('<', '\\u003c')
}

function DocumentMeta({ canonical }: { canonical: string }) {
  return (
    <>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{SITE.name}</title>
      <meta name="description" content={SITE.description} />
      <meta name="author" content={SITE.artist} />
      <meta name="creator" content={SITE.artist} />
      <meta name="robots" content="index, follow, max-image-preview:large" />
      <meta name="googlebot" content="index, follow, max-image-preview:large" />
      <meta name="theme-color" content={SITE.themeColor} />
      <link rel="canonical" href={canonical} />
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link
        rel="preload"
        href="/fonts/unbounded-900.woff2"
        as="font"
        type="font/woff2"
        crossorigin="anonymous"
      />
      <meta name="geo.region" content={SITE.geoRegion} />
      <meta name="geo.placename" content={SITE.location} />
      <meta property="og:type" content="profile" />
      <meta property="og:title" content={SITE.name} />
      <meta property="og:description" content={SITE.description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content={SITE.artist} />
      <meta property="og:locale" content="en_US" />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={SITE.name} />
      <meta name="twitter:description" content={SITE.description} />
    </>
  )
}

export const renderer = jsxRenderer(({ children }, c) => {
  const origin = new URL(c.req.url).origin
  const canonical = `${origin}/`
  const jsonLd = buildJsonLd(origin)

  return (
    <html lang="en">
      <head>
        <DocumentMeta canonical={canonical} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
        <ViteClient />
        <Link href="/src/style.css" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
})
