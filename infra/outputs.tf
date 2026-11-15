output "apex_record_id" {
  description = "ID of the apex DNS record."
  value       = cloudflare_dns_record.apex.id
}

output "www_record_id" {
  description = "ID of the www DNS record."
  value       = cloudflare_dns_record.www.id
}
