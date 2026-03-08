# Backup & Recovery

## Daily snapshot strategy
- Store backups in `Pipeline/backups/`.
- Filename pattern: `pipeline-backup-<UTC timestamp>.json`.
- Create at least one backup daily (or before risky edits/restores).

## Export backup
```bash
python3 pipeline_cli.py backup-export
# optional custom path
python3 pipeline_cli.py backup-export --out /tmp/pipeline-backup.json
```

## Safe restore
```bash
python3 pipeline_cli.py backup-restore --file Pipeline/backups/<backup-file>.json
```

Restore safety behavior:
- CLI creates automatic pre-restore snapshot:
  - `Pipeline/backups/pipeline-pre-restore-<UTC timestamp>.json`
- Then applies selected backup.

## Rollback procedure
1. Identify last known-good backup file.
2. Run `backup-restore` with that file.
3. Verify with:
   - `python3 pipeline_cli.py list`
   - `python3 pipeline_cli.py next`
4. If restore result is wrong, restore from the auto-created pre-restore snapshot.
