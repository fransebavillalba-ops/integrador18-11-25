<?php
// db.php - conexión reutilizable a MySQL para BurgerLab

$DB_HOST = 'localhost';
$DB_NAME = 'burguerlab';
$DB_USER = 'root';      // Cambiar si usás otro usuario
$DB_PASS = '';          // Cambiar si tu MySQL tiene contraseña

function getPDO() {
    global $DB_HOST, $DB_NAME, $DB_USER, $DB_PASS;

    $dsn = "mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4";

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ];

    return new PDO($dsn, $DB_USER, $DB_PASS, $options);
}
?>
