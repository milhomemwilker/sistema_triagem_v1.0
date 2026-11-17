# Guia de uso

1. Em **Cadastro**, preencha os campos obrigatórios e clique em **Cadastrar paciente**.
2. Use a pesquisa pelo nome completo para encontrar um cadastro.
3. Clique em **Triar** para abrir o paciente selecionado.
4. Informe a pressão com barra, como `120/80`. Temperatura aceita ponto ou vírgula, como `36.5` ou `36,5`.
5. Preencha oxigenação, sintomas e, se disponível, frequência cardíaca.
6. Selecione uma classificação ou use **Sugerir classificação** e confira o resultado.
7. Clique em **Registrar triagem**.
8. Na tela **Fila**, acompanhe a ordem e use **Chamar próximo**.

Trocar de paciente limpa os dados da triagem anterior. Remover um paciente exclui também suas triagens ativas. Chamar o próximo retira sua triagem da fila, sem criar histórico de atendimento.

## Dados no navegador

Os dados ficam no localStorage. Acesso por outro endereço, navegador ou perfil usa armazenamento separado. Limpar os dados do site remove os registros locais.

O formato atual grava pacientes e triagens juntos em `ps_escola_pacientes_snapshot_v2`. Sem esse snapshot, tenta ler as chaves antigas `ps_escola_pacientes` e `ps_escola_triagens`. As chaves antigas são preservadas, mas não recebem as novas atualizações.

Se aparecer erro de armazenamento, preserve uma cópia dos dados antes de intervir. O sistema bloqueia gravações após erro de leitura; não há assistente automático de recuperação.
