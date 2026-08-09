<?php

declare(strict_types=1);

final class Savings
{
    public function __construct(private PDO $db) {}

    public function list(): array
    {
        $stmt = $this->db->query(
            'SELECT id, name, target, saved, target_date
             FROM savings
             ORDER BY created_at DESC, id DESC'
        );

        return array_map(
            static function (array $row): array {
                return [
                    'id' => (int) $row['id'],
                    'name' => $row['name'],
                    'target' => (float) $row['target'],
                    'saved' => (float) $row['saved'],
                    'target_date' => $row['target_date'],
                ];
            },
            $stmt->fetchAll(PDO::FETCH_ASSOC)
        );
    }

    public function create(array $input): array
    {
        $name = trim((string) ($input['name'] ?? ''));
        $target = (float) ($input['target'] ?? 0);
        $saved = (float) ($input['saved'] ?? 0);
        $targetDate = !empty($input['target_date'])
            ? (string) $input['target_date']
            : null;

        if ($name === '') {
            throw new InvalidArgumentException(
                'Savings name is required.'
            );
        }

        if ($target <= 0) {
            throw new InvalidArgumentException(
                'Target must be greater than zero.'
            );
        }

        if ($saved < 0 || $saved > $target) {
            throw new InvalidArgumentException(
                'Saved amount must be between zero and the target.'
            );
        }

        $stmt = $this->db->prepare(
            'INSERT INTO savings
                (name, target, saved, target_date)
             VALUES
                (:name, :target, :saved, :target_date)'
        );

        $stmt->execute([
            'name' => $name,
            'target' => $target,
            'saved' => $saved,
            'target_date' => $targetDate,
        ]);

        return $this->find(
            (int) $this->db->lastInsertId()
        );
    }

    public function update(int $id, array $input): array
    {
        $name = trim((string) ($input['name'] ?? ''));
        $target = (float) ($input['target'] ?? 0);
        $saved = (float) ($input['saved'] ?? 0);
        $targetDate = !empty($input['target_date'])
            ? (string) $input['target_date']
            : null;

        if ($name === '') {
            throw new InvalidArgumentException(
                'Savings name is required.'
            );
        }

        if ($target <= 0) {
            throw new InvalidArgumentException(
                'Target must be greater than zero.'
            );
        }

        if ($saved < 0 || $saved > $target) {
            throw new InvalidArgumentException(
                'Saved amount must be between zero and the target.'
            );
        }

        $stmt = $this->db->prepare(
            'UPDATE savings
             SET name = :name,
                 target = :target,
                 saved = :saved,
                 target_date = :target_date
             WHERE id = :id'
        );

        $stmt->execute([
            'id' => $id,
            'name' => $name,
            'target' => $target,
            'saved' => $saved,
            'target_date' => $targetDate,
        ]);

        return $this->find($id);
    }

    public function delete(int $id): void
    {
        $stmt = $this->db->prepare(
            'DELETE FROM savings
             WHERE id = :id'
        );

        $stmt->execute([
            'id' => $id,
        ]);
    }

    private function find(int $id): array
    {
        $stmt = $this->db->prepare(
            'SELECT id, name, target, saved, target_date
             FROM savings
             WHERE id = :id
             LIMIT 1'
        );

        $stmt->execute([
            'id' => $id,
        ]);

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            throw new RuntimeException(
                'Savings goal not found.'
            );
        }

        return [
            'id' => (int) $row['id'],
            'name' => $row['name'],
            'target' => (float) $row['target'],
            'saved' => (float) $row['saved'],
            'target_date' => $row['target_date'],
        ];
    }
}
