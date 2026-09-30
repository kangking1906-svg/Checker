# Short Username Checker

A responsive 2/3/4-character username generator with search, filters, copy buttons, and bulk copy.

## Important
The included frontend deliberately reports generated names as **Unable to verify** until a legitimate platform API is connected. This avoids falsely claiming usernames are available.

To make real availability checks, implement `verifyUsername()` through a backend endpoint and connect that backend to the target platform's official API. Store credentials in Replit Secrets, not frontend code.
