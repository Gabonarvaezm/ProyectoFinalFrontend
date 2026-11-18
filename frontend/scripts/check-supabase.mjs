import { supabaseConfig } from '../src/environments/supabase.config.ts';
const headers={apikey:supabaseConfig.publishableKey};
const settings=await fetch(`${supabaseConfig.url}/auth/v1/settings`,{headers,signal:AbortSignal.timeout(15000)});
console.log(`Supabase Auth: ${settings.status === 200 ? 'conectado; clave pública válida' : `HTTP ${settings.status}`}`);
if(!settings.ok)process.exitCode=1;
const schema=await fetch(`${supabaseConfig.url}/rest/v1/rpc/academic_snapshot`,{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(15000)});
const result=await schema.json();
if(result.code==='PGRST202') {
  const table=await fetch(`${supabaseConfig.url}/rest/v1/profiles?select=id&limit=0`,{headers,signal:AbortSignal.timeout(15000)});
  const detail=await table.json();
  console.log(detail.code==='PGRST205'
    ? 'Base académica: profiles y academic_snapshot no aparecen en la caché. Ejecuta setup.sql y finish-setup.sql en SQL Editor.'
    : 'Base académica: profiles está disponible; verifica academic_snapshot con una sesión autenticada o en SQL Editor (anon no tiene permiso).');
  process.exitCode=1;
}
else if(schema.status===401 || schema.status===403)console.log('Base académica: RPC instalado y protegido; requiere sesión para leer datos.');
else { console.log(`Base académica: HTTP ${schema.status}; ${result.code ?? 'comprobar configuración'}`); process.exitCode=1; }
