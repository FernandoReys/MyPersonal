# Relatório de entrega — versão 0.1.0

## Implementado em código

| Área         | Entrega                                                                    | Limite atual                                                         |
| ------------ | -------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Interface    | Dez áreas de navegação, temas, layouts responsivos, estados vazios e erros | Verificação visual completa desktop/celular pendente                 |
| Autenticação | Cadastro, entrada e saída com Supabase                                     | Requer projeto, e-mail e credenciais; recuperação de senha pendente  |
| Avaliação    | Formulário com objetivos, rotina, equipamentos e consentimentos            | Não é entrevista conversacional por IA nem avaliação clínica         |
| Treino       | Proposta Full Body/Upper-Lower, aprovação e edição de séries               | Não inclui todas as divisões, substituição livre ou calendário       |
| Execução     | Séries, kg, reps, RPE e descanso; finalização e histórico                  | Sessão não finalizada não é persistida                               |
| IA           | Endpoint real Responses, contexto, consentimento e cota                    | Não foi chamado com chave real; não gera planos estruturados         |
| Anatomia     | Malhas 3D originais selecionáveis por grupo, zoom e vistas                 | Modelo esquemático; subdivisões só textuais                          |
| Biblioteca   | 15 exercícios e instruções em português                                    | Sem vídeo, animação ou revisão profissional completa                 |
| Evolução     | Medidas, gráfico de peso, histórico e volume                               | Fotos, gráficos por exercício, recordes e simulação visual pendentes |
| Periodização | 4–8 semanas e triagem simples do histórico                                 | Não é algoritmo de periodização clínica/avançada                     |
| Banco        | Migração com RLS, RPC transacional, controle de revisão                    | JSONB por usuário; normalização completa pendente                    |
| Privacidade  | Consentimento, exportação e exclusão                                       | Não é certificação LGPD; política operacional completa pendente      |
| PWA          | Manifest, ícones e página offline                                          | Sem gravação offline, push ou binários de loja                       |

## Verificação

- Verificação concluída em 29/10/2026: `npm run typecheck` aprovado; `npm test` com **11 testes aprovados**; `npm run build` aprovado (Next.js 16.4.3).
- Testes de regras: limites de elegibilidade, equipamento, recuperação, divisão, volume e desconforto.
- Testes de validação: carga negativa, repetições fracionárias, esforço impossível, identificador inexistente, papel de sistema e texto excessivo.
- Teste PostgreSQL embarcado (PGlite): execução da migração, isolamento de duas identidades, views com RLS, proibição de escrita direta, concorrência por versão, cota diária e cascade.
- O teste local de PostgreSQL não testa emissão/renovação de JWT, SMTP, infraestrutura Supabase ou OpenAI.
- A prévia gerenciada anunciou o servidor, mas deixou de ficar disponível; o navegador recebeu `ERR_CONNECTION_REFUSED`. A verificação visual ponta a ponta não foi concluída. Não há certificação de responsividade em dispositivos reais.

## Regras de segurança e limites

A primeira versão bloqueia geração automática para menores de 18 anos e avaliações que informem limitações ou observações médicas. Isso é uma triagem conservadora, não um sistema diagnóstico. A segurança do treino não pode ser inferida apenas de um checkbox. Recomenda-se avaliação presencial antes do uso.

O prompt da IA orienta recusa de diagnóstico, promessas e treino através de dor; os dados do usuário são marcados como não confiáveis. O agente não tem ferramentas de escrita. Essas medidas reduzem impacto, mas não provam imunidade a prompt injection ou a orientações incorretas.

Referências iniciais foram pesquisadas em fontes oficiais e científicas, incluindo atualização ACSM de 2026 e trabalho de Schoenfeld. Não foi criada uma revisão sistemática nem uma base completa de NSCA, Helms, Israetel ou McGill. Não há classificação de “melhores profissionais”. As sugestões do gerador são regras de produto e não devem ser atribuídas como protocolo validado por esses autores.

## Próximas etapas

1. Configurar ambiente Supabase isolado e concluir testes com duas contas, incluindo logout/login e restauração em outro dispositivo.
2. Configurar OpenAI com limite de gasto e avaliar respostas para dor, restrições, falhas do provedor e instruções adversárias.
3. Normalizar banco, persistir sessão em andamento, adicionar paginação, recuperação de conta e observabilidade sem dados sensíveis.
4. Revisar catálogo e prescrição com profissional habilitado; ampliar algoritmo e suas avaliações.
5. Adquirir/selecionar modelo anatômico licenciado e demonstrações de exercícios autorizadas.
6. Validar acessibilidade, tela pequena, teclado iOS, WebGL e instalação PWA nos dispositivos-alvo.
7. Definir política de privacidade, retenção, operador, contatos e subprocessadores; revisar antes de disponibilizar ao público.
