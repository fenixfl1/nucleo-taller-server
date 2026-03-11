// scripts/autocannon.ts
import autocannon from 'autocannon'
import { request } from 'undici'

const base = process.env.BASE_URL ?? 'http://localhost:3000'

async function login(): Promise<string> {
  const res = await request(`${base}/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'BPSBROSARIO', password: '1234' }),
  })

  if (res.statusCode >= 300) {
    throw new Error(`Login failed: ${res.statusCode}`)
  }
  const {data}: any = await res.body.json()

  const token = data?.sessionCookie?.token ?? data?.token
  if (!token) throw new Error('No token in response')
  return token
}

async function main() {
  const token = process.env.TOKEN ?? (await login())

  // OJO: autocannon devuelve un EventEmitter; no se "await-ea"
  const instance = autocannon({
    url: base,
    connections: 50,
    duration: 60,
    headers: {
      authorization:token,         // añade "Bearer "
      'content-type': 'application/json',
    },
    // GET no debería llevar body. Si tu endpoint requiere body, usa POST.
    requests: [
      // GET simple:
      { method: 'GET', path: '/3/2482' },

      // Si necesitas body, usa POST:
      // {
      //   method: 'POST',
      //   path: '/3/2482',
      //   body: JSON.stringify({ idEmpresa: 3, idUsuario: 153 }),
      // },
    ],
  })

  // imprime métricas en consola
  autocannon.track(instance as never, {
    renderProgressBar: true,
    renderResultsTable: true,
    renderLatencyTable: true,
  })

  instance.on('done', (r) => {
    console.info('completed', {
      requestsTotal: r.requests.total,
      non2xx: r.non2xx,
      errors: r.errors,
      timeouts: r.timeouts,
    })
    process.exit(0)
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
