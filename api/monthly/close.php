<?php
// api/monthly/close.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/MonthlySummary.php';

try {
    $db = (new Database())->getConnection();
    $summary = new MonthlySummary($db);

    $input = json_decode(file_get_contents("php://input"), true);

    if (empty($input['year']) || empty($input['month'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Year and month are required."]);
        exit();
    }

    $year = (int)$input['year'];
    $month = (int)$input['month'];
    $notes = $input['notes'] ?? null;

    $result = $summary->closeMonth($year, $month, $notes);

    http_response_code(200);
    echo json_encode([
        "status"  => "success",
        "message" => "Monthly summary saved successfully.",
        "data"    => $result
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}