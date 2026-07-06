<?php

declare(strict_types=1);

final class Account
{
    public function __construct(private PDO $db)
    {
    }

    public function list(): array
    {
        $statement = $this->db->query(
            'SELECT *
             FROM accounts
             ORDER BY created_at ASC'
        );

        return array_map([$this, 'transform'], $statement->fetchAll());
    }

    public function find(int $id): ?array
    {
        $statement = $this->db->prepare(
            'SELECT *
             FROM accounts
             WHERE id = :id
             LIMIT 1'
        );
        $statement->execute(['id' => $id]);
        $account = $statement->fetch();

        return $account ? $this->transform($account) : null;
    }

    public function create(array $input): array
    {
        $name = Validator::string($input['name'] ?? '', 'name');

        if ($this->nameExists($name)) {
            Response::error('Account name already exists.', 409);
        }

        $type = Validator::enum($input['type'] ?? 'bank', ['bank', 'cash', 'ewallet', 'other'], 'type');
        $colors = self::colorsForType($type);

        $statement = $this->db->prepare(
            'INSERT INTO accounts (name, type, balance, color, bg)
             VALUES (:name, :type, :balance, :color, :bg)'
        );
        $statement->execute([
            'name' => $name,
            'type' => $type,
            'balance' => Validator::amount($input['balance'] ?? 0, 'balance'),
            'color' => $input['color'] ?? $colors['color'],
            'bg' => $input['bg'] ?? $colors['bg'],
        ]);

        return $this->find((int) $this->db->lastInsertId());
    }

    public function update(int $id, array $input): array
    {
        if ($this->find($id) === null) {
            Response::error('Account not found.', 404);
        }

        $fields = [];
        $params = ['id' => $id];

        if (array_key_exists('name', $input)) {
            $name = Validator::string($input['name'], 'name');

            if ($this->nameExists($name, $id)) {
                Response::error('Account name already exists.', 409);
            }

            $fields[] = 'name = :name';
            $params['name'] = $name;
        }

        if (array_key_exists('type', $input)) {
            $type = Validator::enum($input['type'], ['bank', 'cash', 'ewallet', 'other'], 'type');
            $colors = self::colorsForType($type);
            $fields[] = 'type = :type';
            $fields[] = 'color = :color';
            $fields[] = 'bg = :bg';
            $params['type'] = $type;
            $params['color'] = $input['color'] ?? $colors['color'];
            $params['bg'] = $input['bg'] ?? $colors['bg'];
        }

        if (array_key_exists('balance', $input)) {
            $fields[] = 'balance = :balance';
            $params['balance'] = Validator::amount($input['balance'], 'balance');
        }

        if ($fields === []) {
            Response::error('No valid fields were provided.', 422);
        }

        $statement = $this->db->prepare(
            'UPDATE accounts
             SET ' . implode(', ', $fields) . '
             WHERE id = :id'
        );
        $statement->execute($params);

        return $this->find($id);
    }

    public function delete(int $id): void
    {
        $statement = $this->db->prepare('DELETE FROM accounts WHERE id = :id');
        $statement->execute(['id' => $id]);

        if ($statement->rowCount() === 0) {
            Response::error('Account not found.', 404);
        }
    }

    public function seedDefaults(): void
    {
        $defaults = [
            ['name' => 'Main Checking', 'type' => 'bank', 'balance' => '0.00'],
            ['name' => 'Cash Wallet', 'type' => 'cash', 'balance' => '0.00'],
            ['name' => 'PayPal', 'type' => 'ewallet', 'balance' => '0.00'],
        ];

        foreach ($defaults as $account) {
            $this->create($account);
        }
    }

    public static function colorsForType(string $type): array
    {
        return match ($type) {
            'cash' => ['color' => 'text-emerald-600', 'bg' => 'bg-emerald-100'],
            'ewallet' => ['color' => 'text-indigo-600', 'bg' => 'bg-indigo-100'],
            default => ['color' => 'text-blue-600', 'bg' => 'bg-blue-100'],
        };
    }

    private function transform(array $account): array
    {
        return [
            'id' => (int) $account['id'],
            'name' => (string) $account['name'],
            'balance' => (float) $account['balance'],
            'type' => (string) $account['type'],
            'color' => (string) $account['color'],
            'bg' => (string) $account['bg'],
            'created_at' => $account['created_at'] ?? null,
            'updated_at' => $account['updated_at'] ?? null,
        ];
    }

    private function nameExists(string $name, ?int $ignoreId = null): bool
    {
        $sql = 'SELECT id FROM accounts WHERE name = :name';
        $params = ['name' => $name];

        if ($ignoreId !== null) {
            $sql .= ' AND id <> :ignore_id';
            $params['ignore_id'] = $ignoreId;
        }

        $statement = $this->db->prepare($sql . ' LIMIT 1');
        $statement->execute($params);

        return (bool) $statement->fetch();
    }
}
