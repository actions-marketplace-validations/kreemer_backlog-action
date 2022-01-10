# @kreemer/backlog-action

This action will add newly created GitHub issues to a Project (Beta) board and optionally label it for easier finding. Useful for a backlog over multiple repositories.

## Usage

Add a new pipeline:

```yaml
name: Add issue to backlog
on:
  issues:
    types:
      - reopened
      - opened

jobs:
  backlog:
    runs-on: ubuntu-latest
    steps:
      - uses: kreemer/backlog-action@v1
        with:
          owner: kreemer
          number: 1
          type: user
          github-token: ${{ secrets.PERSONAL_ACCESS_TOKEN }}
          label: verify
          label-color: 0E8A16
          label-description: Identifies all tasks which should be scrutinized
```

## Arguments

* `owner` (Required): Owner of the project, can be an user or an organisation
* `number` (Required): Number of the project. To find the project number, look at the project URL. For example, `https://github.com/orgs/octo-org/projects/5` has a project number of 5.
* `type` (Optional): Specifies if the owner is a user or an organisation. Defaults to `user`. Specify `org` for organisations.
* `github-token` (Required): Token which has access to said project board
* `label` (Optional): Name of the label which should be added to the issue. If left blank, no label will be created and the issue won't be labelled.
* `label-color` (Optional): Hex color without `#` for the label. 
* `label-description` (Optional): Description of the label. 
