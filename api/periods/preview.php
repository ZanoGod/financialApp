<?php
declare(strict_types=1);
require_once __DIR__ . '/../helpers/bootstrap.php';
require_once __DIR__ . '/../middleware/auth.php';
Request::requireMethod('GET'); requireAuth();
$date=trim((string)($_GET['end_date']??''));
if(!preg_match('/^\d{4}-\d{2}-\d{2}$/',$date) || !checkdate((int)substr($date,5,2),(int)substr($date,8,2),(int)substr($date,0,4))) Response::error('Closing date is invalid.',422);
$db=Database::getConnection(); $p=$db->query("SELECT * FROM financial_periods WHERE status='active' LIMIT 1")->fetch();
if(!$p) Response::error('There is no active period.',409); if($date<$p['start_date']) Response::error('Closing date must be on or after the start date.',422);
$s=$db->prepare("SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END),0) total_income, COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END),0) total_expenses, COUNT(*) transaction_count FROM transactions WHERE period_id=:id AND transaction_date<=:end_date"); $s->execute(['id'=>$p['id'],'end_date'=>$date]); $summary=$s->fetch(); $summary['total_income']=(float)$summary['total_income']; $summary['total_expenses']=(float)$summary['total_expenses']; $summary['net_income']=$summary['total_income']-$summary['total_expenses']; $summary['transaction_count']=(int)$summary['transaction_count'];
Response::success('Period closure preview.', ['period'=>$p,'closing_date'=>$date,'summary'=>$summary]);
