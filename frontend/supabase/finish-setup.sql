-- Safe follow-up for projects that already ran setup.sql. Does not delete or recreate tables.
begin;
do $$
declare definition text;
begin
  definition=pg_get_functiondef('public.academic_mutate(jsonb)'::regprocedure);
  definition=replace(definition,'jsonb_typeof(p)<>''object''','jsonb_typeof(p) is distinct from ''object''');
  definition=replace(definition,'jsonb_typeof(p->''content'')<>''string''','jsonb_typeof(p->''content'') is distinct from ''string''');
  definition=replace(definition,'jsonb_typeof(p->''grade'')<>''number''','jsonb_typeof(p->''grade'') is distinct from ''number''');
  execute definition;
end $$;
notify pgrst, 'reload config';
notify pgrst, 'reload schema';
commit;
select to_regclass('public.profiles') as profiles,
       to_regprocedure('public.academic_snapshot()') as snapshot,
       (select count(*) from private.teacher_allowlist where email='juan17patino@gmail.com') as authorized_teacher;
