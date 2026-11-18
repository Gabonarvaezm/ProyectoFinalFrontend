import { Router, json } from 'express';
import { setTimeout as delay } from 'node:timers/promises';
import { loadChatbotConfiguration } from './server-environment.mjs';

const MODE_INSTRUCTIONS = {
  tutor: 'Explica los conceptos con claridad y ejemplos adecuados al nivel de la consulta.',
  'step-by-step': 'Desarrolla la solución paso a paso y comprueba el resultado.',
  'exam-generator': 'Prepara preguntas sobre el tema solicitado, con respuestas y retroalimentación.',
  bibliography: 'Sugiere bibliografía pertinente. No inventes referencias, DOI ni enlaces; indica si no puedes verificarlos.',
} as const;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatbotApiOptions {
  apiKey?: string;
  model?: string;
  fetcher?: typeof fetch;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isChatMessage(value: unknown): value is ChatMessage {
  return isRecord(value) &&
    (value['role'] === 'user' || value['role'] === 'assistant') &&
    typeof value['content'] === 'string' &&
    value['content'].trim().length > 0 && value['content'].length <= 8000;
}

async function requestCompletion(
  fetcher: typeof fetch,
  apiKey: string,
  body: object
): Promise<{ status: number; text?: string }> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetcher('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey.trim()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(45000),
      });
      if (!response.ok) {
        const transient = [408, 500, 502, 503, 504].includes(response.status);
        await response.body?.cancel();
        if (!transient || attempt === 1) return { status: response.status };
      } else {
        const result: unknown = await response.json();
        const choices = isRecord(result) ? result['choices'] : undefined;
        const choice: unknown = Array.isArray(choices) ? choices[0] : undefined;
        const message = isRecord(choice) ? choice['message'] : undefined;
        const text = isRecord(message) ? message['content'] : undefined;
        if (typeof text === 'string' && text.trim()) return { status: 200, text: text.trim() };
        if (attempt === 1) return { status: 502 };
      }
    } catch (error: unknown) {
      if (attempt === 1) throw error;
    }
    await delay(500);
  }
  return { status: 502 };
}

export function createChatbotRouter(options: ChatbotApiOptions = {}): Router {
  const router = Router();
  router.use(json({ limit: '96kb' }));

  router.post('/', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const body: unknown = req.body;
    if (!isRecord(body) || typeof body['query'] !== 'string' ||
        !body['query'].trim() || body['query'].length > 2000 ||
        typeof body['mode'] !== 'string' || !Object.hasOwn(MODE_INSTRUCTIONS, body['mode'])) {
      res.status(400).json({ error: 'Revisa la consulta y el modo académico seleccionado.' });
      return;
    }

    const history: unknown = body['history'] ?? [];
    if (!Array.isArray(history) || history.length > 20 || !history.every(isChatMessage)) {
      res.status(400).json({ error: 'El historial de conversación no es válido.' });
      return;
    }

    const configuration = loadChatbotConfiguration();
    const apiKey = options.apiKey ?? configuration.apiKey;
    if (!apiKey?.trim()) {
      res.status(503).json({ error: 'El asistente aún no tiene configurada su conexión a la IA.' });
      return;
    }

    const mode = body['mode'] as keyof typeof MODE_INSTRUCTIONS;
    try {
      const response = await requestCompletion(options.fetcher ?? fetch, apiKey, {
        model: options.model ?? configuration.model,
        messages: [
            { role: 'system', content: `Eres DiscerIA, un tutor escolar. Ayuda con cualquier materia del colegio: matemáticas, ciencias naturales, física, química, biología, historia, geografía, lengua, literatura, inglés, tecnología y las demás asignaturas. Responde en el idioma del usuario y adapta las explicaciones al grado escolar que indique. Si no indica grado, explica de forma sencilla con ejemplos. Responde de forma breve y completa, y amplía cuando te lo pidan. Sé preciso, reconoce la incertidumbre y no afirmes haber consultado fuentes que no has verificado. ${MODE_INSTRUCTIONS[mode]}` },
            ...history,
            { role: 'user', content: body['query'].trim() },
        ],
        temperature: 0.4,
        max_tokens: 3200,
      });

      if (response.status !== 200) {
        const error = response.status === 429
          ? 'La IA alcanzó su límite de solicitudes. Intenta de nuevo en unos momentos.'
          : response.status === 401 || response.status === 403
            ? 'OpenRouter rechazó la credencial configurada. Revisa la clave del servidor.'
            : response.status === 402
              ? 'OpenRouter no tiene saldo o cuota disponible para esta solicitud.'
              : 'El proveedor de IA no está disponible en este momento. Intenta de nuevo.';
        res.status(response.status === 429 ? 429 : 502).json({ error });
        return;
      }

      res.json({ text: response.text });
    } catch (error: unknown) {
      const timedOut = error instanceof Error && error.name === 'TimeoutError';
      res.status(timedOut ? 504 : 502).json({
        error: timedOut
          ? 'La IA tardó demasiado en responder. Intenta de nuevo.'
          : 'No se pudo conectar con la IA. Intenta de nuevo en unos momentos.',
      });
    }
  });

  return router;
}
