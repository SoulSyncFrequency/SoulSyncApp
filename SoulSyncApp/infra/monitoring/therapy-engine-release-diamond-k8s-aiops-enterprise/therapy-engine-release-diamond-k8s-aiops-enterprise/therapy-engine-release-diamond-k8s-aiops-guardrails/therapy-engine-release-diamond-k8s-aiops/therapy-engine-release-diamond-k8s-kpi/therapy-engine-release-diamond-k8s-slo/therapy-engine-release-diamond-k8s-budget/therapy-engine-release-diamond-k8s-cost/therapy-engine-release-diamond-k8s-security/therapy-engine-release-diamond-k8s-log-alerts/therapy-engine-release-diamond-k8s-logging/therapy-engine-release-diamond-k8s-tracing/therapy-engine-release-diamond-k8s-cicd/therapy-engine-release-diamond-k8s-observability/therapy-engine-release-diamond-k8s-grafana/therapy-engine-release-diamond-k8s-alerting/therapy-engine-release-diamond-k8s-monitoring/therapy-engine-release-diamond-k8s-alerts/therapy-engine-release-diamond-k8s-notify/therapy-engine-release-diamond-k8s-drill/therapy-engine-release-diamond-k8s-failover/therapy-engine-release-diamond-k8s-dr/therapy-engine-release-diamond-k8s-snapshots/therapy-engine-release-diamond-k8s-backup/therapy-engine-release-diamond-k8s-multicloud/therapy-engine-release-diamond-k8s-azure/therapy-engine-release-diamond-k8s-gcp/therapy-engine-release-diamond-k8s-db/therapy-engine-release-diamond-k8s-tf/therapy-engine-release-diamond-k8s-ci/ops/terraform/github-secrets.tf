terraform {
  required_providers {
    github = {
      source  = "integrations/github"
      version = "~> 5.0"
    }
  }
}

provider "github" {
  token = var.github_token
  owner = var.github_owner
}

variable "github_token" {
  description = "GitHub personal access token with repo/admin:repo_hook permissions"
  type        = string
}

variable "github_owner" {
  description = "GitHub org or user"
  type        = string
}

variable "repo_name" {
  description = "Name of the GitHub repository"
  type        = string
}

variable "secrets" {
  description = "Map of GitHub secrets"
  type        = map(string)
}

resource "github_actions_secret" "secrets" {
  for_each        = var.secrets
  repository      = var.repo_name
  secret_name     = each.key
  plaintext_value = each.value
}
