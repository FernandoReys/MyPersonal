# My Personal

Versão de desenvolvimento de uma aplicação de acompanhamento de musculação, em português. Next.js App Router + TypeScript + Supabase + Three.js + OpenAI Responses API.

**Esta entrega não é a plataforma completa do briefing nem um produto validado para produção.** O código inclui fluxos reais de persistência e autenticação, mas nenhum projeto Supabase foi provisionado e nenhuma chamada paga de IA foi feita. Sem configuração, biblioteca e modelo 3D estão disponíveis; salvar dados exige uma conta conectada.

## Abrir no VS Code — Windows

Requer Node.js 24 LTS e npm. Extraia o ZIP em uma pasta nova e abra **essa pasta** no VS Code. O `package.json` fica na raiz da pasta extraída. Execute no terminal:

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Abra `http://localhost:3000`. Para verificar a versão de produção:

```powershell
npm run typecheck
npm test
npm run build
npm start
```

`npm start` requer um build concluído; não execute `dev` e `start` na mesma porta. As fontes remotas têm fallback local. Dados de usuários não são incluídos no ZIP.

## Configurar Supabase

1. Crie **um projeto novo e exclusivo para My Personal**. Não execute esta migração no banco de Opera360, CoinReys ou outros sistemas.
2. No SQL Editor, execute `supabase/migrations/001_initial.sql` uma única vez. Ela é transacional e cria tabelas, funções, views e políticas.
3. Em `.env.local`, preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` com a URL e a chave pública do projeto.
4. Ative autenticação por e-mail/senha; configure a URL do site para `http://localhost:3000` em desenvolvimento e a URL HTTPS do domínio em produção. Configure o envio de e-mail antes de abrir cadastros ao público.
5. Para permitir exclusão de conta, defina `SUPABASE_SERVICE_ROLE_KEY` **somente no servidor**. Nunca adicione prefixo `NEXT_PUBLIC_` a esta chave.
6. Reinicie o servidor. Cadastre-se, confirme o e-mail se exigido, entre e preencha a avaliação.

A autorização é validada no servidor com `getUser`. Não há dados privados embarcados na página pública. RLS limita a leitura ao usuário autenticado; funções de gravação derivam o dono de `auth.uid()`, sem aceitar ID arbitrário de usuário.

## Configurar My Personal AI

Defina no servidor:

```dotenv
OPENAI_API_KEY=
OPENAI_MODEL=
```

Escolha um modelo que esteja disponível em seu projeto OpenAI e aceite a Responses API. A chave não deve ser colada em código ou enviada a repositórios. Configure também limites de gasto no painel do provedor.

O chat requer avaliação salva e consentimento específico. Até 20 tentativas por usuário por dia UTC, com contagem atômica em PostgreSQL. Tentativas que falham após consumir a cota também contam. Cada resposta tem teto de 1.600 tokens e timeout de 45 segundos. `store: false` é enviado à API, mas isso não equivale a garantia universal de retenção zero pelo provedor.

O agente recebe contexto de avaliação sem nome, observações médicas livres ou histórico livre, além de plano, últimas sessões e últimas mensagens. **Mensagens e preferências ainda podem conter informações pessoais digitadas pelo usuário.** A interface explica o consentimento. O agente consulta o catálogo via contexto, não executa ferramentas de escrita, não pesquisa a web em tempo real e não altera planos sozinho.

O gerador inicial de fichas é **baseado em regras**, separado do chat. Não é apresentado como geração por IA. Integração de planos estruturados gerados pela IA continua pendente.

## Fluxo disponível após configuração

Cadastro → avaliação → gerar proposta → revisar e aprovar → iniciar treino → registrar séries → finalizar → consultar histórico/evolução.

- Dashboard sem usuários ou resultados fictícios.
- Biblioteca inicial de 15 exercícios, com instruções em texto e filtros por grupo, equipamento/movimento via busca.
- Modelo anatômico 3D com rotação, zoom, vistas frontal, posterior e lateral e seleção de seis grupos. A seleção é por regiões gerais; não é uma delimitação clínica precisa.

- Avaliação com 18 tópicos e consentimentos.
- Propostas Full Body ou Upper/Lower, conforme regras documentadas no código.
- Edição da quantidade de séries; registro de carga, repetições e RPE; cronômetro de descanso.
- Histórico de sessões e volume externo; peso e cintura; gráfico de peso.
- Ciclos de 4 a 8 semanas, recomendações simples de revisão sem aumento automático de carga.
- Exportação JSON, exclusão de conta e tema escuro.
- Manifest e service worker de PWA. Sem conexão, mostra página explicativa; **não sincroniza treinos offline**.

### Modelo anatômico 3D

Écorché (https://github.com/Charleeh/ecorche), CC BY-SA 4.0. Baseado em BodyParts3D, © The Database Center for Life Science, CC BY 4.0, e Z-Anatomy por Gauthier Kervyn, CC BY-SA 4.0. O arquivo `public/anatomy/ecorche.meshopt.glb` é distribuído sob [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). O aplicativo oculta a camada profunda, destaca grupos por cor e permite selecionar malhas superficiais; o arquivo original não foi alterado. Este recurso é educacional e não deve ser usado como ferramenta de diagnóstico.

## Arquitetura

- `src/app`: layout, entrada e endpoints autenticados.
- `src/components`: interface principal, avaliação, ficha, registro de séries, gráfico e anatomia.
- `src/lib/catalog.ts`: catálogo editorial de exercícios, grupos e referências.
- `src/lib/training.ts`: gerador determinístico e indicadores.
- `src/lib/schemas.ts`: validação de entradas e registros.
- `src/lib/server.ts`: autenticação, erros e leitura de requisições.
- `supabase/migrations`: migração PostgreSQL.
- `tests`: regras de treino, validação e segurança da migração em PGlite.
- `docs`: relatório e checklist de implantação.

### Decisão provisória do banco

Esta versão armazena o estado de cada usuário em uma linha JSONB (`user_workspaces`), com número de revisão para evitar sobrescrita concorrente. Views com `security_invoker` expõem avaliação, plano, sessões e medidas respeitando RLS. `ai_usage` controla a cota.

Isso é persistência real em PostgreSQL, **mas ainda não corresponde à modelagem relacional completa pedida no briefing**. Não há tabelas independentes de exercício, foto, recomendação ou série, nem paginação do histórico. Limites atuais: 1 MB por estado, 2.000 sessões, 2.000 medidas e 200 mensagens. Antes de escalar, normalizar as entidades e substituir gravações de documento inteiro por operações específicas.

## Limitações importantes

Leia `docs/RELATORIO.md`. Entre as pendências: modelo anatômico detalhado licenciado, vídeos/animações de execução, fotos privadas, divisões ABC/ABCD/ABCDE/PPL, calendário semanal, geração/revisão estruturada por IA, avaliações científicas e clínicas mais completas, testes reais de login e persistência, recuperação de senha, revisão jurídica e operacional de privacidade.

Uma sessão em andamento fica em memória até a finalização. Não feche a página durante o treino. O navegador recebe um aviso ao sair; em celulares isso não garante recuperação. Não há aplicação nativa Android/iOS.

## Publicar no GitHub e Vercel

**Nenhum repositório ou deploy foi criado nesta entrega.** Após sua aprovação:

1. Crie um repositório novo; mantenha `.env.local`, `node_modules` e `.next` fora do Git.
2. Importe o repositório na Vercel, framework Next.js, Node.js 24.
3. Configure as variáveis na Vercel, com Supabase separado para testes quando possível.
4. Execute o checklist de `docs/PRODUCAO.md` no preview.
5. Atualize URLs de autenticação no Supabase para o domínio aprovado.
6. Publique somente após testar o ciclo completo com duas contas e revisar o conteúdo de exercícios com profissional habilitado.

O código usa CSS próprio em vez de Tailwind nesta primeira versão. As fronteiras HTTP e tipos compartilhados permitem evolução futura para cliente mobile, mas o aplicativo nativo não foi implementado.
