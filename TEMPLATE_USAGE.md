# Using this repository as a template

This repository is intentionally configured so the upstream project does not run scheduled monitoring jobs.

After forking:

1. Configure GitHub Actions Variables: `APPLICANT_ID`, `GENERAL_PLACES`, `RATING_URL`.
2. Configure GitHub Actions Secrets: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.
3. Open `.github/workflows/admission-monitor.yml` and uncomment the `schedule` block.
4. Commit the workflow change in your fork.
5. Run the workflow manually once via `Actions → ITMO admission monitor → Run workflow` to verify the configuration.

The scheduled workflow is disabled in the upstream repository on purpose.
