begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('academic-files','academic-files',false,184320,array['application/pdf','image/png','image/jpeg','text/plain'])
on conflict(id) do nothing;

create function private.can_read_file(object_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and (
    split_part(object_name,'/',1)=auth.uid()::text or exists(
      select 1 from public.academic_documents d
      where private.visible(d.owner_id,d.institution,d.audience)
        and jsonb_path_exists(d.payload,'$.**.storagePath ? (@ == $path)',jsonb_build_object('path',object_name))))
$$;
revoke execute on function private.can_read_file(text) from public,anon;
grant execute on function private.can_read_file(text) to authenticated;
create policy academic_files_insert on storage.objects for insert to authenticated
  with check(bucket_id='academic-files' and split_part(name,'/',1)=auth.uid()::text);
create policy academic_files_read on storage.objects for select to authenticated
  using(bucket_id='academic-files' and private.can_read_file(name));
-- Files are immutable after upload; deleting a submitted attachment cannot invalidate a teacher's review.

create function private.validate_task_file() returns trigger language plpgsql security definer set search_path = '' as $$
declare attachment jsonb; object_name text;
begin
  for attachment in select value from jsonb_each(new.payload) where key in ('attachment','material') and value<>'null'::jsonb loop
    object_name=attachment->>'storagePath';
    if object_name is null or not exists(select 1 from storage.objects where bucket_id='academic-files' and name=object_name)
      or not private.can_read_file(object_name) then raise exception 'El archivo no existe o no tienes acceso a él.'; end if;
    if coalesce(length(attachment->>'name'),0) not between 1 and 150 or coalesce(attachment->>'mime','') not in ('application/pdf','image/png','image/jpeg','text/plain')
      or coalesce(attachment->>'base64','')<>'' then raise exception 'Archivo inválido.'; end if;
  end loop;
  return new;
end $$;
revoke execute on function private.validate_task_file() from public,anon,authenticated;
create trigger academic_task_file before insert or update on public.academic_documents
  for each row when(new.kind in ('tarea','submission')) execute function private.validate_task_file();
commit;
