provider "azurerm" {
  features {}
}

variable "azure_resource_group" {
  default = "therapy-rg"
}

variable "azure_location" {
  default = "westeurope"
}

variable "db_name" {
  default = "therapydb"
}

variable "db_user" {
  default = "therapy_user"
}

variable "db_password" {
  description = "Database password"
  type        = string
}

resource "azurerm_resource_group" "therapy" {
  name     = var.azure_resource_group
  location = var.azure_location
}

resource "azurerm_postgresql_flexible_server" "therapy" {
  name                   = "therapy-postgres"
  resource_group_name    = azurerm_resource_group.therapy.name
  location               = azurerm_resource_group.therapy.location
  administrator_login    = var.db_user
  administrator_password = var.db_password
  version                = "15"

  storage_mb = 32768
  sku_name   = "B_Standard_B1ms"

  authentication {
    password_auth_enabled = true
  }
}

resource "azurerm_postgresql_flexible_server_database" "therapydb" {
  name      = var.db_name
  server_id = azurerm_postgresql_flexible_server.therapy.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

output "database_url" {
  value = "postgres://${var.db_user}:${var.db_password}@${azurerm_postgresql_flexible_server.therapy.fqdn}:5432/${var.db_name}"
}
