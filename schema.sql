-- ============================================================
-- Apontamento de Produção — schema do banco de dados (Supabase)
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em RUN.
-- ============================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------
-- 1) PERFIS (papel do usuário: funcionario ou admin)
-- ---------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'funcionario' check (role in ('funcionario', 'admin')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "usuario_ve_proprio_perfil"
  on profiles for select
  using (auth.uid() = id);

create policy "admin_ve_todos_perfis"
  on profiles for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ---------------------------------------------------------------
-- 2) CONFIG (código secreto do administrador)
-- ---------------------------------------------------------------
create table if not exists config (
  id int primary key default 1,
  codigo_admin text not null default 'HAOMOTO-ADMIN-2026'
);

insert into config (id, codigo_admin)
values (1, 'HAOMOTO-ADMIN-2026')
on conflict (id) do nothing;

alter table config enable row level security;
-- Ninguém lê a tabela config diretamente (nem o código fica exposto) —
-- toda a checagem é feita dentro das funções abaixo (security definer).

-- ---------------------------------------------------------------
-- 3) APONTAMENTOS
-- ---------------------------------------------------------------
create table if not exists apontamentos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  data date not null default current_date,
  hora_inicio text,
  hora_fim text,
  cd_nome text,
  nome_montador text,
  tipo_servico text,
  modelo text,
  cor text,
  motor text,
  chassi text,
  anomalia text,
  usuario_email text,
  user_id uuid references auth.users(id)
);

alter table apontamentos enable row level security;

create policy "usuario_insere_proprio_apontamento"
  on apontamentos for insert
  with check (auth.uid() = user_id);

create policy "admin_ve_todos_apontamentos"
  on apontamentos for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ---------------------------------------------------------------
-- 4) FUNÇÃO: criar perfil automaticamente ao cadastrar (sempre como funcionário)
-- ---------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, email, role) values (new.id, new.email, 'funcionario');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------
-- 5) FUNÇÃO: virar administrador (exige o código atual)
-- ---------------------------------------------------------------
create or replace function tornar_admin(codigo text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  codigo_atual text;
begin
  select codigo_admin into codigo_atual from config where id = 1;
  if codigo is null or codigo <> codigo_atual then
    return false;
  end if;
  update profiles set role = 'admin' where id = auth.uid();
  return true;
end;
$$;

grant execute on function tornar_admin(text) to authenticated;

-- ---------------------------------------------------------------
-- 6) FUNÇÃO: trocar o código do administrador (exige o código atual)
-- ---------------------------------------------------------------
create or replace function trocar_codigo_admin(codigo_atual_informado text, novo_codigo text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  codigo_atual text;
begin
  select codigo_admin into codigo_atual from config where id = 1;
  if codigo_atual_informado is null or codigo_atual_informado <> codigo_atual then
    return false;
  end if;
  if novo_codigo is null or length(novo_codigo) < 6 then
    return false;
  end if;
  update config set codigo_admin = novo_codigo where id = 1;
  return true;
end;
$$;

grant execute on function trocar_codigo_admin(text, text) to anon, authenticated;

-- ---------------------------------------------------------------
-- 7) FUNÇÃO: desativar funcionário (só um admin pode chamar)
--    Obs.: por segurança do lado do banco, a conta não é apagada
--    do sistema de autenticação (isso exige a service_role key,
--    que nunca deve ficar no aplicativo do celular). Em vez disso,
--    a conta é marcada como inativa e o login passa a ser bloqueado.
-- ---------------------------------------------------------------
create or replace function desativar_funcionario(email_alvo text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  eh_admin boolean;
  alvo_id uuid;
begin
  select (role = 'admin') into eh_admin from profiles where id = auth.uid();
  if not eh_admin then
    return false;
  end if;

  select id into alvo_id from profiles where email = email_alvo;
  if alvo_id is null then
    return false;
  end if;

  update profiles set active = false where id = alvo_id;
  return true;
end;
$$;

grant execute on function desativar_funcionario(text) to authenticated;

-- ============================================================
-- Fim do schema. Depois de rodar isto uma vez, não precisa rodar de novo.
-- ============================================================
