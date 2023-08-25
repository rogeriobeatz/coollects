<?php 
include('protect.php');
?>

    <!DOCTYPE html>
    <html lang="en">

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Coollects</title>
        <link rel="stylesheet" href="style.css">
        <link rel="stylesheet" href="style/normalize.css">
    </head>

    <body>
        <?php
            include('header.php');
        ?>
        <div class=" ">
            <!-- <div class="space"></div>
            <h4>Olá <?php echo $_SESSION['nome']; ?>,</h4>
            <h5 class="normal">o que vamos colecionar hoje?</h5>
        <a href="?page=listar">Listar Usuário</a>
        <a href="?page=new_col">Nova Coleção</a>
        <a href="?page=new_item">Novo Item</a>
        <a href="?page=listar-colecoes">Minhas Coleções</a>
        <a href="?page=list_item">Meus Itens</a>
        <a href="logout.php">Sair</a> -->

        <?php 
        include("config.php");
        switch(@$_REQUEST["page"]){
            case 'listar-colecoes':
                include("listar-colecoes.php");
                break;
            case "listar":
                include("listar-usuario.php");
            break;
            case "salvar":
                include("salvar-usuario.php");
                break;

            case 'salvar-col':
                include("salvar-collection.php");
                break;

            case "new_col":
                include("nova-colecao.php");
                break;
        
            case "new_item":
                include("novo-item.php");
                break;
            case "list_item":
                include("listar-item.php");
                break;
        }
    ?>
    
</div>
    </body>

    </html>