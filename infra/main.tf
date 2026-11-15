data "cloudflare_zone" "site" {
  filter = {
    name = var.site_domain
  }
}

# Vercel issues the TLS certificate itself, so the records must not be proxied.
resource "cloudflare_dns_record" "apex" {
  zone_id = data.cloudflare_zone.site.zone_id
  name    = var.site_domain
  type    = "A"
  content = var.vercel_apex_ip
  ttl     = 1
  proxied = false
}

resource "cloudflare_dns_record" "www" {
  zone_id = data.cloudflare_zone.site.zone_id
  name    = "www.${var.site_domain}"
  type    = "CNAME"
  content = var.vercel_www_target
  ttl     = 1
  proxied = false
}
