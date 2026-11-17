# Relatório de bugs e correções

Sistema de Triagem PS Escola. Este relatório reúne os 13 problemas identificados, suas prioridades, comportamentos originais, soluções e evidências. Os IDs históricos foram preservados.

## Prioridades e identificação

| Ordem | ID | Severidade | Problema |
| --- | --- | --- | --- |
| 1 | BUG01 | Crítica | Fila ignora a classificação de risco |
| 2 | BUG02 | Crítica | Exclusão remove paciente diferente após busca |
| 3 | BUG06 | Alta | Troca de paciente mantém dados da triagem anterior |
| 4 | BUG03 | Alta | Pressão arterial não reconhece o formato exibido |
| 5 | BUG04 | Alta | Temperatura perde a parte decimal |
| 6 | BUG07 | Alta | Dados digitados são interpretados como HTML |
| 7 | BUG08 | Alta | Idade e sinais vitais aceitam conteúdo inválido |
| 8 | BUG05 | Alta | Sugestão vermelha com formulário vazio |
| 9 | BUG09 | Alta | Dados corrompidos impedem a inicialização |
| 10 | BUG13 | Alta | Cadastro falha sem crypto.randomUUID |
| 11 | BUG10 | Média | Paciente pode aparecer várias vezes na fila |
| 12 | BUG12 | Média | Seleção de triagem identifica apenas pelo primeiro nome |
| 13 | BUG11 | Média | Busca ignora sobrenome e diferencia maiúsculas |

## Problemas e soluções

Em cada item, “comportamento original” descreve a falha anterior; a solução descreve a alteração implementada.

### 1. BUG01 — Fila ignora a classificação de risco

**Severidade:** Crítica. **Status:** corrigido e verificado no escopo descrito.

**Área afetada:** Fila de atendimento — fila.js, callNext e render.

**Comportamento original:** Cadastre uma triagem verde e depois uma vermelha. Ao chamar o próximo, a verde é retirada primeiro, pois callNext usa shift(). Resultado reproduzido em teste de função.

**Comportamento esperado:** Chamar pela ordem de prioridade definida no sistema; em empate, respeitar a ordem de entrada.

**Solução aplicada:** Implementada orderedTriages(), utilizada na exibição e na chamada, com prioridade vermelho, amarelo, verde e branco. Novos registros recebem createdAt completo; registros antigos sem data mantêm a ordem relativa nos empates.

**Verificação:** Teste automatizado de prioridade e desempate aprovado; paciente vermelho escolhido antes do verde.

### 2. BUG02 — Exclusão remove paciente diferente após busca

**Severidade:** Crítica. **Status:** corrigido e verificado no escopo descrito.

**Área afetada:** Cadastro — cadastro.js, render e handleListClick.

**Comportamento original:** Cadastre Ana e Bruno. Busque Bruno e clique em Remover. O índice 0 da lista filtrada é aplicado à lista completa e exclui Ana. Erro reproduzido na função de exclusão.

**Comportamento esperado:** Remover somente o paciente escolhido, inclusive com pesquisa ativa.

**Solução aplicada:** O botão Remover carrega o ID do paciente. A exclusão procura esse identificador na lista completa e remove somente as triagens associadas; em falha de gravação, o estado anterior é restaurado.

**Verificação:** Teste automatizado de exclusão por ID com filtro aprovado; Ana preservada e Bruno removido.

### 3. BUG06 — Troca de paciente mantém dados da triagem anterior

**Severidade:** Alta. **Status:** corrigido e verificado no escopo descrito.

**Área afetada:** Triagem — triagem.js, selectPatient; cadastro.js, seleção pelo botão Triar.

**Comportamento original:** Preencha sinais vitais, sintomas e classificação para um paciente e selecione outro. selectPatient atualiza apenas o ID e o resumo; os demais campos permanecem preenchidos. Constatação por leitura do código.

**Comportamento esperado:** Evitar que dados clínicos de um paciente sejam atribuídos a outro durante a troca.

**Solução aplicada:** Troca centralizada em selectPatient(), chamada tanto pelo seletor quanto pelo botão Triar. A mudança de ID limpa formulário, classificação, sugestão e mensagem.

**Verificação:** Teste automatizado: ao mudar o paciente, sintomas anteriores são apagados e a sugestão é limpa.

### 4. BUG03 — Pressão arterial não reconhece o formato exibido

**Severidade:** Alta. **Status:** corrigido e verificado no escopo descrito.

**Área afetada:** Triagem — triagem.js, parseBloodPressure e calculateSuggestion.

**Comportamento original:** Informe 180/110 com temperatura 36.5, oxigenação 98, frequência 80 e cefaleia. A sugestão é verde: o código divide por hífen, mas o campo orienta usar barra. Reproduzido em teste.

**Comportamento esperado:** Interpretar corretamente o formato sistólica/diastólica e aplicar as regras já definidas no código.

**Solução aplicada:** parseBloodPressure() valida números separados por barra e aceita espaços. readVitals() rejeita formato inválido, valores não positivos e sistólica menor ou igual à diastólica.

**Verificação:** Teste automatizado: 180/110 reconhecido e classificado em vermelho pelas regras existentes.

### 5. BUG04 — Temperatura perde a parte decimal

**Severidade:** Alta. **Status:** corrigido e verificado no escopo descrito.

**Área afetada:** Triagem — triagem.js, calculateSuggestion.

**Comportamento original:** Com os outros sinais normais, 38.5 é convertido em 38 e produz amarelo; 37.8 vira 37 e produz verde. Ambos os resultados foram reproduzidos em testes das funções.

**Comportamento esperado:** Preservar as casas decimais e comparar o valor com os limites presentes no código.

**Solução aplicada:** Conversão decimal estrita aceita ponto ou vírgula e preserva a parte fracionária. Entradas com texto adicional são rejeitadas.

**Verificação:** Testes automatizados: 38.5 e 38,5 retornam vermelho; 37.8 retorna amarelo, pelas regras existentes.

### 6. BUG07 — Dados digitados são interpretados como HTML

**Severidade:** Alta. **Status:** corrigido e verificado no escopo descrito.

**Área afetada:** cadastro.js, render; triagem.js, renderPatientSummary e renderVitalPreview; fila.js, render.

**Comportamento original:** Nome, endereço, sintomas e sinais vitais são concatenados em innerHTML sem escape. Conteúdo com marcação pode alterar a interface e permitir XSS. Identificado na revisão; não foi executada carga maliciosa.

**Comportamento esperado:** Exibir entradas do usuário como texto, sem interpretar HTML ou executar eventos.

**Solução aplicada:** escapeHTML() codifica &, <, >, aspas simples e duplas nas interpolações dos blocos HTML de cadastro, resumo, sinais e fila. Os atributos utilizados permanecem entre aspas. Esta proteção é específica para os contextos HTML empregados; não é sanitização universal de URLs, scripts ou CSS.

**Verificação:** Testes automatizados de codificação de caracteres e exibição literal de marcação aprovados; não foi feita auditoria completa de segurança.

### 7. BUG08 — Idade e sinais vitais aceitam conteúdo inválido

**Severidade:** Alta. **Status:** corrigido e verificado no escopo descrito.

**Área afetada:** Cadastro e triagem — index.html, cadastro.js e triagem.js.

**Comportamento original:** Os campos são de texto e a gravação verifica principalmente se estão preenchidos. Não há validação numérica suficiente para rejeitar idade negativa, texto em sinais vitais ou oxigenação acima de 100. Evidência por revisão.

**Comportamento esperado:** Rejeitar entradas inválidas antes de salvar ou sugerir classificação, com mensagem específica.

**Solução aplicada:** Idade deve ser inteira entre 0 e 150; pressão deve ter formato válido; temperatura deve ser numérica e positiva; oxigenação deve ficar entre 0 e 100; frequência cardíaca é opcional, mas deve ser inteira e positiva quando informada; sintomas não podem conter somente espaços. Não foram definidos limites clínicos adicionais.

**Verificação:** Testes automatizados de idade negativa, texto e oxigenação fora da faixa aprovados.

### 8. BUG05 — Sugestão vermelha com formulário vazio

**Severidade:** Alta. **Status:** corrigido e verificado no escopo descrito.

**Área afetada:** Triagem — triagem.js, suggestRisk e calculateSuggestion.

**Comportamento original:** Clique em Sugerir classificação sem preencher sinais vitais. Number converte a oxigenação vazia em zero e a função retorna vermelho. Resultado reproduzido em teste.

**Comportamento esperado:** Informar que faltam dados e não selecionar uma classificação sem entradas válidas.

**Solução aplicada:** readVitals() valida sinais e sintomas antes da sugestão. Em falha, é exibida mensagem, o cálculo é interrompido e a classificação selecionada é limpa.

**Verificação:** Teste automatizado: oxigenação vazia impede o cálculo e retorna null.

### 9. BUG09 — Dados corrompidos impedem a inicialização

**Severidade:** Alta. **Status:** corrigido e verificado no escopo descrito.

**Área afetada:** Persistência — state.js, constructor e save.

**Comportamento original:** Se o localStorage contém JSON inválido, o construtor AppState lança SyntaxError e a aplicação não inicializa. Exceção reproduzida em teste com conteúdo inválido.

**Comportamento esperado:** Abrir a aplicação com uma mensagem recuperável e preservar os dados disponíveis para recuperação.

**Solução aplicada:** Leitura e análise de JSON protegidas por try/catch e validação da estrutura essencial. Dados inválidos são preservados e novas gravações bloqueadas. Pacientes e triagens são gravados juntos em snapshot único. Falha ao salvar retorna false e os controladores desfazem a alteração em memória. A recuperação dos dados originais é manual.

**Verificação:** Testes automatizados de JSON corrompido, bloqueio de gravação e cancelamento de chamada quando save falha aprovados.

### 10. BUG13 — Cadastro falha sem crypto.randomUUID

**Severidade:** Alta. **Status:** corrigido e verificado no escopo descrito.

**Área afetada:** state.js, cadastro.js e triagem.js.

**Comportamento original:** No teste em HTTP local, o cadastro lançou TypeError: crypto.randomUUID is not a function.

**Comportamento esperado:** Gerar IDs mesmo quando randomUUID não estiver disponível, desde que o navegador ofereça getRandomValues.

**Solução aplicada:** createRecordId() utiliza crypto.randomUUID() quando disponível. Como alternativa, gera bytes com crypto.getRandomValues(), define versão/variante e monta um UUID v4. Cadastro e triagem passaram a usar essa função.

**Verificação:** Após a correção, fluxo no navegador concluído: cadastro fictício, sugestão com 38,5, registro e exibição na fila.

### 11. BUG10 — Paciente pode aparecer várias vezes na fila

**Severidade:** Média. **Status:** corrigido e verificado no escopo descrito.

**Área afetada:** Triagem e fila — triagem.js, handleSubmit e renderPatientOptions.

**Comportamento original:** handleSubmit adiciona uma nova triagem por push sem verificar se o paciente já aguarda atendimento. A seleção continua incluindo todos os pacientes cadastrados. Constatação por revisão.

**Comportamento esperado:** Evitar duplicidade de entradas ativas para o mesmo atendimento, distinguindo reavaliação de uma nova entrada.

**Solução aplicada:** Antes da inclusão, some() verifica se já existe uma triagem ativa com o mesmo patientId. Duplicidade é bloqueada com mensagem. Não foi implementado fluxo de reavaliação.

**Verificação:** Teste automatizado: segunda triagem ativa para o mesmo paciente não aumenta a fila.

### 12. BUG12 — Seleção de triagem identifica apenas pelo primeiro nome

**Severidade:** Média. **Status:** corrigido e verificado no escopo descrito.

**Área afetada:** Triagem — triagem.js, renderPatientOptions.

**Comportamento original:** renderPatientOptions gera cada opção apenas com patient.firstName. Dois pacientes chamados Ana aparecem com o mesmo texto na seleção. Constatação por leitura do código.

**Comportamento esperado:** Distinguir pacientes homônimos antes do preenchimento da triagem.

**Solução aplicada:** As opções mostram nome completo e ID único, mantendo o ID como valor da seleção.

**Verificação:** Teste automatizado e conferência visual da opção com nome completo e ID.

### 13. BUG11 — Busca ignora sobrenome e diferencia maiúsculas

**Severidade:** Média. **Status:** corrigido e verificado no escopo descrito.

**Área afetada:** Recepção — cadastro.js, render.

**Comportamento original:** A busca usa apenas patient.firstName.includes(search). Para Ana Silva, pesquisar Silva não encontra o cadastro; pesquisar ana também pode não encontrar Ana. Evidência direta na função.

**Comportamento esperado:** Localizar pelo nome completo, sem diferenciar letras maiúsculas e minúsculas.

**Solução aplicada:** Pesquisa usa nome completo com normalização NFD, remoção de acentos, conversão para minúsculas e remoção de espaços nas extremidades.

**Verificação:** Teste automatizado: SILVA encontra Ana Sílva.

## Decisões que precisam ser entendidas

- **Identidade versus posição:** filtros mudam posições de lista; IDs identificam o paciente independentemente da posição.
- **Validação antes do cálculo:** texto vazio não deve virar zero, e texto parcialmente numérico não deve ser aceito como medida válida.
- **Preservação de dados:** erro de leitura bloqueia gravações e conserva o conteúdo original. Não foi implementado assistente automático de recuperação.
- **Gravação conjunta:** pacientes e triagens são serializados em uma chave única. Isso evita gravar uma lista e falhar antes de gravar a outra; não cria banco de dados ou transações entre usuários.
- **Desfazer em memória:** se save() retorna false, o controlador restaura a lista anterior e não informa sucesso.
- **HTML protegido:** a abordagem aplicada foi codificar as interpolações com escapeHTML(), mantendo os templates existentes. Não foi feita uma reescrita completa com createElement()/textContent.
- **Regras clínicas preservadas:** não foram criados novos critérios clínicos. O foco foi corrigir a interpretação dos dados e o comportamento previsto pelas regras do código.
- **Mensagens legíveis:** foi removido o apagamento automático após 2,8 segundos. As mensagens são substituídas por novas ações ou limpas nos pontos definidos no código; não há garantia de que qualquer clique limpe todas as mensagens.
- **Compatibilidade:** funções auxiliares são carregadas por state.js antes dos controladores. Todos os patches precisam estar aplicados antes de abrir a aplicação.

## Persistência e compatibilidade

- Novas gravações usam `ps_escola_pacientes_snapshot_v2`, contendo pacientes e triagens juntos.
- Sem snapshot, a versão tenta ler as chaves antigas `ps_escola_pacientes` e `ps_escola_triagens`.
- As chaves antigas permanecem preservadas, mas deixam de ser atualizadas após a adoção do snapshot. Uma versão antiga do sistema não lê o snapshot novo.
- A recuperação de dados inválidos é manual. A implementação bloqueia gravações para não sobrescrever o conteúdo original; não oferece assistente de recuperação.
- O armazenamento é local ao navegador e à origem do site; não há sincronização entre dispositivos ou abas.

## Comentários sobre os testes executados

A suíte usa vm do Node.js para carregar as classes reais. document, localStorage, alert e FormData são simulados para exercitar decisões de lógica sem depender do navegador. Os casos não equivalem a uma auditoria clínica ou a um teste completo de segurança.

| Teste | O que verifica | Por que foi necessário |
| --- | --- | --- |
| 1 | Pressão 180/110 interpretada com barra | A função antiga separava por hífen |
| 2 | Temperaturas 38.5, 38,5 e 37.8 preservadas | parseInt descartava decimais |
| 3 | Oxigenação vazia impede sugestão | Number de texto vazio resultava em zero |
| 4 | Oxigenação inválida e temperatura textual rejeitadas | Campos preenchidos não significam números válidos |
| 5 | Vermelho precede verde; data desempata | shift ignorava classificação |
| 6 | Remoção por ID com busca ativa | Índices filtrados podiam remover outra pessoa |
| 7 | Nome completo com caixa e acento normalizados | Busca original considerava somente firstName |
| 8 | Caracteres HTML codificados e marcação literal | Valores eram interpolados diretamente em innerHTML |
| 9 | Troca limpa sintomas anteriores e reinicia sugestão | Dados de um paciente ficavam no formulário de outro |
| 10 | Nome completo e ID aparecem na seleção | Primeiro nome não distinguia homônimos |
| 11 | Segunda triagem ativa é bloqueada | push criava duplicações |
| 12 | Idade negativa é rejeitada | Não existia validação numérica suficiente |
| 13 | JSON corrompido bloqueia gravação e preserva original | JSON.parse interrompia a inicialização |
| 14 | Falha de save cancela chamada e mantém a fila | Evita informar atendimento sem salvar a alteração |

**Teste no navegador:** cadastro de Teste Regressão com dados fictícios; seleção pelo botão Triar; preenchimento de pressão 120/80, temperatura 38,5, oxigenação 98 e frequência 80; sugestão, registro e exibição na fila concluídos. O cadastro inicialmente revelou ausência de crypto.randomUUID no HTTP local; createRecordId resolveu essa incompatibilidade.

**Conferência dos patches:** o patch consolidado foi aplicado em cópia isolada dos originais. Os sete arquivos resultantes foram comparados byte a byte com os arquivos da entrega corrigida, e os 14 testes passaram nessa cópia.

## O que os resultados não demonstram

Não foi demonstrada ausência de todos os bugs possíveis. Não houve teste clínico, pentest completo, teste de carga, validação em todos os navegadores, teste de concorrência entre abas ou recuperação automática de dados reais. A validação de schema no armazenamento cobre campos essenciais, não todas as regras de negócio de cada registro legado.

O método normalizeClassification permanece no arquivo como código legado, mas o envio corrigido não o utiliza: exige classificação explícita. Isso está explicado no bloco comentado para evitar confundir método existente com comportamento ativo.

## Limites da correção

As regras existentes de sugestão de classificação foram preservadas. Os testes verificam seu funcionamento no código, sem validar um protocolo clínico. Utilize dados fictícios no contexto educacional.

Continuam fora desta entrega: backend, prontuário/histórico, autenticação própria, perfis, reavaliação, sincronização entre usuários e auditoria completa de segurança. A chamada remove a triagem da fila ativa. Esses itens não foram apresentados como funcionalidades implementadas.

## Arquivos relacionados

- [Código comentado](CODIGO_COMENTADO.md)
- [Instruções dos patches](patches/README.md)
- [Projeto e execução](README.md)

Os comportamentos originais descrevem a versão anterior. As correções já estão aplicadas no código deste pacote.
