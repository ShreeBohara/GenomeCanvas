output "release_buckets" {
  description = "The name of each environment's releases bucket."
  value       = { for env, bucket in cloudflare_r2_bucket.releases : env => bucket.name }
}
