#!/bin/bash

# GitHub Environments Configuration Script
# This script configures the repository environments for the GitHub Deployments API integration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_OWNER="${GITHUB_REPOSITORY_OWNER:-themizzi}"
REPO_NAME="${GITHUB_REPOSITORY_NAME:-themizzi.github.io}"
GITHUB_TOKEN="${GITHUB_TOKEN}"

if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}Error: GITHUB_TOKEN environment variable is required${NC}"
    echo "Please set your GitHub token with 'repo' and 'admin:repo_hook' permissions"
    exit 1
fi

echo -e "${BLUE}Configuring GitHub Environments for ${REPO_OWNER}/${REPO_NAME}${NC}"
echo "=================================================="

# Function to create or update environment
create_environment() {
    local env_name="$1"
    local wait_timer="$2"
    local reviewers="$3"
    local deployment_branch_policy="$4"
    
    echo -e "${YELLOW}Configuring environment: ${env_name}${NC}"
    
    # Create environment configuration JSON
    local config="{
        \"wait_timer\": ${wait_timer},
        \"prevent_self_review\": false,
        \"reviewers\": ${reviewers},
        \"deployment_branch_policy\": ${deployment_branch_policy}
    }"
    
    # Create or update the environment
    local response=$(curl -s -w "%{http_code}" \
        -X PUT \
        -H "Accept: application/vnd.github+json" \
        -H "Authorization: Bearer ${GITHUB_TOKEN}" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        -d "$config" \
        "https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/environments/${env_name}")
    
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo -e "${GREEN}✅ Environment '${env_name}' configured successfully${NC}"
    else
        echo -e "${RED}❌ Failed to configure environment '${env_name}' (HTTP ${http_code})${NC}"
        echo "$body"
        return 1
    fi
}

# Configure Production Environment
echo -e "\n${BLUE}1. Configuring Production Environment${NC}"
create_environment "production" 0 "null" '{"protected_branches": true, "custom_branch_policies": false}'

# Configure Preview Environment Template
echo -e "\n${BLUE}2. Configuring Preview Environment Template${NC}"
# Note: We don't create individual PR environments here, they'll be created dynamically
# But we can create a template or base configuration
create_environment "preview" 0 "null" '{"protected_branches": false, "custom_branch_policies": false}'

echo -e "\n${GREEN}✅ Environment configuration completed!${NC}"
echo -e "\n${BLUE}Environment Summary:${NC}"
echo "• production: Automated deployment for main branch"
echo "• preview: Template for PR preview deployments (pr-{number} environments created dynamically)"
echo ""
echo -e "${YELLOW}Note:${NC} Individual PR environments (pr-1, pr-2, etc.) will be created automatically"
echo "when PRs are opened and deployments are triggered."
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Verify environments in GitHub: https://github.com/${REPO_OWNER}/${REPO_NAME}/settings/environments"
echo "2. Test deployment workflows to ensure environments are working correctly"
echo "3. Monitor deployment activity in the GitHub Deployments view"
