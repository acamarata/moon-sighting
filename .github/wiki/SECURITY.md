# Security Policy

## Supported versions

| Version | Supported |
| --- | --- |
| 1.x (latest) | Yes |
| < 1.0 | No |

## Reporting a vulnerability

moon-sighting is a pure astronomical computation library. It accepts observer coordinates and a date as input and returns visibility predictions. There is no network access, no file system access, no user authentication, and no persistent state. The JPL DE442S ephemeris data is bundled as a static binary blob.

Security vulnerabilities are unlikely given the surface area. That said, if you find something:

1. **Do not open a public issue.** That exposes the vulnerability before a fix is available.
2. Email **aric.camarata@gmail.com** with the subject line "Security: moon-sighting".
3. Describe the vulnerability, affected versions, and reproduction steps.
4. You will receive a response within 7 days.

## What counts as a security issue here

- An input that causes the library to execute arbitrary code
- A dependency with a known CVE that affects this package's behavior
- Prototype pollution via user-provided inputs
- Buffer overflow or memory corruption in the ephemeris parsing code

## What does not count

- Incorrect crescent visibility predictions (that is a bug, not a security issue)
- Missing input validation that causes incorrect output but no code execution
