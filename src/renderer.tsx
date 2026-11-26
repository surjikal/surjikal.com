import { jsxRenderer } from 'hono/jsx-renderer'
import { Link, ViteClient } from 'vite-ssr-components/hono'

export const renderer = jsxRenderer(({ children }, c) => {
  const canonical = `${new URL(c.req.url).origin}/`
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'SURJ',
    alternateName: 'surjikal',
    url: canonical,
    sameAs: [
      'https://open.spotify.com/artist/4V9z8wSoRXmsMKhW4JrOew',
      'https://www.youtube.com/@surj1kal',
      'https://soundcloud.com/surjikal',
      'https://suno.com/@surjikal',
    ],
    homeLocation: {
      '@type': 'Place',
      name: 'Oakland, California',
    },
  })

  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <title>surjikal</title>
        <meta name="description" content="SURJIKAL OFFICIAL" />
        <meta name="author" content="SURJ" />
        <meta name="creator" content="SURJ" />

        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta
          name="googlebot"
          content="index, follow, max-image-preview:large"
        />
        <meta name="theme-color" content="#ffffff" />

        <link rel="canonical" href={canonical} />

        <meta name="geo.region" content="US-CA" />
        <meta name="geo.placename" content="Oakland, California" />

        <meta property="og:type" content="profile" />
        <meta property="og:title" content="surjikal" />
        <meta property="og:description" content="SURJIKAL OFFICIAL" />
        <meta property="og:url" content={canonical} />
        <meta property="og:site_name" content="SURJ" />
        <meta property="og:locale" content="en_US" />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="surjikal" />
        <meta name="twitter:description" content="SURJIKAL OFFICIAL" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossorigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Unbounded:wght@900&display=swap"
          rel="stylesheet"
        />

        <ViteClient />
        <Link href="/src/style.css" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
})
