# Disaster Recovery (multi-cloud)

############################
# AWS RDS - Restore from snapshot
############################
variable "aws_snapshot_id" {
  description = "Existing RDS snapshot identifier (e.g., rds:therapy-db-snapshot-YYYY-MM-DD)"
  type        = string
  default     = null
}

variable "aws_instance_class" {
  description = "Instance class for restored DB"
  type        = string
  default     = "db.t3.micro"
}

resource "aws_db_instance" "therapy_restore" {
  count                = var.aws_snapshot_id == null ? 0 : 1
  identifier           = "therapy-db-restore"
  instance_class       = var.aws_instance_class
  engine               = "postgres"
  snapshot_identifier  = var.aws_snapshot_id
  skip_final_snapshot  = true
  publicly_accessible  = true
}

output "aws_restore_endpoint" {
  value       = length(aws_db_instance.therapy_restore) > 0 ? aws_db_instance.therapy_restore[0].address : null
  description = "Endpoint of restored AWS RDS instance"
}

############################
# GCP Cloud SQL - Restore via gcloud (local-exec)
############################
variable "gcp_project" {
  description = "GCP Project ID"
  type        = string
  default     = null
}

variable "gcp_region" {
  description = "GCP region (for context)"
  type        = string
  default     = "europe-west3"
}

variable "gcp_source_instance" {
  description = "Existing Cloud SQL instance id (source of backup)"
  type        = string
  default     = null
}

variable "gcp_backup_id" {
  description = "Backup run id to restore"
  type        = string
  default     = null
}

variable "gcp_target_instance" {
  description = "Target instance name to restore into (will be overwritten)"
  type        = string
  default     = null
}

resource "null_resource" "gcp_restore" {
  count = var.gcp_project != null && var.gcp_backup_id != null && var.gcp_target_instance != null ? 1 : 0
  provisioner "local-exec" {
    command = <<EOT
gcloud config set project ${var.gcp_project}
# NOTE: Review Cloud SQL restore semantics before running in prod!
# Common form:
# gcloud sql backups restore ${var.gcp_backup_id} --instance=${var.gcp_target_instance}
# If using destination instance flag:
# gcloud sql backups restore ${var.gcp_backup_id} --destination-instance=${var.gcp_target_instance}
echo "Please run Cloud SQL restore manually if needed, see comments above."
EOT
  }
}

############################
# Azure PostgreSQL Flexible Server - Point-in-time restore via az CLI
############################
variable "azure_resource_group" {
  type        = string
  default     = null
}

variable "azure_location" {
  type        = string
  default     = "westeurope"
}

variable "azure_source_server_name" {
  description = "Name of source flexible server"
  type        = string
  default     = null
}

variable "azure_target_server_name" {
  description = "New server name to create from restore"
  type        = string
  default     = "therapy-db-restore"
}

variable "azure_restore_time" {
  description = "ISO UTC time to restore to, e.g. 2025-09-04T10:00:00Z"
  type        = string
  default     = null
}

resource "null_resource" "azure_restore" {
  count = var.azure_resource_group != null && var.azure_source_server_name != null && var.azure_restore_time != null ? 1 : 0
  provisioner "local-exec" {
    command = <<EOT
# Requires 'az login' beforehand on the machine running Terraform
az postgres flexible-server restore   --resource-group ${var.azure_resource_group}   --name ${var.azure_target_server_name}   --source-server ${var.azure_source_server_name}   --restore-time ${var.azure_restore_time}
EOT
  }
}
