# General Instructions

- be concise
- read @README.md
- read @docs/README.md
- read @app-fe/README.md
- for big things pls follow req-refc-plan approach
  - create @docs/xxxx-req-feature.md discuss / adjust iterate
  - create @docs/xxxx-rfc-feature.md discuss / adjust iterate
  - create @docs/xxxx-pln-feature.md discuss / adjust iterate
  - implement
- never do big chunk of changes at once, if the patch is too big, first present a plan, then implement phase by phase, confirm each phase by user
- never git commit, create branches, push. Only use git to read history or if needed to do changes in the uncommitted patch
- never run terraform/terragrant/aws/db update commands, ask user to perform that action instead
