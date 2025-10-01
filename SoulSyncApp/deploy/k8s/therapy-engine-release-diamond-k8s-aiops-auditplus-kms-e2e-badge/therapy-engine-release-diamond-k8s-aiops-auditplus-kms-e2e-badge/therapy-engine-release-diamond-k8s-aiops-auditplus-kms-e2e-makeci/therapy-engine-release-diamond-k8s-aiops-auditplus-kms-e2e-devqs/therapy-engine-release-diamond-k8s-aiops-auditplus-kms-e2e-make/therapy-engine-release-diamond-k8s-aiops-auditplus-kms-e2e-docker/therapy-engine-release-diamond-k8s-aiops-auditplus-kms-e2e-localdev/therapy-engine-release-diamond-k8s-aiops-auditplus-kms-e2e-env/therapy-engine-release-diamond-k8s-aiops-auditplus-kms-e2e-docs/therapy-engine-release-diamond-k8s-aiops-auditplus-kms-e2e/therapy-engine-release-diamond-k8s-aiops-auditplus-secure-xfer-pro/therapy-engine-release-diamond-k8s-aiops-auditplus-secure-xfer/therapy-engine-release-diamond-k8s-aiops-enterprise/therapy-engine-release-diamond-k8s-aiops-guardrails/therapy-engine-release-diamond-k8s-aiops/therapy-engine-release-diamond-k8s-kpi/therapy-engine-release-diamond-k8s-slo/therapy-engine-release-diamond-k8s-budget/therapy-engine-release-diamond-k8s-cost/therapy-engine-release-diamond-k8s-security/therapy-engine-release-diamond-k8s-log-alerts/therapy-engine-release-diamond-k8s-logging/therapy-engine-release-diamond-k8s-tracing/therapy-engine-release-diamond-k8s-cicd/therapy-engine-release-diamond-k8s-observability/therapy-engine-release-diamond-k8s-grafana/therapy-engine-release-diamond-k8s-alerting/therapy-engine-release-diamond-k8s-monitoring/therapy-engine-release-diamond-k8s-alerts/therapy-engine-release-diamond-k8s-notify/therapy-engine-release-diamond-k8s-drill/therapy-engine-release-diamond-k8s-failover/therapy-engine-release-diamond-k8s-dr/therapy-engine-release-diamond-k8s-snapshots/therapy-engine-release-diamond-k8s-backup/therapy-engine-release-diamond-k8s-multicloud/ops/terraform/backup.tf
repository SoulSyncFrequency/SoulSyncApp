# Multi-cloud Backup & Disaster Recovery

# ==========================
# AWS S3 Backup Bucket
# ==========================
provider "aws" {
  region = var.aws_region
}

resource "aws_s3_bucket" "therapy_backups" {
  bucket = "therapy-db-backups-${var.aws_region}-${random_id.unique.hex}"
  acl    = "private"
}

output "aws_backup_bucket" {
  value = aws_s3_bucket.therapy_backups.bucket
}

# ==========================
# GCP Cloud Storage Bucket
# ==========================
provider "google" {
  project = var.gcp_project
  region  = var.gcp_region
}

resource "google_storage_bucket" "therapy_backups" {
  name          = "${var.gcp_project}-therapy-db-backups-${random_id.unique.hex}"
  location      = var.gcp_region
  force_destroy = true
}

output "gcp_backup_bucket" {
  value = google_storage_bucket.therapy_backups.url
}

# ==========================
# Azure Blob Storage Container
# ==========================
provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "backup" {
  name     = "therapy-backup-rg"
  location = var.azure_location
}

resource "azurerm_storage_account" "backup" {
  name                     = "therapybackup${random_id.unique.hex}"
  resource_group_name      = azurerm_resource_group.backup.name
  location                 = azurerm_resource_group.backup.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_storage_container" "therapy_backups" {
  name                  = "therapy-db-backups"
  storage_account_name  = azurerm_storage_account.backup.name
  container_access_type = "private"
}

output "azure_backup_container" {
  value = azurerm_storage_container.therapy_backups.name
}

# ==========================
# Random suffix for unique names
# ==========================
resource "random_id" "unique" {
  byte_length = 4
}
