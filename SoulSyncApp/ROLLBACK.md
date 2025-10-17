# Rollback Procedure

If a deployment causes issues, you can trigger a rollback.

## Manual Rollback
```
helm rollback soulsync <REVISION>
```

You can view revisions with:
```
helm history soulsync
```

## GitHub Action Rollback
Run the workflow **Helm Rollback** manually and provide the `revision` number.
