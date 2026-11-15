terraform {
  required_version = "~> 1.15"

  cloud {
    organization = "ghkim"

    workspaces {
      name = "gyeongho-dev"
    }
  }

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.29"
    }
  }
}

provider "cloudflare" {}
