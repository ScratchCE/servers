# Scratch CE Servers

Work in progress servers for Scratch Community Edition, combining projects, assets and eventually api into one.

## Setting up the Database

At first, the app will likely error because the database files are gitignored and they aren't currently auto-generated yet. To fix this, create the following files/folders:

- `db/database.json` (file, must be valid JSON)
- `db/database-backup.json` (file, must be valid JSON, currently not actually used for loading)
- `db/projects/` (folder, can be left empty)
- `db/assets/` (folder, can be left empty)
