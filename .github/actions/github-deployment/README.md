# GitHub Deployment Action

This action manages GitHub deployments through the Deployments API, providing enhanced visibility and tracking for deployment workflows.

## Features

* ✅ Create new deployments
* ✅ Update deployment status throughout the process
* ✅ Mark deployments as inactive (for cleanup)
* ✅ Automatic status descriptions
* ✅ Support for transient environments (PR previews)
* ✅ Integration with GitHub Actions logs

## Usage

### Creating a Deployment

```yaml
- name: Create Deployment
  id: deployment
  uses: ./.github/actions/github-deployment
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    environment: 'production'
    ref: ${{ github.sha }}
    description: 'Deploy to production'
    action: 'create'
```

### Updating Deployment Status

```yaml
- name: Update Deployment to In Progress
  uses: ./.github/actions/github-deployment
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    deployment-id: ${{ steps.deployment.outputs.deployment-id }}
    action: 'update-status'
    status: 'in_progress'

- name: Mark Deployment Success
  uses: ./.github/actions/github-deployment
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    deployment-id: ${{ steps.deployment.outputs.deployment-id }}
    action: 'update-status'
    status: 'success'
    deployment-url: 'https://myapp.com'
```

### Marking Deployment Inactive

```yaml
- name: Cleanup Old Deployment
  uses: ./.github/actions/github-deployment
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    deployment-id: ${{ needs.deploy.outputs.deployment-id }}
    action: 'mark-inactive'
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `github-token` | GitHub token with deployments scope | ✅ | |
| `environment` | Deployment environment name | ✅ | |
| `ref` | Git reference being deployed | ✅ | `${{ github.sha }}` |
| `deployment-url` | Final deployment URL | ❌ | |
| `description` | Deployment description | ❌ | `'Automated deployment'` |
| `action` | Action: `create`, `update-status`, `mark-inactive` | ✅ | `'create'` |
| `deployment-id` | Deployment ID (for updates) | ❌ | |
| `status` | Status: `pending`, `in_progress`, `success`, `failure`, `error` | ❌ | `'pending'` |
| `log-url` | URL to deployment logs | ❌ | GitHub Actions run URL |

## Outputs

| Output | Description |
|--------|-------------|
| `deployment-id` | ID of the created or updated deployment |
| `deployment-url` | URL of the deployment environment |

## Environment Names

* **Production**: `production`
* **PR Previews**: `pr-{number}` (e.g., `pr-123`)

## Deployment States

* `pending`: Deployment created, waiting to start
* `in_progress`: Deployment actively running  
* `success`: Deployment completed successfully
* `failure`: Deployment failed (app/build issues)
* `error`: Deployment errored (infrastructure/process issues)
* `inactive`: Deployment no longer active

## Complete Workflow Example

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Create Deployment
        id: deployment
        uses: ./.github/actions/github-deployment
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          environment: 'production'
          action: 'create'
          
      - name: Update to In Progress
        uses: ./.github/actions/github-deployment
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deployment-id: ${{ steps.deployment.outputs.deployment-id }}
          action: 'update-status'
          status: 'in_progress'
          
      - name: Deploy Application
        id: deploy
        run: |
          # Your deployment logic here
          echo "deployment-url=https://myapp.com" >> $GITHUB_OUTPUT
          
      - name: Mark Success
        if: success()
        uses: ./.github/actions/github-deployment
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deployment-id: ${{ steps.deployment.outputs.deployment-id }}
          action: 'update-status'
          status: 'success'
          deployment-url: ${{ steps.deploy.outputs.deployment-url }}
          
      - name: Mark Failure
        if: failure()
        uses: ./.github/actions/github-deployment
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deployment-id: ${{ steps.deployment.outputs.deployment-id }}
          action: 'update-status'
          status: 'failure'
```
