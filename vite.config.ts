import { defineConfig, loadEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import fs from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * Dev-only plugin: serve Vercel-style serverless handlers from /api/*.ts
 * during `npm run dev` so we don't need `vercel dev` to test Telegram order
 * submission locally.
 *
 * In production these files are picked up by Vercel automatically.
 */
function apiHandlersPlugin(): Plugin {
  return {
    name: 'shelter-api-handlers',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) return next()

        const pathname = req.url.split('?')[0]
        const name = pathname.replace(/^\/api\//, '').replace(/\/$/, '')
        const file = path.resolve(__dirname, 'api', `${name}.ts`)

        if (!name || !fs.existsSync(file)) {
          res.statusCode = 404
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ error: `no handler for /api/${name}` }))
          return
        }

        try {
          const mod = await server.ssrLoadModule(file)
          const handler = (mod as any).default
          if (typeof handler !== 'function') {
            res.statusCode = 500
            res.end(JSON.stringify({ error: `handler in ${name} has no default export` }))
            return
          }

          const body = await readBody(req)
          const vReq = Object.assign(req, { body, query: parseQuery(req.url) })
          const vRes = wrapResponse(res)
          await handler(vReq, vRes)
        } catch (e: any) {
          console.error(`[api/${name}]`, e)
          if (!res.writableEnded) {
            res.statusCode = 500
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify({ error: e?.message ?? 'internal error' }))
          }
        }
      })
    },
  }
}

function parseQuery(url: string): Record<string, string> {
  const qIdx = url.indexOf('?')
  if (qIdx === -1) return {}
  const params = new URLSearchParams(url.slice(qIdx + 1))
  const out: Record<string, string> = {}
  params.forEach((v, k) => { out[k] = v })
  return out
}

function readBody(req: IncomingMessage): Promise<any> {
  if (req.method === 'GET' || req.method === 'HEAD') return Promise.resolve(undefined)
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(c as Buffer))
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8')
        if (!text) return resolve(undefined)
        const ct = (req.headers['content-type'] ?? '') as string
        if (ct.includes('application/json')) {
          resolve(JSON.parse(text))
        } else {
          resolve(text)
        }
      } catch (e) { reject(e) }
    })
    req.on('error', reject)
  })
}

function wrapResponse(res: ServerResponse) {
  const r = res as any
  r.status = (code: number) => { r.statusCode = code; return r }
  r.json = (obj: any) => {
    r.setHeader('content-type', 'application/json')
    r.end(JSON.stringify(obj))
    return r
  }
  r.send = (body: any) => {
    if (typeof body === 'object') return r.json(body)
    r.end(String(body))
    return r
  }
  return r
}

export default defineConfig(({ mode }) => {
  // Load .env into process.env so api handlers can read TG_BOT_TOKEN, etc.
  const env = loadEnv(mode, process.cwd(), '')
  for (const [k, v] of Object.entries(env)) {
    if (process.env[k] === undefined) process.env[k] = v
  }

  return {
    plugins: [vue(), apiHandlersPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
    },
  }
})
