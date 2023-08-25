<?php
    switch ($_REQUEST["acao"]){
        case 'cadastrar':
            $nome = $_POST["nome"];
            $sobrenome = $_POST["sobrenome"];
            $email = $_POST["email"];
            $senha = md5($_POST["senha"]);
            $data_nasc = $_POST["data_nasc"];

            $sql = "INSERT INTO usuarios (nome, sobrenome, email, senha, data_nasc) VALUES ('{$nome}', '{$sobrenome}', '{$email}', '{$senha}', '{$data_nasc}')";

            $res = $conn->query($sql);

            if ($res==true) {
                print "<script>alert('Cadastrado com sucesso');</script>";
                print "<script>location.href='pre-home.php'</script>";
            }else{
                print "<script>alert('Cadastro não realizado');</script>";
                print "<script>location.href='?page=novo'</script>";
            }
            break;

        case 'editar':
            # code...
            break;
        case 'excluir':
            # code...
            break;
    }



