# Publicar o projeto no GitHub

O pacote está organizado para um repositório com `index.html` e `README.md` na raiz. Extraia o ZIP antes de enviar; publicar somente o ZIP não expõe os arquivos como projeto navegável.

## Envio pelo Git

Crie um repositório vazio na sua conta e execute dentro da pasta extraída:

```bash
cd sistema-triagem
git init
git add .
git commit -m "Adiciona sistema de triagem e documentação organizada"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/sistema-triagem.git
git push -u origin main
```

Substitua `SEU_USUARIO` e, se necessário, o nome do repositório. Use a autenticação do GitHub sem gravar credenciais no projeto. Esses comandos pressupõem uma pasta ainda sem repositório Git; se você já possui um clone, copie os arquivos para ele e revise `git status` e `git diff` antes de fazer o commit.

## Envio pela interface

Crie um repositório, envie o conteúdo extraído preservando `assets`, `tests` e `patches`, e confira se `index.html` ficou na raiz. Para incluir de forma consistente os arquivos iniciados por ponto, prefira o Git.

## Hospedagem estática

O projeto não exige build e pode ser hospedado em um servidor estático. Se habilitar GitHub Pages no repositório, configure a publicação da pasta raiz da branch escolhida e utilize o endereço informado pela plataforma. A disponibilidade e o acesso dependem da configuração da conta e do repositório.

Este pacote não cria repositório nem publica conteúdo automaticamente. Os dados cadastrados ficam no navegador de cada usuário e não são enviados para um backend pelo aplicativo.
