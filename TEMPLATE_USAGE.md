# Using this repository as a template

This repository is intentionally configured so the upstream project does not run scheduled monitoring jobs.

After forking:

1. Configure GitHub Actions Variables:
   - `APPLICANT_ID`
   - `RATING_URLS`
   - `GENERAL_PLACES`
2. Configure GitHub Actions Secrets:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
3. Open `.github/workflows/admission-monitor.yml` and uncomment the `schedule` block.
4. Commit the workflow change in your fork.
5. Run the workflow manually once via `Actions → ITMO admission monitor → Run workflow` to verify the configuration.

## One program

```text
RATING_URLS=https://abit.itmo.ru/rating/master/budget/PROGRAM_ID
GENERAL_PLACES=66
```

The old `RATING_URL` variable is still accepted for backwards compatibility.

## Multiple programs

Separate URLs with commas or line breaks:

```text
RATING_URLS=https://abit.itmo.ru/rating/master/budget/PROGRAM_ID_1,https://abit.itmo.ru/rating/master/budget/PROGRAM_ID_2
```

Use one `GENERAL_PLACES` value for every program:

```text
GENERAL_PLACES=66
```

or provide one value per URL in the same order:

```text
GENERAL_PLACES=66,50
```

Program names are read from the ITMO pages automatically. The scheduled workflow is disabled in the upstream repository on purpose.
