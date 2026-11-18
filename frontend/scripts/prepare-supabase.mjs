import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Only public configuration is eligible for inclusion in the Angular bundle.
try { process.loadEnvFile(fileURLToPath(new URL('../.env',import.meta.url))); }
catch(error) { if(error.code!=='ENOENT')throw error; }
const url=process.env.SUPABASE_URL;
const key=process.env.SUPABASE_PUBLISHABLE_KEY;
if(url || key) {
  if(!url || !key || !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url)) throw new Error('Define SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY válidos.');
  let publicKey=key.startsWith('sb_publishable_');
  if(key.split('.').length===3) { try { publicKey=JSON.parse(Buffer.from(key.split('.')[1],'base64url').toString()).role==='anon'; }catch{} }
  if(!publicKey)throw new Error('SUPABASE_PUBLISHABLE_KEY debe ser pública. Nunca uses service_role o sb_secret.');
  await writeFile(new URL('../src/environments/supabase.config.ts',import.meta.url),
    `// Public browser configuration. Never use a secret/service_role key.\nexport const supabaseConfig = ${JSON.stringify({url:url.replace(/\/$/,''),publishableKey:key,institution:'Universidad Cooperativa de Colombia'},null,2)};\n`);
}
const migrations=['202611180001_academic.sql','202611180002_files.sql','202611180003_chat_quota.sql','202611180004_teacher.sql'];
const sql=await Promise.all(migrations.map(async name=>(await readFile(new URL(`../supabase/migrations/${name}`,import.meta.url),'utf8')).replace(/^begin;$/gm,'').replace(/^commit;$/gm,'')));
await writeFile(new URL('../supabase/setup.sql',import.meta.url),`-- DiscerIA: paste this complete file once into Supabase SQL Editor and click Run.\n-- Atomic setup: failure leaves no partially created application schema.\nbegin;\n${sql.join('\n')}\ncommit;\n`);
console.log('Configuración pública y supabase/setup.sql preparados.');
