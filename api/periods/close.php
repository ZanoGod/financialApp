<?php
declare(strict_types=1);
require_once __DIR__ . '/../helpers/bootstrap.php';
require_once __DIR__ . '/../middleware/auth.php';
Request::requireMethod('POST'); requireAuth();
$db=Database::getConnection(); $db->beginTransaction();
try {
 $p=$db->query("SELECT * FROM financial_periods WHERE status='active' FOR UPDATE")->fetch(); if(!$p) Response::error('There is no active period.',409);
 $date=date('Y-m-d');
 $summary=$db->prepare("SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END),0) total_income, COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END),0) total_expenses, COUNT(*) transaction_count FROM transactions WHERE period_id=:id"); $summary->execute(['id'=>$p['id']]); $totals=$summary->fetch();
 $s=$db->prepare("UPDATE financial_periods SET end_date=:end,status='archived',closed_at=CURRENT_TIMESTAMP WHERE id=:id AND status='active'"); $s->execute(['end'=>$date,'id'=>$p['id']]); if($s->rowCount()!==1) Response::error('Period was already closed.',409);
 $db->commit(); Response::success('Month archived.', ['period_id'=>(int)$p['id'],'start_date'=>$p['start_date'],'end_date'=>$date,'closed_at'=>date('Y-m-d H:i:s'),'total_income'=>(float)$totals['total_income'],'total_expenses'=>(float)$totals['total_expenses'],'net_income'=>(float)$totals['total_income']-(float)$totals['total_expenses'],'transaction_count'=>(int)$totals['transaction_count']]);
} catch(Throwable $e) { if($db->inTransaction()) $db->rollBack(); throw $e; }
