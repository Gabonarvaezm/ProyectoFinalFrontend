// Deploy to Supabase Edge Functions. OPENROUTER_API_KEY is a function secret, never an Angular variable.
type Environment = Record<string, string | undefined>;
const instructions: Record<string, string> = {
  tutor: 'Explica con claridad y ejemplos adecuados al nivel del estudiante.',
  'step-by-step': 'Resuelve paso a paso y comprueba el resultado.',
  'exam-generator': 'Crea preguntas, respuestas y retroalimentación sobre el tema.',
  bibliography: 'Sugiere fuentes pertinentes sin inventar referencias, DOI ni enlaces.',
};
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function createAcademicChatHandler(env: Environment, request: typeof fetch = fetch) {
  return async (req: Request): Promise<Response> => {
    const origin = req.headers.get('origin') ?? '';
    const origins = (env['ALLOWED_ORIGINS'] ?? '').split(',').map(s => s.trim()).filter(Boolean);
    const allowed = origins.length === 0 || !origin || origins.includes(origin);
    const headers = {
      'Access-Control-Allow-Origin': origins.length ? (origins.includes(origin) ? origin : origins[0]) : '*',
      'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
      'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin', 'Cache-Control': 'no-store',
      'Content-Type': 'application/json',
    };
    const reply = (status: number, body: object) => new Response(JSON.stringify(body), { status, headers });
    if (!allowed) return reply(403, { error: 'Origen no autorizado.' });
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (req.method !== 'POST') return reply(405, { error: 'Método no permitido.' });
    const authorization = req.headers.get('authorization') ?? '';
    if (!authorization.startsWith('Bearer ')) return reply(401, { error: 'Inicia sesión para consultar la IA.' });
    const url = env['SUPABASE_URL'];
    const publicKeys = env['SUPABASE_PUBLISHABLE_KEYS'];
    let key = env['SUPABASE_ANON_KEY'];
    if (!key && publicKeys) { try { key = JSON.parse(publicKeys)['default']; } catch { /* Report configuration error below. */ } }
    if (!url || !key || !env['OPENROUTER_API_KEY']) return reply(503, { error: 'Falta configurar los secretos de la función de IA.' });
    try {
      const user = await request(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: authorization }, signal: AbortSignal.timeout(10000) });
      if (!user.ok) return reply(401, { error: 'Tu sesión expiró. Inicia sesión nuevamente.' });
      const raw = await req.text();
      if (new TextEncoder().encode(raw).length > 98304) return reply(413, { error: 'La conversación es demasiado larga.' });
      let body: unknown;
      try { body = JSON.parse(raw); } catch { return reply(400, { error: 'Consulta inválida.' }); }
      if (!record(body) || typeof body['query'] !== 'string' || !body['query'].trim() || body['query'].length > 2000 ||
        typeof body['mode'] !== 'string' || !Object.hasOwn(instructions, body['mode'])) return reply(400, { error: 'Revisa la consulta y el modo académico.' });
      const history = body['history'] ?? [];
      if (!Array.isArray(history) || history.length > 20 || !history.every(item => record(item) && ['user','assistant'].includes(String(item['role'])) &&
        typeof item['content'] === 'string' && item['content'].length > 0 && item['content'].length <= 8000)) return reply(400, { error: 'Historial inválido.' });
      const quota = await request(`${url}/rest/v1/rpc/consume_ai_quota`, { method: 'POST', headers: {
        apikey: key, Authorization: authorization, 'Content-Type': 'application/json',
      }, body: '{}', signal: AbortSignal.timeout(10000) });
      if (!quota.ok) {
        const error: unknown = await quota.json();
        const message = record(error) && typeof error['message'] === 'string' ? error['message'] : '';
        return reply(message.includes('30 consultas') ? 429 : 503, { error: message || 'No se pudo comprobar el límite de consultas.' });
      }
      for (let attempt = 0; attempt < 2; attempt++) {
        const response = await request('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST', headers: { Authorization: `Bearer ${env['OPENROUTER_API_KEY']}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: env['OPENROUTER_MODEL'] || 'nvidia/nemotron-3-ultra-550b-a55b:free',
            messages: [{ role: 'system', content: `Eres DiscerIA, un tutor académico para todas las materias escolares. Adapta la explicación al grado del usuario. Responde de forma clara y precisa, reconoce la incertidumbre y no inventes fuentes. ${instructions[body['mode']]}` },
              ...history, { role: 'user', content: body['query'].trim() }], max_tokens: 1500 }), signal: AbortSignal.timeout(45000),
        });
        if (response.ok) {
          const data: unknown = await response.json();
          const choices = record(data) ? data['choices'] : undefined;
          const choice: unknown = Array.isArray(choices) ? choices[0] : undefined;
          const message = record(choice) ? choice['message'] : undefined;
          if (record(message) && typeof message['content'] === 'string' && message['content'].trim()) return reply(200, { text: message['content'].trim() });
        } else {
          await response.body?.cancel();
          if (![408,500,502,503,504].includes(response.status) || attempt === 1) break;
        }
      }
      return reply(502, { error: 'El proveedor de IA no pudo responder. Intenta nuevamente.' });
    } catch {
      return reply(502, { error: 'No se pudo completar la consulta. Intenta nuevamente.' });
    }
  };
}

const runtime = (globalThis as unknown as { Deno?: { env: { toObject(): Environment }; serve(handler: (request: Request) => Promise<Response>): void } }).Deno;
if (runtime) runtime.serve(createAcademicChatHandler(runtime.env.toObject()));
