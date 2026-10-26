<?php
declare(strict_types=1);
require_once __DIR__ . '/../helpers/bootstrap.php';
require_once __DIR__ . '/../middleware/auth.php';
Request::requireMethod('POST'); requireAuth();
$input=Request::input();
$date=trim((string)($input['start_date']??date('Y-m-d')));
if(!preg_match('/^\d{4}-\d{2}-\d{2}$/',$date) || !checkdate((int)substr($date,5,2),(int)substr($date,8,2),(int)substr($date,0,4))) Response::error('Start date is invalid.',422);
$name=Validator::optionalString($input['name']??null,120); $db=Database::getConnection();
try {
 $lock=$db->query("SELECT GET_LOCK('finance_active_period',5)")->fetchColumn(); if((int)$lock!==1) Response::error('Could not safely start the period. Please retry.',409);
 $db->beginTransaction();
 $active=$db->query("SELECT id FROM financial_periods WHERE status='active' LIMIT 1")->fetch(); if($active) Response::error('Close the active period before starting another.',409);
 $s=$db->prepare("SELECT id FROM financial_periods WHERE start_date <= :new_end AND COALESCE(end_date,'9999-12-31') >= :new_start LIMIT 1"); $s->execute(['new_end'=>$date,'new_start'=>$date]); if($s->fetch()) Response::error('The selected date overlaps an existing period.',409);
 $s=$db->prepare("INSERT INTO financial_periods(name,start_date,status) VALUES(:name,:start,'active')"); $s->execute(['name'=>$name,'start'=>$date]); $id=(int)$db->lastInsertId(); $db->commit();
 Response::success('Financial period started.',['period'=>['id'=>$id,'name'=>$name,'start_date'=>$date,'end_date'=>null,'status'=>'active']],201);
} catch(Throwable $e) { if($db->inTransaction()) $db->rollBack(); throw $e; }
finally { $db->query("SELECT RELEASE_LOCK('finance_active_period')"); }
