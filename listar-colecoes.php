<style>
    .col_section {
        display: flex;
    }
    .col_card {
        border: 1px solid #000000;
        padding: 10px;
        margin: 10px;
        border-radius: 10px;
    }
    .col_card h2 {
    }

</style>

<h1>Minhas Coleções</h1>
<div class="col_section">
<?php

    $user_id = $_SESSION['id'];

    $sql = "SELECT collections.*, categorias.* 
            FROM collections
            INNER JOIN categorias ON collections.categoria = categorias.cat_id
            WHERE collections.owner_id = $user_id";

    $res = $mysqli->query($sql);

    $qtd = $res->num_rows;

    if($qtd > 0){
        while($row = $res->fetch_object()){
            print "<div class=\"col_card\" style=\"border-top:10px solid ".$row->col_color."\">";
            print "<h2>".$row->col_name."</h2>";
            print "<h4>".$row->emoji_cat.$row->name_cat."</h4>";
            print "<p>".$row->col_desc."</p>";
            print "</div>";
        }
    }else{
        print "<p>Não encontramos resultados</p>";
    }
?>
</div>