begin;
-- Authorized by the project owner. This is the only initially approved teacher account.
select private.approve_teacher('juan17patino@gmail.com','Universidad Cooperativa de Colombia');
alter table private.teacher_allowlist enable row level security;
alter table private.academic_operations enable row level security;
alter table private.ai_quota enable row level security;
revoke all on private.teacher_allowlist,private.academic_operations,private.ai_quota from public,anon,authenticated;
commit;
