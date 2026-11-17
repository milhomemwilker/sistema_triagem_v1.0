# Sistema de Triagem PS Escola

Aplicação web educacional em HTML, CSS e JavaScript para cadastro de pacientes, registro de triagens e organização da fila por classificação. Funciona sem backend e armazena os dados no navegador.

## Relatório de bugs e correções

Consulte o [Relatório de bugs e correções](RELATORIO_DE_BUGS.md) para conhecer os **13 problemas identificados**, suas prioridades, causas, soluções aplicadas e resultados dos testes. O detalhamento está em um arquivo separado para facilitar a consulta e a manutenção da documentação.

## Funcionalidades

- Cadastro, pesquisa e remoção de pacientes.
- Registro de sinais vitais e sintomas.
- Classificação manual e sugestão pelas regras educacionais existentes.
- Fila por prioridade e chamada do próximo paciente.
- Persistência local no navegador.

## Executar

1. Extraia o ZIP.
2. Abra a pasta `sistema-triagem`.
3. Abra `index.html` no navegador, mantendo `assets` ao lado.

Não é necessário instalar pacotes. Para servir a pasta localmente, se Python estiver instalado:

```bash
python -m http.server 8000
```

Abra <http://localhost:8000>. Conforme o sistema, o comando Python pode ser `python3` ou `py`.

## Testar

Requer Node.js 18 ou superior apenas para os testes:

```bash
npm test
```

Alternativa: `node tests/regressao.cjs`. Não é necessário executar `npm install`. A suíte contém 14 testes de regressão.

## Documentação

| Arquivo | Conteúdo |
| --- | --- |
| [RELATORIO_DE_BUGS.md](RELATORIO_DE_BUGS.md) | Problemas, prioridades, causas, soluções e resultados de verificação |
| [CODIGO_COMENTADO.md](CODIGO_COMENTADO.md) | Arquivos JavaScript corrigidos com explicações em português |
| [patches/README.md](patches/README.md) | Aplicação, conferência e reversão dos patches históricos |
| [GUIA_DE_USO.md](GUIA_DE_USO.md) | Operação das telas e armazenamento |
| [PUBLICAR_NO_GITHUB.md](PUBLICAR_NO_GITHUB.md) | Preparação e envio do repositório |
| [CHANGELOG.md](CHANGELOG.md) | Histórico das entregas |

As correções já estão aplicadas. Os patches são destinados à versão original e não devem ser reaplicados neste pacote.

## Estrutura

O arquivo `index.html` fica na raiz. A pasta `assets/` contém CSS e JavaScript; `tests/` contém a suíte de regressão; `patches/` guarda as diferenças históricas. Os documentos de apoio são arquivos separados, listados acima.

## Escopo

Use dados fictícios para estudo. A sugestão de classificação não é um protocolo clínico validado. O projeto não tem autenticação própria, sincronização entre dispositivos ou histórico de atendimentos. Os registros ficam no localStorage da origem e do perfil do navegador.

## Licença

Não foi definida licença de código aberto. Escolha uma licença considerando os direitos e a autoria antes de autorizar reutilização por terceiros.
