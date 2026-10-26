<?php
// api/monthly/index.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    $stmt = $conn->prepare("SELECT id, year, month, total_income, total_expense, net_savings, notes, closed_at FROM monthly_summaries ORDER BY year DESC, month DESC");
    $stmt->execute();
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Provide both 'archives' and 'data' keys for total compatibility
    echo json_encode([
        "status"   => "success",
        "archives" => $records ?: [],
        "data"     => $records ?: []
    ]);
} catch (Exception $e) {
    echo json_encode([
        "status"   => "error",
        "archives" => [],
        "data"     => [],
        "message"  => $e->getMessage()
    ]);
}
?>