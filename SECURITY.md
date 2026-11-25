# Security

## Supported versions

Only the `v2` branch is maintained. Version 1 (tag `v1.0.0`, branch `legacy`) is
frozen and receives no fixes.

## Reporting a vulnerability

Please report privately through GitHub: open the repository's **Security** tab and
choose **Report a vulnerability**. Do not open a public issue for a security
problem.

If private reporting is not available, open a public issue that asks for a
private contact and contains no details of the problem.

You can expect an acknowledgement within seven days. Fixes are released as soon
as they are ready, and reporters are credited unless they ask not to be.

## Scope

GenomeCanvas serves static files and runs one small Worker; it has no user
accounts. Reports about the Worker's model relay and its spending guard, about
injection through shared walkthroughs, and about leaked secrets are especially
welcome.
