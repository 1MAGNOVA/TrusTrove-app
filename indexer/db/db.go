package db

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sort"

	"github.com/jackc/pgx/v5/pgxpool"
)

var Pool *pgxpool.Pool

func InitDB(ctx context.Context, databaseURL string) error {
	var err error
	Pool, err = pgxpool.New(ctx, databaseURL)
	if err != nil {
		return fmt.Errorf("db: failed to connect to database: %w", err)
	}

	// Ping database to confirm connection
	if err := Pool.Ping(ctx); err != nil {
		return fmt.Errorf("db: failed to ping database: %w", err)
	}

	// Run initial migration
	if err := RunMigration(ctx); err != nil {
		return fmt.Errorf("db: failed to run migrations: %w", err)
	}

	return nil
}

func RunMigration(ctx context.Context) error {
	migrationsDir := filepath.Join("db", "migrations")
	_, err := os.Stat(migrationsDir)
	if err != nil {
		// Fallback for execution from the monorepo root
		migrationsDir = filepath.Join("indexer", "db", "migrations")
		_, err = os.Stat(migrationsDir)
		if err != nil {
			return fmt.Errorf("failed to find migrations directory: %w", err)
		}
	}

	files, err := os.ReadDir(migrationsDir)
	if err != nil {
		return fmt.Errorf("failed to read migrations directory: %w", err)
	}

	var sqlFiles []string
	for _, file := range files {
		if !file.IsDir() && filepath.Ext(file.Name()) == ".sql" {
			sqlFiles = append(sqlFiles, file.Name())
		}
	}

	sort.Strings(sqlFiles)

	for _, filename := range sqlFiles {
		path := filepath.Join(migrationsDir, filename)
		migrationBytes, err := os.ReadFile(path)
		if err != nil {
			return fmt.Errorf("failed to read migration file %s: %w", filename, err)
		}

		_, err = Pool.Exec(ctx, string(migrationBytes))
		if err != nil {
			return fmt.Errorf("failed to execute migration script %s: %w", filename, err)
		}
	}

	return nil
}
