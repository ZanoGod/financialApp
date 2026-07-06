<?php

declare(strict_types=1);

final class Category
{
    public function __construct(private PDO $db)
    {
    }

    public function list(): array
    {
        $statement = $this->db->query(
            'SELECT *
             FROM transaction_categories
             ORDER BY type ASC, name ASC'
        );

        return array_map([$this, 'transform'], $statement->fetchAll());
    }

    public function find(int $id): ?array
    {
        $statement = $this->db->prepare(
            'SELECT *
             FROM transaction_categories
             WHERE id = :id
             LIMIT 1'
        );
        $statement->execute(['id' => $id]);
        $category = $statement->fetch();

        return $category ? $this->transform($category) : null;
    }

    public function create(array $input): array
    {
        $name = Validator::string($input['name'] ?? '', 'name');
        $type = Validator::enum($input['type'] ?? 'expense', ['income', 'expense'], 'type');

        if ($this->nameExists($name, $type)) {
            Response::error('Category already exists.', 409);
        }

        $statement = $this->db->prepare(
            'INSERT INTO transaction_categories (name, type)
             VALUES (:name, :type)'
        );
        $statement->execute([
            'name' => $name,
            'type' => $type,
        ]);

        return $this->find((int) $this->db->lastInsertId());
    }

    public function update(int $id, array $input): array
    {
        $existing = $this->find($id);

        if ($existing === null) {
            Response::error('Category not found.', 404);
        }

        $fields = [];
        $params = ['id' => $id];
        $nextName = $input['name'] ?? null;
        $nextType = $input['type'] ?? null;

        if (array_key_exists('name', $input)) {
            $nextName = Validator::string($input['name'], 'name');
            $fields[] = 'name = :name';
            $params['name'] = $nextName;
        }

        if (array_key_exists('type', $input)) {
            $nextType = Validator::enum($input['type'], ['income', 'expense'], 'type');
            $fields[] = 'type = :type';
            $params['type'] = $nextType;
        }

        if ($fields === []) {
            Response::error('No valid fields were provided.', 422);
        }

        $name = is_string($nextName) ? $nextName : (string) $existing['name'];
        $type = is_string($nextType) ? $nextType : (string) $existing['type'];

        if ($this->nameExists($name, $type, $id)) {
            Response::error('Category already exists.', 409);
        }

        $statement = $this->db->prepare(
            'UPDATE transaction_categories
             SET ' . implode(', ', $fields) . '
             WHERE id = :id'
        );
        $statement->execute($params);

        return $this->find($id);
    }

    public function delete(int $id): void
    {
        $statement = $this->db->prepare(
            'DELETE FROM transaction_categories WHERE id = :id'
        );
        $statement->execute(['id' => $id]);

        if ($statement->rowCount() === 0) {
            Response::error('Category not found.', 404);
        }
    }

    public function seedDefaults(): void
    {
        $defaults = [
            ['name' => 'General', 'type' => 'expense'],
            ['name' => 'Food', 'type' => 'expense'],
            ['name' => 'Transport', 'type' => 'expense'],
            ['name' => 'Bills', 'type' => 'expense'],
            ['name' => 'Income', 'type' => 'income'],
            ['name' => 'Salary', 'type' => 'income'],
        ];

        foreach ($defaults as $category) {
            $this->create($category);
        }
    }

    private function transform(array $category): array
    {
        return [
            'id' => (int) $category['id'],
            'name' => (string) $category['name'],
            'type' => (string) $category['type'],
            'created_at' => $category['created_at'] ?? null,
            'updated_at' => $category['updated_at'] ?? null,
        ];
    }

    private function nameExists(string $name, string $type, ?int $ignoreId = null): bool
    {
        $sql = 'SELECT id
                FROM transaction_categories
                WHERE name = :name AND type = :type';
        $params = ['name' => $name, 'type' => $type];

        if ($ignoreId !== null) {
            $sql .= ' AND id <> :ignore_id';
            $params['ignore_id'] = $ignoreId;
        }

        $statement = $this->db->prepare($sql . ' LIMIT 1');
        $statement->execute($params);

        return (bool) $statement->fetch();
    }
}
