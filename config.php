<?php
    define('HOST', 'srv880.hstgr.io');
    define('USER', 'u471204269_cool');
    define('PASS', '#Under1993');
    define('BASE', 'u471204269_cool');

    $conn = new MySqli(HOST,USER,PASS,BASE);
    $mysqli = new MySqli(HOST,USER,PASS,BASE);
    
    if ($conn->connect_error) {
        die("Erro de conexão: " . $conn->connect_error);
    }


?>