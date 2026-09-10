# Tracking multiple programs

The monitor supports from one to many ITMO competition groups for the same applicant.

## Recommended configuration

Use `RATING_URLS` with URLs separated by commas or line breaks:

```env
RATING_URLS=https://abit.itmo.ru/rating/master/budget/PROGRAM_ID_1,https://abit.itmo.ru/rating/master/budget/PROGRAM_ID_2
```

`GENERAL_PLACES` can contain one value for every program:

```env
GENERAL_PLACES=66
```

or one value per URL, in the same order:

```env
GENERAL_PLACES=66,50
```

The old `RATING_URL` variable is still accepted for a single program.

Program names are read from the ITMO rating pages automatically. Previous snapshots are stored by rating URL, so changes are compared independently for each program.
