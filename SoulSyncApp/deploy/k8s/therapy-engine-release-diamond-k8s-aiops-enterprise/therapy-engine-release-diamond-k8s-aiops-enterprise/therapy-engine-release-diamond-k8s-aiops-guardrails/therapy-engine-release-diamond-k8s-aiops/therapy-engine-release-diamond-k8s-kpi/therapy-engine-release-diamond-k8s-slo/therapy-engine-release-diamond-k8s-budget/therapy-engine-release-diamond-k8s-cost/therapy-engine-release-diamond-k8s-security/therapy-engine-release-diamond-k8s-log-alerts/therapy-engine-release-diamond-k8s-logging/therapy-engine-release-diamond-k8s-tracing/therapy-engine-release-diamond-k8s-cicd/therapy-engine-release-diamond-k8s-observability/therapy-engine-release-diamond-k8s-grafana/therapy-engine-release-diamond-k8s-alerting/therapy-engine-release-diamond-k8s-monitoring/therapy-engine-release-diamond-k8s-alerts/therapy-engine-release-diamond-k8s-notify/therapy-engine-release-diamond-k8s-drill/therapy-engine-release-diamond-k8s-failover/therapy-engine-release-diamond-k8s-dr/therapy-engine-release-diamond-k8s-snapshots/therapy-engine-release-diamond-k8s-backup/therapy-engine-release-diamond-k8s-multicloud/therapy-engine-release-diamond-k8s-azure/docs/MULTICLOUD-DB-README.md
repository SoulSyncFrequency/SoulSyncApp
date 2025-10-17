# Multi-Cloud Database Deployment Guide

This document explains how to provision PostgreSQL databases across AWS, GCP, and Azure using Terraform.

---

## 🌐 AWS RDS PostgreSQL
- **File**: `ops/terraform/postgres.tf`
- **Config**: `postgres.tfvars.example`

**Pros**:
- Most widely used, mature option.
- Best if you're already in AWS ecosystem (ECS/EKS, S3, Lambda).
- Large variety of instance types.

**Deploy**:
```bash
cd ops/terraform
terraform init
terraform apply -var-file=postgres.tfvars
```

---

## 🌐 GCP Cloud SQL PostgreSQL
- **File**: `ops/terraform/postgres-gcp.tf`
- **Config**: `postgres-gcp.tfvars.example`

**Pros**:
- Easiest integration with Google Kubernetes Engine (GKE).
- Console simpler than AWS.
- Lower entry-level costs for small instances.

**Deploy**:
```bash
gcloud auth application-default login
cd ops/terraform
terraform init
terraform apply -var-file=postgres-gcp.tfvars
```

---

## 🌐 Azure Database for PostgreSQL Flexible Server
- **File**: `ops/terraform/postgres-azure.tf`
- **Config**: `postgres-azure.tfvars.example`

**Pros**:
- Best fit if you are using Azure AKS and Microsoft ecosystem.
- Easy to configure High Availability.
- Good integration with Azure services.

**Deploy**:
```bash
az login
cd ops/terraform
terraform init
terraform apply -var-file=postgres-azure.tfvars
```

---

## ✅ How to Choose

- Use **AWS RDS** if you are already on AWS stack or need the broadest ecosystem.
- Use **GCP Cloud SQL** if you plan to use **GKE** and want simpler UX and pricing.
- Use **Azure PostgreSQL** if your infra is already on **Azure AKS** or Microsoft ecosystem.

All modules output `database_url` ready for your `.env` and GitHub Secrets (`DATABASE_URL`).

