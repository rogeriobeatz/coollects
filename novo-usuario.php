

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Novo Usuário</title>
</head>
<body>
    

<div class="login-overlay">
    <div class="login-modal form">
        <img src="images/coollects.png" alt="" class="logo">
        <h3 class="alg-cnt">Crie uma nova conta!</h3>
        <form action="?page=salvar" method="POST" class="form">
        <input type="hidden" name="acao" value="cadastrar">
        <label>Nome</label>
        <input type="text" name="nome">
        <label>Sobrenome</label>
        <input type="text" name="sobrenome">
        <label>email</label>
        <input type="email" name="email">
        <label>senha</label>
        <input type="password" name="senha">
        <label>Data de Nascimento</label>
        <input type="date" name="data_nasc">
        <button type="submit" class="orange">Cadastrar</button>
        </form>
        <a href="#" onclick="history.back()" class="link-align">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <path d="M20 12L4 12L10 18M7 9L10 6" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg> Voltar</a>
    </div>

</div>

</body>
</html>