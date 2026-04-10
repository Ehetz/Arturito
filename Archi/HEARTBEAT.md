# HEARTBEAT.md

If no pending registration or storage task exists, reply exactly `HEARTBEAT_OK`.

If there are unregistered assets (created since last session without a registry entry):
- Register them in `registry/index.md`.
- Report what was registered.
