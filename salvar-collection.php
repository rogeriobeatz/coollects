<h1>
    Salvar Coleção
</h1>

<?php
    switch ($_REQUEST["acao"]){
        case 'cadastrar':
            $owner_id = $_POST["owner_id"];
            $categoria = $_POST["categoria"];
            $col_name = $_POST["col_name"];
            $col_color = $_POST["col_color"];
            $col_desc = $_POST["col_desc"];

            $sql = "INSERT INTO collections (owner_id, categoria, col_name, col_color, col_desc) VALUES ('{$owner_id}', '{$categoria}', '{$col_name}', '{$col_color}', '{$col_desc}')";

            $res = $mysqli->query($sql);

            if ($res==true) {
                print "<script>alert('Cadastrado com sucesso');</script>";
                print "<script>location.href='?page=listar-colecoes'</script>";
            }else{
                print "<script>alert('Cadastro não realizado');</script>";
                print "<script>location.href='?page=listar-colecoes'</script>";
            }
            break;

        case 'editar':
            # code...
            break;
        case 'excluir':
            # code...
            break;
    }




