# Deploy to Digital Ocean Action

This action deploys applications to Digital Ocean App Platform with optional GitHub Deployments API integration for enhanced deployment tracking and visibility.

## Features

* ✅ Deploy to Digital Ocean App Platform
* ✅ Support for PR preview deployments
* ✅ Automatic GitHub deployment status updates
* ✅ Integration with GitHub Deployments API
* ✅ Detailed build and deployment logs

## Usage

### Basic Deployment (without GitHub Deployments API)

```yaml
- name: Deploy to Digital Ocean
  uses: ./.github/actions/deploy-app
  with:
    token: ${{ secrets.DIGITAL_OCEAN_ACCESS_TOKEN }}
    app-id: ${{ env.APP_ID }}
```

### Deployment with GitHub Deployments API Integration

```yaml
- name: Create GitHub Deployment
  id: deployment
  uses: ./.github/actions/github-deployment
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    environment: 'production'
    action: 'create'      - name: Deploy to Digital Ocean
        id: deploy
        uses: ./.github/actions/deploy-app
        with:
          token: ${{ secrets.DIGITAL_OCEAN_ACCESS_TOKEN }}
          app-id: ${{ env.APP_ID }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deployment-id: ${{ steps.deployment.outputs.deployment-id }}
          environment: 'production'

---

For more information about GitHub Deployments API, see the [GitHub Deployment Management Action](../github-deployment/README.md).
```

### PR Preview Deployment

```yaml
- name: Create PR Deployment
  id: deployment
  uses: ./.github/actions/github-deployment
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    environment: 'pr-${{ github.event.pull_request.number }}'
    action: 'create'

- name: Deploy PR Preview
  uses: ./.github/actions/deploy-app
  with:
    token: ${{ secrets.DIGITAL_OCEAN_ACCESS_TOKEN }}
    app-id: ${{ env.APP_ID }}
    deploy-pr-preview: 'true'
    github-token: ${{ secrets.GITHUB_TOKEN }}
    deployment-id: ${{ steps.deployment.outputs.deployment-id }}
    environment: 'pr-${{ github.event.pull_request.number }}'
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `token` | Digital Ocean access token | ✅ | |
| `app-id` | Digital Ocean App ID | ✅ | |
| `deploy-pr-preview` | Whether to deploy PR preview | ❌ | `'false'` |
| `github-token` | GitHub token for deployment status updates | ❌ | |
| `deployment-id` | GitHub deployment ID to update status for | ❌ | |
| `environment` | Deployment environment name | ❌ | |

## Outputs

| Output | Description |
|--------|-------------|
| `app` | Full deployment output from Digital Ocean |
| `deployment-url` | URL of the deployed application |
| `deployment-id` | GitHub deployment ID (passthrough) |

## Behavior

### GitHub Deployments API Integration

When both `github-token` and `deployment-id` are provided:

1. **Pre-deployment**: Updates GitHub deployment status to `in_progress`
2. **Post-deployment**:
   * On success: Updates status to `success` with deployment URL
   * On failure: Updates status to `failure`

### Without GitHub Deployments API

When `github-token` or `deployment-id` are not provided, the action works exactly as before with no additional GitHub API calls.

## Digital Ocean Integration

This action uses the official `digitalocean/app_action/deploy@v2` action internally, providing:

* Automatic app deployment to Digital Ocean App Platform
* Build and deployment log output
* Support for PR preview environments
* Full integration with Digital Ocean's deployment pipeline

## Error Handling

* If the Digital Ocean deployment fails, the GitHub deployment status is automatically set to `failure`
* If GitHub deployment status updates fail, the Digital Ocean deployment continues normally
* The action is backwards compatible - existing workflows will continue to work without modification

## Complete Workflow Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

permissions:
  contents: read
  deployments: write

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
          description: 'Deploy to production'
          action: 'create'
          
      - name: Deploy to Digital Ocean
        uses: ./.github/actions/deploy-app
        with:
          token: ${{ secrets.DIGITAL_OCEAN_ACCESS_TOKEN }}
          app-id: ${{ env.APP_ID }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deployment-id: ${{ steps.deployment.outputs.deployment-id }}
          environment: 'production'
```
