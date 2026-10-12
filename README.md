# Controladoria Avançada & FP&A

Plataforma de ensino prática (site estático) com login, 10 módulos, laboratório com campos e fórmulas, exercícios com conferência automática e estudos de caso de tomada de decisão.

> Todos os dados, empresas e valores usados nos exemplos são fictícios. Os casos reais citados são resumos simplificados de episódios públicos: confira as fontes antes de citá-los.

## Estrutura

```
controladoria-fpa/
├── index.html          # página única: login e sistema
├── css/style.css       # estilos
├── js/app.js           # lógica, conteúdo dos módulos, fórmulas e casos
└── assets/
    ├── fundo-login.jpg # foto de fundo da tela de login
    └── logo.png        # logo exibida no cabeçalho
```

Não há dependências nem etapa de build. A única chamada externa é a fonte Montserrat (Google Fonts); sem internet o site usa uma fonte padrão.

## Como publicar no GitHub Pages

1. Crie um repositório no GitHub (por exemplo, `controladoria-fpa`).
2. Envie todos os arquivos desta pasta para a raiz do repositório (botão **Add file > Upload files**, ou `git push`).
3. Vá em **Settings > Pages**.
4. Em **Build and deployment**, escolha **Deploy from a branch**, selecione a branch `main` e a pasta `/ (root)`, e clique em **Save**.
5. Depois de alguns minutos, o site fica em `https://SEU-USUARIO.github.io/controladoria-fpa/`.

Para rodar localmente, abra o `index.html` no navegador.

## Como testar

No primeiro acesso, digite um login e uma senha (mínimo 4 caracteres): a conta é criada no seu navegador. Exemplo: login `aluno`, senha `curso2026`.

## Onde editar o conteúdo

Tudo fica em `js/app.js`:

| Constante | O que contém |
| --- | --- |
| `F` | Campos do cadastro de empresa |
| `D` | Fórmulas dos resultados (derivadas dos campos) |
| `M` | Os 10 módulos: texto de ajuda, campos do laboratório, resultados, análise e estudo de caso |
| `L` | Carga horária, objetivo e conceitos de cada módulo |
| `R` | Caso real que inspirou cada estudo de caso |
| `DS` e `RS` | Significado e fórmula de cada campo e de cada resultado |

## Aviso importante sobre o login

O login é **local e não seguro**. As contas e o progresso ficam no `localStorage` do navegador de cada pessoa. Isso significa que:

- qualquer pessoa com o link pode criar uma conta;
- não há lista de alunos matriculados nem recuperação de senha;
- os dados não são compartilhados entre aparelhos.

Para controlar matrículas de verdade, é preciso ligar o site a um back-end de autenticação (por exemplo, Firebase Auth, Supabase ou a sua plataforma de ensino).

## Uso

Material de ensino da Target Treinamentos On-line. Defina a licença de uso antes de tornar o repositório público.
