variable "site_domain" {
  description = "Apex domain managed in Cloudflare."
  type        = string
  default     = "gyeongho.dev"
}

variable "vercel_apex_ip" {
  description = "IPv4 address Vercel requires for the apex A record."
  type        = string
  default     = "76.76.21.21"
}

variable "vercel_www_target" {
  description = "Hostname Vercel requires for the www CNAME record."
  type        = string
  default     = "cname.vercel-dns.com"
}
