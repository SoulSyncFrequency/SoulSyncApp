// GCP Cloud Run + Cloud SQL sample (simplified)
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

variable "project_id" { type = string }
variable "region" { type = string, default = "europe-west3" }
variable "image_url" { type = string }

resource "google_cloud_run_v2_service" "backend" {
  name     = "soulsync-backend"
  location = var.region
  template {
    containers {
      image = var.image_url
      ports { container_port = 3000 }
      env {
        name  = "NODE_ENV"
        value = "production"
      }
    }
  }
  ingress = "INGRESS_TRAFFIC_ALL"
}
