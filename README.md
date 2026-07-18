# Apontamento de Produção — Hao Moto Electric Motors

Este é o projeto "de verdade" do app, pronto para ser hospedado na internet com um link
que você pode mandar no WhatsApp para os funcionários.

Duas coisas mudaram em relação ao protótipo que testamos na conversa:

1. **Hospedagem**: usaremos o **Vercel** (gratuito) para publicar o site.
2. **Banco de dados**: usaremos o **Supabase** (gratuito) para guardar logins e apontamentos
   de verdade, de forma que todos os funcionários (em celulares diferentes) vejam os
   mesmos dados.

Nada disso exige conhecimento técnico avançado — é só seguir os passos abaixo, na ordem.
Cada passo leva menos de 5 minutos.

---

## Passo 1 — Criar sua conta no Supabase (banco de dados)

1. Acesse **https://supabase.com** e clique em **"Start your project"**.
2. Crie uma conta (pode ser com o Google).
3. Clique em **"New project"**.
   - Nome: `apontamento-haomoto` (ou o que preferir)
   - Senha do banco: crie uma senha forte e **guarde em lugar seguro** (não é a senha do app, é só do banco)
   - Região: escolha a mais próxima do Brasil (ex: São Paulo, se disponível)
4. Aguarde alguns minutos até o projeto ficar pronto.

### 1.1 — Rodar o script que cria as tabelas

1. No menu lateral do Supabase, clique em **"SQL Editor"**.
2. Clique em **"New query"**.
3. Abra o arquivo **`supabase/schema.sql`** (está junto com este projeto), copie **tudo**
   e cole no editor.
4. Clique em **"Run"** (ou Ctrl+Enter).
5. Deve aparecer "Success. No rows returned" — pronto, as tabelas foram criadas.

### 1.2 — Desativar a confirmação de email (recomendado para uso interno)

Por padrão, o Supabase manda um email de confirmação antes de liberar o login.
Para o app funcionar como testamos (cadastrou, já consegue entrar), desative isso:

1. Menu lateral → **Authentication** → **Providers** → **Email**.
2. Desmarque a opção **"Confirm email"**.
3. Salve.

*(Se preferir manter a confirmação de email ativada, tudo bem — só que aí o funcionário
vai precisar clicar num link no email dele antes do primeiro login funcionar.)*

### 1.3 — Pegar as chaves de conexão

1. Menu lateral → **Project Settings** (ícone de engrenagem) → **API**.
2. Copie dois valores:
   - **Project URL** (algo como `https://xxxxx.supabase.co`)
   - **anon public key** (uma chave longa)
3. Guarde os dois — vamos usar no Passo 3.

---

## Passo 2 — Colocar o projeto no GitHub

O Vercel publica sites a partir de um repositório do GitHub.

1. Crie uma conta gratuita em **https://github.com** (se ainda não tiver).
2. Clique em **"New repository"**, dê um nome (ex: `apontamento-producao`), deixe como
   **privado**, e crie.
3. Faça upload de todos os arquivos desta pasta do projeto para esse repositório
   (o próprio GitHub tem um botão de "upload files" na página do repositório — você pode
   arrastar a pasta inteira).

---

## Passo 3 — Publicar no Vercel

1. Acesse **https://vercel.com** e crie uma conta (pode entrar direto com o GitHub).
2. Clique em **"Add New..." → "Project"**.
3. Selecione o repositório que você criou no Passo 2.
4. Antes de clicar em "Deploy", abra a seção **"Environment Variables"** e adicione:

   | Nome | Valor |
   |---|---|
   | `VITE_SUPABASE_URL` | o Project URL que você copiou no passo 1.3 |
   | `VITE_SUPABASE_ANON_KEY` | a anon public key que você copiou no passo 1.3 |

5. Clique em **"Deploy"**.
6. Em cerca de 1 minuto, o Vercel te dá um link tipo:
   `https://apontamento-producao.vercel.app`

**Esse é o link que você vai mandar no WhatsApp para os funcionários.**

---

## Passo 4 — Testar

1. Abra o link no seu celular.
2. Toque em **"Cadastro de administrador"**, use o código padrão:
   `HAOMOTO-ADMIN-2026` (recomendo trocar depois, pela própria tela do app).
3. Faça login e teste um apontamento.
4. No navegador do celular, tem a opção **"Adicionar à tela inicial"** (Chrome) ou
   **"Adicionar à Tela de Início"** (Safari/iPhone) — isso cria um ícone do app, como se
   fosse instalado de verdade.

---

## O que ficou diferente do protótipo, por causa da mudança de banco de dados

- **Redefinir senha**: agora funciona por **email de verdade** (o Supabase manda um link
  de redefinição), em vez de trocar a senha na hora. É mais seguro.
- **Excluir funcionário**: por segurança, a conta não é apagada de vez do sistema —
  ela é **desativada** (o funcionário não consegue mais entrar, mas o histórico de
  apontamentos dele continua existindo, para fins de relatório). Isso é o mesmo padrão
  que sistemas de RH costumam usar.
- Tudo o mais (cadastro, apontamento, Excel, cores, logo) continua igual ao que já
  testamos juntos.

---

## Se precisar de ajuda

Qualquer erro que aparecer (login, cadastro, salvar), me manda a mensagem de erro exata
que aparece na tela — ela ajuda bastante a identificar o problema.
