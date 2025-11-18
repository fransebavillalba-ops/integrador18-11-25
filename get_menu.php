<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/db.php';

try {
    $pdo = getPDO();

    $sql = "SELECT 
                id,
                nombre,
                categoria,
                precio,
                img,
                descripcion AS `desc`
            FROM productos
            ORDER BY id";

    $stmt = $pdo->query($sql);
    $productos = $stmt->fetchAll();

    echo json_encode($productos);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => $e->getMessage()
    ]);
}
?>
