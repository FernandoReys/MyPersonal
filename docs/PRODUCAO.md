# Checklist de integração e produção

Não há autorização automática para publicar ou gerar custos. Este checklist se aplica ao projeto novo My Personal.

## Ambiente e contas

- [ ] Projeto Supabase novo, migração aplicada e backups/recuperação definidos.
- [ ] Variáveis corretas; segredo administrativo e OpenAI somente no servidor.
- [ ] SMTP e confirmação de e-mail testados.
- [ ] Limites financeiros da OpenAI definidos além da cota por usuário.
- [ ] URLs HTTPS e origens de autenticação configuradas.

## Teste com duas contas de desenvolvimento

- [ ] A cria e salva avaliação; recarrega; os dados persistem.
- [ ] B não vê registros de A por API, tabelas ou views.
- [ ] A gera proposta, aprova, registra séries e finaliza; histórico persiste após nova entrada.
- [ ] Duas abas com mesma revisão: segunda gravação recebe conflito 409 sem perder dados.
- [ ] Sem JWT, todas as rotas privadas retornam 401.
- [ ] Consentimento da IA desativado bloqueia chamada; a 21ª tentativa no dia retorna 429.
- [ ] Falha da OpenAI não é apresentada como resposta bem-sucedida.
- [ ] Exclusão de conta remove workspace e uso de IA; JWT antigo não dá acesso.

## Interface e conteúdo

- [ ] Conferir desktop, Android e iPhone; foco, teclado, contraste e leitor de tela.
- [ ] Testar navegador sem WebGL e rede indisponível.
- [ ] Confirmar limites documentados de sessão em memória e normalização do banco.
- [ ] Revisar instruções dos exercícios e critérios de geração com profissional.
- [ ] Publicar política de privacidade completa com identidade e contato do operador.
- [ ] Concluir recuperação de senha e tratamento de expiração de sessão.

## Comandos

```sh
npm ci
npm run typecheck
npm test
npm run build
```

Para envio inicial ao GitHub, revise `git status` e confirme que `.env.local` não aparece entre os arquivos. Não execute migrations em bancos de outros projetos.
