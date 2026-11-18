-- DiscerIA. Run once in Supabase > SQL Editor, as the project administrator.
-- No passwords or service_role keys belong in this migration or in Angular.
begin;
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null check (length(full_name) between 1 and 150),
  institution text not null check (length(institution) between 1 and 200),
  role text not null default 'student' check (role in ('student','professor')),
  requested_role text not null default 'student' check (requested_role in ('student','professor')),
  created_at timestamptz not null default now()
);
create table private.teacher_allowlist (email text primary key, institution text not null);

create function private.register_profile() returns trigger language plpgsql security definer set search_path = '' as $$
declare approved_institution text; school text;
begin
  select institution into approved_institution from private.teacher_allowlist where email = lower(new.email);
  select institution into school from private.teacher_allowlist
    where lower(trim(institution))=lower(trim(new.raw_user_meta_data->>'institution')) limit 1;
  insert into public.profiles(id,email,full_name,institution,role,requested_role)
  values (new.id, lower(new.email), left(coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),'Usuario'),150),
    coalesce(approved_institution,school,left(coalesce(nullif(trim(new.raw_user_meta_data->>'institution'),''),'Comunidad DiscerIA'),200)),
    case when approved_institution is null then 'student' else 'professor' end,
    case when new.raw_user_meta_data->>'requested_role' = 'professor' then 'professor' else 'student' end);
  return new;
end $$;
create trigger disceria_register_profile after insert on auth.users for each row execute function private.register_profile();

-- SQL Editor only. Grant a teacher role without trusting editable Auth metadata.
create function private.approve_teacher(teacher_email text, school text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if length(trim(school)) not between 1 and 200 then raise exception 'Institución inválida'; end if;
  insert into private.teacher_allowlist values(lower(trim(teacher_email)), trim(school))
    on conflict(email) do update set institution = excluded.institution;
  update public.profiles set role='professor',institution=trim(school) where email=lower(trim(teacher_email));
end $$;

create function private.visible(owner_id uuid, school text, audience uuid[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles p where p.id=auth.uid()
    and (owner_id=p.id or (school=p.institution and (audience is null or p.id=any(audience)))))
$$;
create function private.profile_visible(profile_id uuid, school text, user_role text) returns boolean
language sql stable security definer set search_path = '' as $$
  select profile_id=auth.uid() or exists(select 1 from public.profiles p
    where p.id=auth.uid() and p.role='professor' and p.institution=school and user_role='student')
$$;

create table public.academic_documents (
  kind text not null check(kind in ('book','post','exam','message','tarea','submission','student')),
  id text not null check(length(id) between 1 and 300),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  institution text not null,
  audience uuid[], -- NULL = institution-wide; a non-null list is a fixed private audience.
  payload jsonb not null check(jsonb_typeof(payload)='object' and octet_length(payload::text)<=1048576),
  created_at timestamptz not null default now(),
  primary key(kind,id)
);
create index academic_documents_owner on public.academic_documents(owner_id,kind);
create index academic_documents_school on public.academic_documents(institution,kind);
create index academic_documents_audience on public.academic_documents using gin(audience);
create index academic_submissions_task on public.academic_documents((payload->>'tareaId')) where kind='submission';
create table public.academic_notices (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  payload jsonb not null,
  is_read boolean not null default false,
  deleted boolean not null default false,
  created_at timestamptz not null default now()
);
create index academic_notices_recipient on public.academic_notices(recipient_id,created_at desc);
create table public.academic_votes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id text not null, reply_id text not null default '', primary key(user_id,post_id,reply_id)
);
create table private.academic_operations (
  user_id uuid not null references public.profiles(id) on delete cascade,
  id text not null, fingerprint text not null, created_at timestamptz not null default now(), primary key(user_id,id)
);

alter table public.profiles enable row level security;
alter table public.academic_documents enable row level security;
alter table public.academic_notices enable row level security;
alter table public.academic_votes enable row level security;
create policy profiles_read on public.profiles for select to authenticated
  using(private.profile_visible(id,institution,role));
create policy documents_read on public.academic_documents for select to authenticated
  using(private.visible(owner_id,institution,audience));
create policy notices_read on public.academic_notices for select to authenticated using(recipient_id=auth.uid());
create policy votes_read on public.academic_votes for select to authenticated using(exists(
  select 1 from public.academic_documents d where d.kind='post' and d.id=post_id));
revoke all on public.profiles,public.academic_documents,public.academic_notices,public.academic_votes from anon,authenticated;
grant select on public.profiles,public.academic_documents,public.academic_notices,public.academic_votes to authenticated;
-- All mutations go through the transactional, authorized RPC below. Direct client writes are forbidden.

create function private.task_status(task jsonb, submission jsonb) returns text
language sql stable set search_path = '' as $$
  select case when submission->>'status'='requiere_correccion' then 'requiere_correccion'
    when submission->>'grade' is not null then 'calificada'
    when submission->>'submittedAt' is not null then case when submission->>'status'='en_revision' then 'en_revision' else 'entregada' end
    when task->>'dueDate' is not null and (task->>'dueDate')::date < (now() at time zone 'America/Bogota')::date then 'vencida'
    when submission is not null then 'en_progreso' else 'pendiente' end
$$;
create function private.decorate_post(post jsonb) returns jsonb
language sql stable set search_path = '' as $$
  select post || jsonb_build_object('helpfulCount',(select count(*) from public.academic_votes where post_id=post->>'id' and reply_id=''),
    'userHasVotedHelpful',exists(select 1 from public.academic_votes where post_id=post->>'id' and reply_id='' and user_id=auth.uid()),
    'replies',coalesce((select jsonb_agg(reply || jsonb_build_object(
      'helpfulCount',(select count(*) from public.academic_votes where post_id=post->>'id' and reply_id=reply->>'id'),
      'userHasVotedHelpful',exists(select 1 from public.academic_votes where post_id=post->>'id' and reply_id=reply->>'id' and user_id=auth.uid())))
      from jsonb_array_elements(coalesce(post->'replies','[]')) reply),'[]'))
$$;

create function public.academic_snapshot() returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare me public.profiles; task public.academic_documents; task_payload jsonb; mine jsonb; submissions jsonb;
  recipients jsonb; result_tasks jsonb='[]'; roster jsonb='[]'; person public.profiles; progress jsonb; score numeric; grade_count integer;
begin
  select * into me from public.profiles where id=auth.uid();
  if me.id is null then raise exception 'Inicia sesión para acceder a tus contenidos.'; end if;
  if me.role='professor' then
    for person in select * from public.profiles where role='student' and institution=me.institution order by full_name loop
      select payload into progress from public.academic_documents where kind='student' and owner_id=me.id and id=me.id::text || ':' || person.email;
      if coalesce((progress->>'hidden')::boolean,false) then continue; end if;
      select count(*),round(avg((s.payload->>'grade')::numeric / coalesce((s.payload->>'gradeScale')::numeric,(t.payload->>'maxScore')::numeric,5)*100))
        into grade_count,score from public.academic_documents s join public.academic_documents t on t.kind='tarea' and t.id=s.payload->>'tareaId'
        where s.kind='submission' and s.payload->>'studentId'=person.id::text and t.owner_id=me.id and s.payload->>'grade' is not null;
      score=case when grade_count>0 then score else coalesce((progress->>'score')::numeric,0) end;
      roster=roster || jsonb_build_array(jsonb_build_object('id',person.id,'studentName',person.full_name,'email',person.email,
        'topic',coalesce(progress->>'topic','Sin asignar'),'score',score,'status',case when score>=100 then 'completed' when grade_count>0 and score<60 then 'needs-attention' else 'active' end,
        'statusLabel',case when score>=100 then 'Completado' when grade_count>0 and score<60 then 'Requiere Atención' else 'Activo' end));
    end loop;
  end if;
  for task in select * from public.academic_documents where kind='tarea' and (me.role<>'professor' or owner_id=me.id) order by created_at desc loop
    select coalesce(jsonb_agg(payload order by created_at),'[]') into submissions from public.academic_documents
      where kind='submission' and payload->>'tareaId'=task.id;
    select value into mine from jsonb_array_elements(submissions) where
      (me.role='student' and value->>'studentId'=me.id::text) or (me.role='professor' and value->>'submittedAt' is not null) limit 1;
    recipients=null;
    if me.role='professor' then
      select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object('studentId',p.id,'studentName',p.full_name,'email',p.email,
        'submission',s.payload,'status',private.task_status(task.payload,s.payload)))),'[]') into recipients
      from public.profiles p left join public.academic_documents s on s.kind='submission' and s.payload->>'tareaId'=task.id and s.payload->>'studentId'=p.id::text
      where p.role='student' and p.institution=me.institution and (task.audience is null or p.id=any(task.audience));
    end if;
    task_payload=jsonb_strip_nulls((task.payload - 'recipientEmails') || jsonb_build_object('mySubmission',mine,'recipients',recipients,
      'submissions',case when me.role='professor' then submissions else null end,'status',private.task_status(task.payload,mine),
      'submissionsCount',(select count(*) from jsonb_array_elements(submissions) s where s->>'submittedAt' is not null and coalesce(s->>'status','')<>'requiere_correccion')));
    result_tasks=result_tasks || jsonb_build_array(task_payload);
  end loop;
  return jsonb_build_object(
    'books',coalesce((select jsonb_agg(payload order by created_at desc) from public.academic_documents where kind='book'),'[]'),
    'posts',coalesce((select jsonb_agg(private.decorate_post(payload) order by created_at desc) from public.academic_documents where kind='post'),'[]'),
    'exams',coalesce((select jsonb_agg(payload order by created_at desc) from public.academic_documents where kind='exam'),'[]'),
    'messages',coalesce((select jsonb_agg(payload order by created_at desc) from public.academic_documents where kind='message'),'[]'),
    'tareas',result_tasks,'students',roster,
    'notifications',coalesce((select jsonb_agg(payload || jsonb_build_object('id',id,'read',is_read) order by created_at desc)
      from public.academic_notices where not deleted),'[]'));
end $$;

create function private.send_notice(actor public.profiles, recipients uuid[], notice_type text, title text, message text, route text) returns void
language sql security definer set search_path = '' as $$
  insert into public.academic_notices(recipient_id,payload)
    select distinct recipient,jsonb_build_object('type',notice_type,'title',title,'message',message,
      'authorName',actor.full_name,'authorRole',actor.role,'authorInitials',upper(left(actor.full_name,2)),
      'timeAgo','Hace un momento','actionRoute',route,'createdAt',now())
    from unnest(recipients) recipient where recipient<>actor.id
$$;

create function public.academic_mutate(event jsonb) returns jsonb language plpgsql security definer set search_path = '' as $$
declare me public.profiles; operation text; event_id text; p jsonb; doc public.academic_documents; task public.academic_documents;
  data jsonb; author jsonb; audience_ids uuid[]; target uuid; target_email text; reply_id text; submission_id text;
  grade numeric; feedback text; old_fingerprint text; item jsonb; student_record jsonb;
begin
  select * into me from public.profiles where id=auth.uid();
  if me.id is null then raise exception 'Inicia sesión para guardar.'; end if;
  operation=event->>'type'; p=event->'payload'; event_id=event->>'id';
  if operation is null or jsonb_typeof(p) is distinct from 'object' or event_id is null or length(event_id)>100 or octet_length(event::text)>1048576 then raise exception 'Contenido inválido.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(me.id::text,0));
  select fingerprint into old_fingerprint from private.academic_operations where user_id=me.id and id=event_id;
  if old_fingerprint is not null then
    if old_fingerprint<>md5(event::text) then raise exception 'El identificador ya pertenece a otra operación.'; end if;
    return jsonb_build_object('ok',true);
  end if;
  if operation=any(array['book.publish','book.recommend','exam.publish','message.publish','student.upsert','student.remove','tarea.publish','tarea.delete','tarea.grade','tarea.review','tarea.correction']) and me.role<>'professor' then
    raise exception 'Esta acción solo está disponible para docentes.';
  end if;
  select coalesce(array_agg(id),'{}') into audience_ids from public.profiles where institution=me.institution and role='student';
  author=jsonb_build_object('id',me.id,'name',me.full_name,'role',me.role,'institution',me.institution,'initials',upper(left(me.full_name,2)));

  if operation in ('book.publish','post.publish','exam.publish','tarea.publish') then
    if coalesce(length(trim(p->>'id')),0) not between 1 and 200 or coalesce(length(trim(p->>'title')),0) not between 1 and 150 then raise exception 'Revisa el título y el identificador.'; end if;
    select * into doc from public.academic_documents where kind=split_part(operation,'.',1) and id=p->>'id' for update;
    if doc.id is not null and doc.owner_id<>me.id then raise exception 'Solo el autor puede modificar este contenido.'; end if;
    if operation='tarea.publish' and doc.id is not null then raise exception 'La tarea ya está publicada. No se pueden cambiar sus destinatarios.'; end if;
    data=p - array['ownerId','audience','submissions','mySubmission','recipients'];
    if operation='post.publish' then
      if coalesce(length(trim(p->>'content')),0) not between 1 and 10000 then raise exception 'Escribe el contenido de la publicación.'; end if;
      data=data || jsonb_build_object('author',author,'createdAt',now(),'replies',coalesce(doc.payload->'replies','[]'),'repliesCount',coalesce(jsonb_array_length(doc.payload->'replies'),0),
        'helpfulCount',0,'viewsCount',0,'isUnanswered',coalesce(jsonb_array_length(doc.payload->'replies'),0)=0,'isTeacherVerified',me.role='professor');
      audience_ids=null;
    elsif operation='book.publish' then
      if coalesce(length(trim(p->>'description')),0) not between 1 and 10000 then raise exception 'Escribe una descripción.'; end if;
      perform private.send_notice(me,audience_ids,'teacher_announcement','Nuevo recurso: ' || (p->>'title'),p->>'description','/biblioteca');
      audience_ids=null;
    elsif operation='exam.publish' then
      data=data || jsonb_build_object('authorName',me.full_name,'createdAt',now());
      perform private.send_notice(me,audience_ids,'exam','Nuevo examen: ' || (p->>'title'),coalesce(p->>'instructions',p->>'topic','Consulta la evaluación.'),'/estudiante');
      audience_ids=null;
    else
      if coalesce(length(trim(p->>'description')),0) not between 1 and 10000 then raise exception 'Escribe la consigna.'; end if;
      if coalesce(p->>'dueDate','') !~ '^\d{4}-\d{2}-\d{2}$' or (p->>'dueDate')::date < (now() at time zone 'America/Bogota')::date then raise exception 'Selecciona una fecha vigente.'; end if;
      if p ? 'recipientEmails' and jsonb_typeof(p->'recipientEmails')='array' then
        select coalesce(array_agg(id),'{}') into audience_ids from public.profiles where institution=me.institution and role='student'
          and email in (select lower(trim(value)) from jsonb_array_elements_text(p->'recipientEmails'));
        if cardinality(audience_ids)<>jsonb_array_length(p->'recipientEmails') then raise exception 'Los destinatarios deben estar registrados en tu institución.'; end if;
      end if;
      if cardinality(audience_ids)=0 then raise exception 'No hay estudiantes registrados para asignar esta tarea.'; end if;
      data=data || jsonb_build_object('maxScore',5,'assignedBy',me.full_name,'assignedDate',(now() at time zone 'America/Bogota')::date,'status','pendiente','submissionsCount',0,
        'recipientEmails',(select jsonb_agg(email) from public.profiles where id=any(audience_ids)));
      perform private.send_notice(me,audience_ids,'task','Nueva tarea: ' || (p->>'title'),p->>'description','/tareas');
    end if;
    insert into public.academic_documents(kind,id,owner_id,institution,audience,payload)
      values(split_part(operation,'.',1),p->>'id',me.id,me.institution,audience_ids,data)
      on conflict(kind,id) do update set payload=excluded.payload where academic_documents.owner_id=excluded.owner_id;
    if not found then raise exception 'Solo el autor puede modificar este contenido.'; end if;

  elsif operation in ('tarea.draft','tarea.submit') then
    if me.role<>'student' then raise exception 'Solo los estudiantes pueden entregar tareas.'; end if;
    select * into task from public.academic_documents where kind='tarea' and id=p->>'tareaId' for update;
    if task.id is null or not private.visible(task.owner_id,task.institution,task.audience) then raise exception 'No tienes asignada esta tarea.'; end if;
    submission_id=task.id || ':' || me.id::text;
    select * into doc from public.academic_documents where kind='submission' and id=submission_id for update;
    if doc.payload->>'submittedAt' is not null and coalesce(doc.payload->>'status','')<>'requiere_correccion' then raise exception 'La entrega está cerrada. El docente debe autorizar una corrección.'; end if;
    if coalesce((doc.payload->>'revision')::integer,0)<>coalesce((p->>'revision')::integer,0) then raise exception 'Hay cambios más recientes. Recarga antes de guardar.'; end if;
    if (task.payload->>'dueDate')::date < (now() at time zone 'America/Bogota')::date and coalesce(doc.payload->>'status','')<>'requiere_correccion' then raise exception 'El plazo de esta tarea ha vencido.'; end if;
    if jsonb_typeof(p->'content') is distinct from 'string' or length(p->>'content')>10000 or (operation='tarea.submit' and length(trim(p->>'content'))=0) then raise exception 'Escribe una respuesta válida.'; end if;
    if p->>'attachmentUrl' is not null and p->>'attachmentUrl' !~ '^https://' then raise exception 'El enlace debe usar HTTPS.'; end if;
    data=jsonb_strip_nulls(jsonb_build_object('id',submission_id,'tareaId',task.id,'studentId',me.id,'studentName',me.full_name,
      'content',p->>'content','attachment',p->'attachment','attachmentUrl',p->>'attachmentUrl','comments',left(p->>'comments',500),
      'revision',coalesce((doc.payload->>'revision')::integer,0)+1,'updatedAt',now(),
      'status',case when operation='tarea.submit' then 'entregada' when doc.payload->>'status'='requiere_correccion' then 'requiere_correccion' else 'en_progreso' end,
      'submittedAt',case when operation='tarea.submit' then to_jsonb(now()) else null end,
      'feedback',case when operation='tarea.draft' then doc.payload->>'feedback' else null end,
      'history',coalesce(doc.payload->'history','[]') || case when doc.id is not null then jsonb_build_array(doc.payload - 'history') else '[]' end));
    insert into public.academic_documents(kind,id,owner_id,institution,audience,payload)
      values('submission',submission_id,me.id,me.institution,array[me.id,task.owner_id],data)
      on conflict(kind,id) do update set payload=excluded.payload;
    if operation='tarea.submit' then perform private.send_notice(me,array[task.owner_id],'task','Nueva entrega: ' || (task.payload->>'title'),me.full_name || ' envió su actividad.','/tareas'); end if;

  elsif operation in ('tarea.grade','tarea.review','tarea.correction') then
    select * into doc from public.academic_documents where kind='submission' and id=p->>'submissionId' for update;
    select * into task from public.academic_documents where kind='tarea' and id=doc.payload->>'tareaId';
    if doc.id is null or task.owner_id<>me.id or task.id is null then raise exception 'No puedes gestionar esta entrega.'; end if;
    if p ? 'revision' and (p->>'revision')::integer<>coalesce((doc.payload->>'revision')::integer,0) then raise exception 'La entrega cambió. Recarga antes de calificar.'; end if;
    if doc.payload->>'submittedAt' is null or doc.payload->>'status'='requiere_correccion' then raise exception 'Solo puedes revisar entregas definitivas.'; end if;
    if operation='tarea.review' and doc.payload->>'grade' is not null then raise exception 'La entrega ya está calificada.'; end if;
    if operation='tarea.grade' then
      if jsonb_typeof(p->'grade') is distinct from 'number' then raise exception 'La calificación debe ser numérica.'; end if;
      grade=(p->>'grade')::numeric;
      if grade<1 or grade>5 or round(grade,1)<>grade then raise exception 'La calificación debe estar entre 1.0 y 5.0, con un decimal.'; end if;
    end if;
    feedback=case when operation='tarea.review' then doc.payload->>'feedback' else trim(p->>'feedback') end;
    if operation<>'tarea.review' and coalesce(length(feedback),0) not between 1 and 2000 then raise exception 'Escribe comentarios sobre la entrega.'; end if;
    data=doc.payload - array['grade','gradeScale','gradedAt'];
    if doc.payload->>'grade' is not null then data=jsonb_set(data,'{history}',coalesce(data->'history','[]') || jsonb_build_array(doc.payload - 'history')); end if;
    data=jsonb_strip_nulls(data || jsonb_build_object('status',case when operation='tarea.grade' then 'calificada' when operation='tarea.review' then 'en_revision' else 'requiere_correccion' end,
      'grade',grade,'gradeScale',case when operation='tarea.grade' then 5 else null end,'feedback',feedback,
      'gradedAt',case when operation='tarea.grade' then to_jsonb(now()) else null end,'revision',coalesce((doc.payload->>'revision')::integer,0)+1));
    update public.academic_documents set payload=data where kind=doc.kind and id=doc.id;
    perform private.send_notice(me,array[doc.owner_id],'task',case when operation='tarea.grade' then 'Tu tarea ha sido calificada' when operation='tarea.review' then 'Tu tarea está en revisión' else 'Tu tarea requiere corrección' end,
      case when operation='tarea.grade' then 'Nota: ' || to_char(grade,'FM0.0') || ' / 5.0. ' || feedback else coalesce(feedback,'Consulta el estado de tu entrega.') end,'/tareas');

  elsif operation='tarea.delete' then
    select * into doc from public.academic_documents where kind='tarea' and id=p->>'id' for update;
    if doc.owner_id<>me.id or doc.id is null then raise exception 'No puedes eliminar esta tarea.'; end if;
    delete from public.academic_documents where kind='submission' and payload->>'tareaId'=doc.id;
    delete from public.academic_documents where kind='tarea' and id=doc.id;

  elsif operation in ('post.reply','post.vote') then
    select * into doc from public.academic_documents where kind='post' and id=p->>'postId' for update;
    if doc.id is null or not private.visible(doc.owner_id,doc.institution,doc.audience) then raise exception 'No tienes acceso a esta publicación.'; end if;
    reply_id=coalesce(p->>'replyId','');
    if operation='post.vote' then
      if reply_id<>'' and not exists(select 1 from jsonb_array_elements(doc.payload->'replies') r where r->>'id'=reply_id) then raise exception 'La respuesta no existe.'; end if;
      delete from public.academic_votes v where v.user_id=me.id and v.post_id=doc.id and v.reply_id=coalesce(p->>'replyId','');
      if (p->>'voted')::boolean then insert into public.academic_votes values(me.id,doc.id,reply_id); end if;
    else
      if coalesce(length(trim(p->>'content')),0) not between 1 and 10000 or coalesce(length(p->>'id'),0) not between 1 and 200 then raise exception 'Escribe una respuesta válida.'; end if;
      if exists(select 1 from jsonb_array_elements(doc.payload->'replies') r where r->>'id'=p->>'id') then raise exception 'La respuesta ya existe.'; end if;
      item=jsonb_build_object('id',p->>'id','content',p->>'content','author',author,'createdAt',now(),'helpfulCount',0,
        'isTeacherVerified',me.role='professor' and coalesce((p->>'isTeacherVerified')::boolean,false));
      update public.academic_documents set payload=payload || jsonb_build_object('replies',payload->'replies' || jsonb_build_array(item),
        'repliesCount',jsonb_array_length(payload->'replies')+1,'isUnanswered',false) where kind='post' and id=doc.id;
      perform private.send_notice(me,array[doc.owner_id],'forum_reply','Nueva respuesta: ' || (doc.payload->>'title'),p->>'content','/foro');
    end if;

  elsif operation='message.publish' then
    if coalesce(length(trim(p->>'subject')),0) not between 1 and 200 or coalesce(length(trim(p->>'message')),0) not between 1 and 10000 then raise exception 'Escribe el asunto y el mensaje.'; end if;
    if p->>'targetGroup' not in ('all','active','needs-attention') then raise exception 'Grupo inválido.'; end if;
    select coalesce(array_agg((s->>'id')::uuid),'{}') into audience_ids from jsonb_array_elements(public.academic_snapshot()->'students') s
      where p->>'targetGroup'='all' or s->>'status'=p->>'targetGroup';
    if cardinality(audience_ids)=0 then raise exception 'No hay estudiantes registrados en ese grupo.'; end if;
    insert into public.academic_documents values('message',coalesce(p->>'id',gen_random_uuid()::text),me.id,me.institution,audience_ids,
      (p - array['audience','ownerId']) || jsonb_build_object('id',coalesce(p->>'id',event_id),'authorName',me.full_name,'createdAt',now()),now());
    if coalesce((p->>'sendToForums')::boolean,false) then
      insert into public.academic_documents values('post','message-' || event_id,me.id,me.institution,audience_ids,
        jsonb_build_object('id','message-' || event_id,'title',p->>'subject','content',p->>'message','author',author,'subject','General',
          'createdAt',now(),'helpfulCount',0,'viewsCount',0,'repliesCount',0,'replies','[]'::jsonb,'isUnanswered',true,'isTeacherVerified',true),now());
    end if;
    perform private.send_notice(me,audience_ids,'teacher_announcement',p->>'subject',p->>'message','/estudiante');

  elsif operation='book.recommend' then
    select * into doc from public.academic_documents where kind='book' and id=p->>'id';
    if doc.id is null or not private.visible(doc.owner_id,doc.institution,doc.audience) then raise exception 'No tienes acceso a este recurso.'; end if;
    perform private.send_notice(me,audience_ids,'teacher_announcement','Lectura recomendada: ' || (doc.payload->>'title'),doc.payload->>'description','/biblioteca');

  elsif operation in ('student.upsert','student.remove') then
    target_email=lower(trim(p->>'email'));
    select id into target from public.profiles where email=target_email and role='student' and institution=me.institution;
    if target is null then raise exception 'El estudiante debe registrarse primero en tu institución.'; end if;
    data=case when operation='student.remove' then jsonb_build_object('hidden',true) else p - array['ownerId','audience'] end;
    insert into public.academic_documents(kind,id,owner_id,institution,audience,payload) values('student',me.id::text || ':' || target_email,me.id,me.institution,'{}',data)
      on conflict(kind,id) do update set payload=excluded.payload;

  elsif operation='notice.receipt' then
    update public.academic_notices set is_read=coalesce((p->>'read')::boolean,false),deleted=coalesce((p->>'deleted')::boolean,false)
      where id=(p->>'id')::uuid and recipient_id=me.id;
    if not found then raise exception 'No puedes acceder a este aviso.'; end if;
  else raise exception 'Acción académica desconocida.';
  end if;
  insert into private.academic_operations values(me.id,event_id,md5(event::text),now());
  return jsonb_build_object('ok',true);
end $$;

-- RPC calls and table reads require a Supabase Auth session.
revoke execute on all functions in schema private from public,anon,authenticated;
grant execute on function private.visible(uuid,text,uuid[]),private.profile_visible(uuid,text,text),
  private.task_status(jsonb,jsonb),private.decorate_post(jsonb) to authenticated;
revoke execute on function public.academic_snapshot(),public.academic_mutate(jsonb) from public,anon;
grant execute on function public.academic_snapshot(),public.academic_mutate(jsonb) to authenticated;
commit;
