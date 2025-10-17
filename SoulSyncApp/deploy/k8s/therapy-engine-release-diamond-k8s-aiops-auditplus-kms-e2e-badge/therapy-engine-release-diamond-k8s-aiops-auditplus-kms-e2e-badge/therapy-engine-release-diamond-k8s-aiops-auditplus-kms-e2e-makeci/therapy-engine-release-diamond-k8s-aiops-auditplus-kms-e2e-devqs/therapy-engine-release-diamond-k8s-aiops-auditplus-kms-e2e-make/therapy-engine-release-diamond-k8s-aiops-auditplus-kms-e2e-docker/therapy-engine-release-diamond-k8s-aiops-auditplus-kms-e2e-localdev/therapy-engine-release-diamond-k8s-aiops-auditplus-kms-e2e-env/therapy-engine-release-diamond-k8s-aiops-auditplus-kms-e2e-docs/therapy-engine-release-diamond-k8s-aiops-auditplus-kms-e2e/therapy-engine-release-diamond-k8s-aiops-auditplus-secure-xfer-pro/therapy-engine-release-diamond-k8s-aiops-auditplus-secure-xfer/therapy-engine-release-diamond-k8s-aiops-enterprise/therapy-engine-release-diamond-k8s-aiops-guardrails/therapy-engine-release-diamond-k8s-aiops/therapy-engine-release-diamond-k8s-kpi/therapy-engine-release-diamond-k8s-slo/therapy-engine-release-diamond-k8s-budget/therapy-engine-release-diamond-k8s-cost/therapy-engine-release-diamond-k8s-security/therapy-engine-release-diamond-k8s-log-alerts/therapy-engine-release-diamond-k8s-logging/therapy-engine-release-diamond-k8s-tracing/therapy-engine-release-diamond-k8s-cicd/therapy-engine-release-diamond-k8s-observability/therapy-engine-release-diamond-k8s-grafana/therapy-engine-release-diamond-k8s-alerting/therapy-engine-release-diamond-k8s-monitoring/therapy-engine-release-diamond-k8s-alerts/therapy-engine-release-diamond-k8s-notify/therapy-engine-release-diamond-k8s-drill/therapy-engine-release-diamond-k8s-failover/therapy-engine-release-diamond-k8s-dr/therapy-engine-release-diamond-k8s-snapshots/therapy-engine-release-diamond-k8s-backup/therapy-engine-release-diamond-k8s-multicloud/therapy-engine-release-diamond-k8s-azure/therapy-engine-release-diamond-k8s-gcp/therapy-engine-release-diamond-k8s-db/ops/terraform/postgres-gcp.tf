provider "google" {
  project = var.gcp_project
  region  = var.gcp_region
}

variable "gcp_project" {
  description = "GCP Project ID"
  type        = string
}

variable "gcp_region" {
  default = "europe-west3" # Frankfurt
}

variable "db_name" {
  default = "therapy"
}

variable "db_user" {
  default = "therapy_user"
}

variable "db_password" {
  description = "Database user password"
  type        = string
}

resource "google_sql_database_instance" "therapy" {
  name             = "therapy-db"
  database_version = "POSTGRES_15"
  region           = var.gcp_region

  settings {
    tier = "db-f1-micro"
    ip_configuration {
      ipv4_enabled = true
      authorized_networks {
        name  = "public"
        value = "0.0.0.0/0"
      }
    }
    backup_configuration {
      enabled = true
    }
  }
}

resource "google_sql_database" "therapy" {
  name     = var.db_name
  instance = google_sql_database_instance.therapy.name
}

resource "google_sql_user" "therapy_user" {
  name     = var.db_user
  instance = google_sql_database_instance.therapy.name
  password = var.db_password
}

output "database_url" {
  value = "postgres://${var.db_user}:${var.db_password}@${google_sql_database_instance.therapy.public_ip_address}:5432/${var.db_name}"
}
