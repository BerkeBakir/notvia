-- İstemci rolleri hiçbir tabloda TRUNCATE/TRIGGER/REFERENCES'a ihtiyaç duymaz (RLS'i atlatan TRUNCATE dahil)
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('revoke truncate, trigger, references on public.%I from anon, authenticated', t.tablename);
  end loop;
end $$;
alter default privileges in schema public revoke truncate, trigger, references on tables from anon, authenticated;
