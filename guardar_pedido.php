<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/db.php';

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    echo json_encode(['ok' => false, 'error' => 'JSON inválido']);
    exit;
}

$cliente = $data['cliente'] ?? [];
$carrito = $data['carrito'] ?? [];

if (empty($carrito)) {
    echo json_encode(['ok' => false, 'error' => 'Carrito vacío']);
    exit;
}

try {
    $pdo = getPDO();
    $pdo->beginTransaction();

    // Obtener los precios actuales de la BD
    $ids = array_column($carrito, 'id');
    $placeholders = implode(',', array_fill(0, count($ids), '?'));

    $stmt = $pdo->prepare("SELECT id, precio FROM productos WHERE id IN ($placeholders)");
    $stmt->execute($ids);

    $precios = [];
    foreach ($stmt as $row) {
        $precios[(int)$row['id']] = (int)$row['precio'];
    }

    // Calcular el total
    $total = 0;
    foreach ($carrito as $item) {
        $pid = (int)$item['id'];
        $cant = (int)$item['cantidad'];
        $precio = $precios[$pid] ?? 0;
        $total += $cant * $precio;
    }

    // Insertar pedido
    $stmt = $pdo->prepare("
        INSERT INTO pedidos (nombre, direccion, telefono, email, medio_pago, total)
        VALUES (?, ?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        $cliente['nombre'] ?? '',
        $cliente['direccion'] ?? '',
        $cliente['telefono'] ?? '',
        $cliente['email'] ?? '',
        $cliente['pago'] ?? '',
        $total
    ]);

    $pedidoId = $pdo->lastInsertId();

    // Insertar items del pedido
    $stmtItem = $pdo->prepare("
        INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario)
        VALUES (?, ?, ?, ?)
    ");

    foreach ($carrito as $item) {
        $pid = (int)$item['id'];
        $cant = (int)$item['cantidad'];
        $precio = $precios[$pid] ?? 0;

        $stmtItem->execute([
            $pedidoId,
            $pid,
            $cant,
            $precio
        ]);
    }

    $pdo->commit();

    echo json_encode(['ok' => true, 'pedido_id' => $pedidoId]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
?>
