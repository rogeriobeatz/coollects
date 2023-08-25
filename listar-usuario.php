<h1>Listar Usuarios</h1>
<?php
    $sql = "SELECT * FROM usuarios";

    $res = $mysqli->query($sql);

    $qtd = $res->num_rows;

    if($qtd > 0){
        print "<table>";
        while($row = $res->fetch_object()){
            print "<tr>";
            print "<td>".$row->id."</td>";
            print "<td>".$row->nome."</td>";
            print "<td>".$row->sobrenome."</td>";
            print "<td>".$row->email."</td>";
            print "<td>".$row->data_nasc."</td>";
            print "</tr>";
        }
        print "</table>";
    }else{
        print "<p>Não encontramos resultados</p>";
    }
?>