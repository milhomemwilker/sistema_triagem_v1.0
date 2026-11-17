# Patches de correção

Os arquivos desta pasta comparam a versão original com a corrigida. **As correções já estão aplicadas neste projeto: não aplique os patches novamente.**

São fornecidos para estudo, auditoria e aplicação em uma cópia da versão original. Use o consolidado ou os patches individuais, nunca os dois.

## Aplicar o patch consolidado

O patch exige a versão original enviada, com `index.html` na raiz e JavaScript em `assets/`. Se você já utiliza o ZIP corrigido, não reaplique os patches.

1. Preserve uma cópia do projeto original ou faça um commit antes da alteração.
2. Extraia este pacote e copie sua pasta `patches` para a raiz do projeto original.
3. Na raiz do projeto, execute:

```bash
git apply --check patches/correcao-completa.patch
git apply patches/correcao-completa.patch
```

O primeiro comando apenas verifica a compatibilidade. O segundo aplica as mudanças. Não são necessários commits existentes para `git apply` operar, mas o Git precisa estar instalado.

Se aparecer conflito, pare e compare a versão local com a original: não force a aplicação nem execute os patches duas vezes. Os patches adicionam `tests/regressao.cjs` e `package.json`; arquivos existentes com esses nomes precisam ser comparados antes.

### Alternativa com patches por arquivo

Use esta alternativa somente se não aplicou o consolidado. Todos os patches devem ser aplicados antes de executar o sistema, pois há dependências entre os arquivos.

```bash
git apply patches/0001-state.patch
git apply patches/0002-cadastro.patch
git apply patches/0003-triagem.patch
git apply patches/0004-fila.patch
git apply patches/0005-app.patch
git apply patches/0006-regressao.patch
git apply patches/0007-package.patch
```

### Reverter o patch

Somente se os arquivos ainda estiverem compatíveis com a versão recém-corrigida e não houver alterações posteriores:

```bash
git apply --reverse --check patches/correcao-completa.patch
git apply --reverse patches/correcao-completa.patch
```

A reversão também remove os arquivos de teste e package.json criados pelo patch. Ela não reverte dados do navegador. Faça uma cópia antes de reverter.

## Testar a versão corrigida

Com Node.js 18 ou superior, na raiz do projeto:

```bash
npm test
```

Alternativa sem npm:

```bash
node tests/regressao.cjs
```

Não há dependências para instalar. Resultado esperado: **14 testes aprovados**. Os testes usam funções reais com simulação de DOM e armazenamento; não cobrem todos os comportamentos possíveis de navegador.

Para abrir a aplicação, mantenha `index.html` ao lado da pasta `assets` e abra-o no navegador. Também é possível servir a pasta com um servidor estático local.
