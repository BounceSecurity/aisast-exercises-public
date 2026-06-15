# Test 12 - NGINX Virtual Host Protection (Complex)

A more realistic collection of YAML configuration files for NGINX virtual server deployments, featuring protection profiles, mixed inline/referenced protection, mTLS, and exposure-based policies.

## Structure

- `vhosts/` — Virtual host configuration files organized by team/service
- `shared/` — Shared configuration including protection profiles

## Protection Policy

- Non-production servers exposed to the **internet** require at least **3** protection mechanisms
- Non-production servers on **internal** networks require at least **2** protection mechanisms
- Protection can be defined inline, via a shared profile, or a combination of both
- Available mechanisms: `ip_allowlist`, `oidc`, `basic_auth`, `mtls`
