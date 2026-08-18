<?php
// api/monthly/delete.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Get the ID from the URL (e.g., delete.php?id=1)
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

    if ($id > 0) {
        $stmt = $db->prepare("DELETE FROM monthly_summaries WHERE id = :id");
        $stmt->execute([':id' => $id]);
        
        echo json_encode([
            "status" => "success", 
            "message" => "Archive successfully deleted."
        ]);
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid ID provided."]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>