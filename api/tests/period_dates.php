<?php
declare(strict_types=1);

// Run: php api/tests/period_dates.php (requires pdo_sqlite).
require_once __DIR__ . '/../helpers/bootstrap.php';

$source = file_get_contents(__DIR__ . '/../periods/create.php');
if (!preg_match('/SELECT id FROM financial_periods WHERE COALESCE[^";]+/', $source, $match)) {
    throw new RuntimeException('Could not locate period boundary query.');
}
$db = new PDO('sqlite::memory:');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$db->exec('CREATE TABLE financial_periods (id INTEGER PRIMARY KEY, start_date TEXT, end_date TEXT)');
$insert = $db->prepare('INSERT INTO financial_periods VALUES (1, :start, :end)');
$query = $db->prepare($match[0]);
$cases = [
    ['2026-10-26', '2026-10-28', '2026-10-28', false],
    ['2026-10-26', '2026-10-28', '2026-10-29', false],
    ['2026-10-26', '2026-10-28', '2026-10-27', true],
    ['2026-10-26', '2026-10-28', '2026-10-25', true],
    ['2026-10-28', '2026-10-28', '2026-10-28', false],
    ['2026-10-26', null, '2026-10-29', true],
];
foreach ($cases as [$start, $end, $newStart, $blocked]) {
    $db->exec('DELETE FROM financial_periods');
    $insert->execute(['start' => $start, 'end' => $end]);
    $query->execute(['new_start' => $newStart]);
    if ((bool) $query->fetch() !== $blocked) {
        throw new RuntimeException("Incorrect boundary result for $start / $end / $newStart");
    }
}
$instant = new DateTimeImmutable('2026-10-28 18:00:00', new DateTimeZone('UTC'));
if ($instant->setTimezone(new DateTimeZone('Asia/Yangon'))->format('Y-m-d') !== '2026-10-29') {
    throw new RuntimeException('Myanmar midnight regression.');
}
echo "Passed 6 period boundary cases and Myanmar date rollover.\n";
