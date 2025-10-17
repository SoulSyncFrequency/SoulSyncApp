# Multi-cloud PostgreSQL Snapshots & Backups

# ==========================
# AWS RDS snapshots (retention policy)
# ==========================
resource "aws_db_instance" "therapy" {
  # Your existing RDS setup must be here
  backup_retention_period = 7   # keep 7 days
  backup_window           = "02:00-03:00"
}

# ==========================
# GCP Cloud SQL backups (daily automated)
# ==========================
resource "google_sql_database_instance" "therapy" {
  # Your existing Cloud SQL setup must be here
  settings {
    tier = "db-f1-micro"
    backup_configuration {
      enabled    = true
      start_time = "02:00"
    }
  }
}

# ==========================
# Azure PostgreSQL backups (retention policy)
# ==========================
resource "azurerm_postgresql_flexible_server" "therapy" {
  # Your existing Azure setup must be here
  backup_retention_days = 7
}
