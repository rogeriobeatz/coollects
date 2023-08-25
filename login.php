<?php
    include('config.php');

    if(isset($_POST['email']) && isset($_POST['senha'])) {

        if(strlen($_POST['email']) == 0 ) {
            echo "Preencha seu e-mail";
        }else if(strlen($_POST['senha']) == 0){
            echo "Preenche sua senha";
        }else{
            
            $email = $mysqli->real_escape_string($_POST['email']);
            $senha = $mysqli->real_escape_string($_POST['senha']);

            $sql_code = "SELECT * FROM usuarios WHERE email = '$email' AND senha = '$senha'";
            $sql_query = $mysqli->query($sql_code) or die("Falha na execução do código SQL");

            $quantidade = $sql_query->num_rows;

            if($quantidade == 1) {

                $usuario = $sql_query->fetch_assoc();

                if(!isset($_SESSION)){
                    session_start();
                }

                $_SESSION['id'] = $usuario['id'];
                $_SESSION['nome'] = $usuario['nome'];


                header("Location: pre-home.php");


            }else{
                echo "Falha ao lugar, Email ou Senha incorretos.";
            }
        }
    }
?>
<div class="login-overlay">
    <div class="login-modal">
        <img src="images/coollects.png" alt="" class="logo">
        <h3 class="alg-cnt">Faça seu login</h3>
        <form action="" method="post" class="form">
        <label for="">Email</label>
        <input placeholder="Seu Email" type="text" name="email" id="">
        <label for="">Senha</label>
        <input placeholder="Sua Senha" type="password" name="senha" id="">
        <button type="submit" class="orange">Entrar</button>
    </form>
    <a href="#" onclick="history.back()" class="link-align">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <path d="M20 12L4 12L10 18M7 9L10 6" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg> Voltar</a>
    </div>


</div>