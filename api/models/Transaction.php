<?php

declare(strict_types=1);

final class Transaction
{
    public function __construct(private PDO $db)
    {
    }

    public function list(): array
    {
        $statement = $this->db->query(
            'SELECT t.*, a.name AS account_name, c.name AS category_name
             FROM transactions t
             INNER JOIN accounts a ON a.id = t.account_id
             LEFT JOIN transaction_categories c ON c.id = t.category_id
             ORDER BY t.transaction_date DESC, t.id DESC'
        );

        return array_map([$this, 'transform'], $statement->fetchAll());
    }

    public function find(int $id): ?array
    {
        $statement = $this->db->prepare(
            'SELECT t.*, a.name AS account_name, c.name AS category_name
             FROM transactions t
             INNER JOIN accounts a ON a.id = t.account_id
             LEFT JOIN transaction_categories c ON c.id = t.category_id
             WHERE t.id = :id
             LIMIT 1'
        );
        $statement->execute(['id' => $id]);
        $transaction = $statement->fetch();

        return $transaction ? $this->transform($transaction) : null;
    }

    public function create(array $input): array
    {
        Validator::requireFields($input, ['account_id', 'amount', 'type', 'date']);

        $accountId = Validator::int($input['account_id'], 'account_id');
        $this->assertAccountExists($accountId);
        $categoryId = $this->nullableCategoryId($input['category_id'] ?? null);
        $type = Validator::enum($input['type'], ['income', 'expense'], 'type');
        $amount = Validator::positiveAmount($input['amount'], 'amount');
        $date = $this->date($input['date']);
        $description = Validator::optionalString($input['desc'] ?? $input['description'] ?? null, 255);

        $this->db->beginTransaction();

        try {
            $statement = $this->db->prepare(
                'INSERT INTO transactions
                    (account_id, category_id, amount, type, description, transaction_date)
                 VALUES
                    (:account_id, :category_id, :amount, :type, :description, :transaction_date)'
            );
            $statement->execute([
                'account_id' => $accountId,
                'category_id' => $categoryId,
                'amount' => $amount,
                'type' => $type,
                'description' => $description,
                'transaction_date' => $date,
            ]);

            $transactionId = (int) $this->db->lastInsertId();
            $this->adjustAccountBalance($accountId, $this->delta($type, (float) $amount));
            $this->db->commit();
        } catch (Throwable $exception) {
            $this->db->rollBack();
            throw $exception;
        }

        return $this->find($transactionId);
    }

    public function update(int $id, array $input): array
    {
        $existing = $this->findRaw($id);

        if ($existing === null) {
            Response::error('Transaction not found.', 404);
        }

        $accountId = array_key_exists('account_id', $input)
            ? Validator::int($input['account_id'], 'account_id')
            : (int) $existing['account_id'];
        $this->assertAccountExists($accountId);

        $categoryId = array_key_exists('category_id', $input)
            ? $this->nullableCategoryId($input['category_id'])
            : ($existing['category_id'] !== null ? (int) $existing['category_id'] : null);
        $type = array_key_exists('type', $input)
            ? Validator::enum($input['type'], ['income', 'expense'], 'type')
            : (string) $existing['type'];
        $amount = array_key_exists('amount', $input)
            ? Validator::positiveAmount($input['amount'], 'amount')
            : (string) $existing['amount'];
        $date = array_key_exists('date', $input)
            ? $this->date($input['date'])
            : (string) $existing['transaction_date'];
        $description = array_key_exists('desc', $input) || array_key_exists('description', $input)
            ? Validator::optionalString($input['desc'] ?? $input['description'] ?? null, 255)
            : $existing['description'];

        $oldDelta = $this->delta((string) $existing['type'], (float) $existing['amount']);
        $newDelta = $this->delta($type, (float) $amount);

        $this->db->beginTransaction();

        try {
            if ((int) $existing['account_id'] !== $accountId) {
                $this->adjustAccountBalance((int) $existing['account_id'], -$oldDelta);
                $this->adjustAccountBalance($accountId, $newDelta);
            } else {
                $this->adjustAccountBalance($accountId, $newDelta - $oldDelta);
            }

            $statement = $this->db->prepare(
                'UPDATE transactions
                 SET account_id = :account_id,
                     category_id = :category_id,
                     amount = :amount,
                     type = :type,
                     description = :description,
                     transaction_date = :transaction_date
                 WHERE id = :id'
            );
            $statement->execute([
                'id' => $id,
                'account_id' => $accountId,
                'category_id' => $categoryId,
                'amount' => $amount,
                'type' => $type,
                'description' => $description,
                'transaction_date' => $date,
            ]);
            $this->db->commit();
        } catch (Throwable $exception) {
            $this->db->rollBack();
            throw $exception;
        }

        return $this->find($id);
    }

    public function delete(int $id): void
    {
        $existing = $this->findRaw($id);

        if ($existing === null) {
            Response::error('Transaction not found.', 404);
        }

        $this->db->beginTransaction();

        try {
            $this->adjustAccountBalance(
                (int) $existing['account_id'],
                -$this->delta((string) $existing['type'], (float) $existing['amount'])
            );

            $statement = $this->db->prepare('DELETE FROM transactions WHERE id = :id');
            $statement->execute(['id' => $id]);
            $this->db->commit();
        } catch (Throwable $exception) {
            $this->db->rollBack();
            throw $exception;
        }
    }

    private function findRaw(int $id): ?array
    {
        $statement = $this->db->prepare(
            'SELECT *
             FROM transactions
             WHERE id = :id
             LIMIT 1'
        );
        $statement->execute(['id' => $id]);
        $transaction = $statement->fetch();

        return $transaction ?: null;
    }

    private function assertAccountExists(int $accountId): void
    {
        $statement = $this->db->prepare(
            'SELECT id FROM accounts WHERE id = :id LIMIT 1'
        );
        $statement->execute(['id' => $accountId]);

        if (!$statement->fetch()) {
            Response::error('Account not found.', 404);
        }
    }

    private function nullableCategoryId(mixed $categoryId): ?int
    {
        if ($categoryId === null || $categoryId === '') {
            return null;
        }

        $categoryId = Validator::int($categoryId, 'category_id');
        $statement = $this->db->prepare(
            'SELECT id
             FROM transaction_categories
             WHERE id = :id
             LIMIT 1'
        );
        $statement->execute(['id' => $categoryId]);

        if (!$statement->fetch()) {
            Response::error('Category not found.', 404);
        }

        return $categoryId;
    }

    private function adjustAccountBalance(int $accountId, float $delta): void
    {
        $statement = $this->db->prepare(
            'UPDATE accounts SET balance = balance + :delta WHERE id = :id'
        );
        $statement->execute([
            'id' => $accountId,
            'delta' => number_format($delta, 2, '.', ''),
        ]);
    }

    private function delta(string $type, float $amount): float
    {
        return $type === 'income' ? $amount : -$amount;
    }

    private function date(mixed $value): string
    {
        $date = trim((string) $value);

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            Response::error('Date must use YYYY-MM-DD format.', 422);
        }

        [$year, $month, $day] = array_map('intval', explode('-', $date));

        if (!checkdate($month, $day, $year)) {
            Response::error('Date is invalid.', 422);
        }

        return $date;
    }

    private function transform(array $transaction): array
    {
        return [
            'id' => (int) $transaction['id'],
            'account_id' => (int) $transaction['account_id'],
            'category_id' => $transaction['category_id'] !== null ? (int) $transaction['category_id'] : null,
            'amount' => (float) $transaction['amount'],
            'type' => (string) $transaction['type'],
            'category' => $transaction['category_name'] ?: ((string) $transaction['type'] === 'income' ? 'Income' : 'General'),
            'account' => (string) $transaction['account_name'],
            'date' => (string) $transaction['transaction_date'],
            'desc' => (string) ($transaction['description'] ?? ''),
            'created_at' => $transaction['created_at'] ?? null,
            'updated_at' => $transaction['updated_at'] ?? null,
        ];
    }
}
