provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  default = "eu-central-1"
}

variable "db_name" {
  default = "therapy"
}

variable "db_username" {
  default = "therapy_user"
}

variable "db_password" {
  description = "Master password for DB"
  type        = string
}

resource "aws_db_instance" "therapy" {
  allocated_storage    = 20
  engine               = "postgres"
  engine_version       = "15"
  instance_class       = "db.t3.micro"
  identifier           = "therapy-db"
  username             = var.db_username
  password             = var.db_password
  db_name              = var.db_name
  skip_final_snapshot  = true
  publicly_accessible  = true
}

output "database_url" {
  value = "postgres://${var.db_username}:${var.db_password}@${aws_db_instance.therapy.address}:5432/${var.db_name}"
}
