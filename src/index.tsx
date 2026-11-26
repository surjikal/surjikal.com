import { Hono } from 'hono'
import { Fragment } from 'hono/jsx'
import { renderer } from './renderer'
import { MUSIC_LINKS, SITE } from './site'

const PUBLIC_CACHE_HEADERS = {
  'cache-control': 'public, max-age=0, s-maxage=3600',
  'x-content-type-options': 'nosniff',
} as const

const AI_USER_AGENTS = [
  '*',
  'Googlebot',
  'Bingbot',
  'OAI-SearchBot',
  'GPTBot',
  'ChatGPT-User',
  'PerplexityBot',
  'ClaudeBot',
  'anthropic-ai',
  'Google-Extended',
] as const

const app = new Hono<{ Bindings: CloudflareBindings }>()

app.get('/.well-known/discord', (c) =>
  c.text('dh=25740a84b0fd31b6ea341d11a673e829dd03315c', 200, {
    'content-type': 'text/plain; charset=UTF-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  }),
)

app.get('/robots.txt', (c) => {
  const origin = new URL(c.req.url).origin
  const rules = AI_USER_AGENTS.flatMap((agent) => [`User-agent: ${agent}`, 'Allow: /', ''])
  const body = [...rules, `Sitemap: ${origin}/sitemap.xml`, ''].join('\n')

  return c.text(body, 200, {
    'content-type': 'text/plain; charset=UTF-8',
    ...PUBLIC_CACHE_HEADERS,
  })
})

app.get('/sitemap.xml', (c) => {
  const origin = new URL(c.req.url).origin
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${origin}/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`

  return c.body(xml, 200, {
    'content-type': 'application/xml; charset=UTF-8',
    ...PUBLIC_CACHE_HEADERS,
  })
})

app.get('/llms.txt', (c) => {
  const origin = new URL(c.req.url).origin
  const body = [
    `# ${SITE.artist} (${SITE.name})`,
    '',
    `> Official homepage for ${SITE.artist} (${SITE.name}), based in ${SITE.location}.`,
    '',
    '## Official Links',
    '',
    `- Website: ${origin}/`,
    ...MUSIC_LINKS.map((link) => `- ${link.title}: ${link.href}`),
    '',
  ].join('\n')

  return c.text(body, 200, {
    'content-type': 'text/plain; charset=UTF-8',
    ...PUBLIC_CACHE_HEADERS,
  })
})

app.use('/', renderer)

function HomePage() {
  return (
    <main class="page">
      <div class="hero">
        <div class="surj-wrap">
          <svg
            class="surj"
            viewBox="0 0 1000 190"
            preserveAspectRatio="none"
            role="img"
            aria-label={SITE.artist}
          >
            <text x="0" y="165" textLength="1000" lengthAdjust="spacingAndGlyphs">
              {SITE.artist}
            </text>
          </svg>
        </div>

        <nav class="music-links" aria-label="Music and video">
          {MUSIC_LINKS.map((link, index) => (
            <Fragment key={link.id}>
              {index > 0 && <span class="divider" aria-hidden="true" />}
              <a
                class={link.id}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                title={link.title}
              >
                <span class="sr-only">{link.ariaLabel}</span>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d={link.svgPath} />
                </svg>
              </a>
            </Fragment>
          ))}
        </nav>
      </div>
    </main>
  )
}

app.get('/', (c) => {
  for (const [header, value] of Object.entries(PUBLIC_CACHE_HEADERS)) {
    c.header(header, value)
  }
  c.header('x-robots-tag', 'index, follow')
  c.header('referrer-policy', 'strict-origin-when-cross-origin')

  return c.render(<HomePage />)
})

export default app
