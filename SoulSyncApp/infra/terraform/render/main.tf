// Render Terraform sample (placeholder providers/resources)
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    render = {
      source  = "render-oss/render"
      version = "~> 1.0"
    }
  }
}

provider "render" {
  api_key = var.render_api_key
}

variable "render_api_key" { type = string }
variable "service_name" { type = string, default = "soulsync-backend" }

resource "render_web_service" "backend" {
  name = var.service_name
  runtime_source = "image"
  image {
    url = var.image_url
  }
  env = "docker"
  plan = "starter"
}

variable "image_url" { type = string }
