<?php

declare(strict_types=1);

final class Loan
{
    public function __construct(private PDO $db)
    {
    }

    public function list(): array
    {
        $statement = $this->db->query(
            'SELECT *
             FROM loans
             ORDER BY created_at DESC'
        );

        return array_map([$this, 'transform'], $statement->fetchAll());
    }

    public function find(int $id): ?array
    {
        $statement = $this->db->prepare(
            'SELECT *
             FROM loans
             WHERE id = :id
             LIMIT 1'
        );
        $statement->execute(['id' => $id]);
        $loan = $statement->fetch();

        return $loan ? $this->transform($loan) : null;
    }

    public function create(array $input): array
    {
        $total = Validator::positiveAmount($input['total'] ?? $input['total_amount'] ?? 0, 'total');
        $remaining = array_key_exists('remaining', $input)
            ? Validator::amount($input['remaining'], 'remaining')
            : (array_key_exists('remaining_amount', $input)
                ? Validator::amount($input['remaining_amount'], 'remaining')
                : $total);

        if ((float) $remaining > (float) $total) {
            Response::error('Remaining amount cannot be greater than total amount.', 422);
        }

        $statement = $this->db->prepare(
            'INSERT INTO loans (name, type, total_amount, remaining_amount)
             VALUES (:name, :type, :total_amount, :remaining_amount)'
        );
        $statement->execute([
            'name' => Validator::string($input['name'] ?? '', 'name'),
            'type' => Validator::enum($input['type'] ?? 'borrowed', ['borrowed', 'lent'], 'type'),
            'total_amount' => $total,
            'remaining_amount' => $remaining,
        ]);

        return $this->find((int) $this->db->lastInsertId());
    }

    public function update(int $id, array $input): array
    {
        $existing = $this->find($id);

        if ($existing === null) {
            Response::error('Loan not found.', 404);
        }

        $fields = [];
        $params = ['id' => $id];

        if (array_key_exists('name', $input)) {
            $fields[] = 'name = :name';
            $params['name'] = Validator::string($input['name'], 'name');
        }

        if (array_key_exists('type', $input)) {
            $fields[] = 'type = :type';
            $params['type'] = Validator::enum($input['type'], ['borrowed', 'lent'], 'type');
        }

        if (array_key_exists('total', $input) || array_key_exists('total_amount', $input)) {
            $fields[] = 'total_amount = :total_amount';
            $params['total_amount'] = Validator::positiveAmount(
                $input['total'] ?? $input['total_amount'],
                'total'
            );
        }

        if (array_key_exists('remaining', $input) || array_key_exists('remaining_amount', $input)) {
            $fields[] = 'remaining_amount = :remaining_amount';
            $params['remaining_amount'] = Validator::amount(
                $input['remaining'] ?? $input['remaining_amount'],
                'remaining'
            );
        }

        $total = (float) ($params['total_amount'] ?? $existing['total']);
        $remaining = (float) ($params['remaining_amount'] ?? $existing['remaining']);

        if ($remaining > $total) {
            Response::error('Remaining amount cannot be greater than total amount.', 422);
        }

        if ($fields === []) {
            Response::error('No valid fields were provided.', 422);
        }

        $statement = $this->db->prepare(
            'UPDATE loans
             SET ' . implode(', ', $fields) . '
             WHERE id = :id'
        );
        $statement->execute($params);

        return $this->find($id);
    }

    public function delete(int $id): void
    {
        $statement = $this->db->prepare('DELETE FROM loans WHERE id = :id');
        $statement->execute(['id' => $id]);

        if ($statement->rowCount() === 0) {
            Response::error('Loan not found.', 404);
        }
    }

    private function transform(array $loan): array
    {
        return [
            'id' => (int) $loan['id'],
            'name' => (string) $loan['name'],
            'total' => (float) $loan['total_amount'],
            'remaining' => (float) $loan['remaining_amount'],
            'type' => (string) $loan['type'],
            'created_at' => $loan['created_at'] ?? null,
            'updated_at' => $loan['updated_at'] ?? null,
        ];
    }
}
