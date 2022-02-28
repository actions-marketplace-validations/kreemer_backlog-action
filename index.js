const core = require('@actions/core');
const github = require('@actions/github');


async function run() {
  const token = core.getInput('github-token');
  const octokit = github.getOctokit(token);
  const context = github.context;

  const config = {
    project: {
      owner: core.getInput('owner'),
      number: parseInt(core.getInput('number')),
      type: core.getInput('type'),
    },
    issue: {
      number: context.payload.issue && context.payload.issue.number,
      id: context.payload.issue && context.payload.issue.node_id,
      owner: context.payload.repository.owner.login,
      repository: context.payload.repository.name
    },
    label: {
      name: core.getInput('label'),
      color: core.getInput('label-color'),
      description: core.getInput('label-description')
    }
  };

  try {
    const projectResponse = await getProjectId(octokit, token, config.project.owner, config.project.number, config.project.type);
    if (projectResponse === undefined || extractProjectId(projectResponse) === undefined) {
      core.info('Could not get project id from ' + config.project.owner + '/' + config.project.number);
    } else {
      const projectId = extractProjectId(projectResponse);
    
      core.info('Enumerated projectId: ' + projectId);
      await addIssueToProject(octokit, token, projectId, config.issue.id);
      core.info('Issue added to project board');
    }
  } catch (error) {
    core.setFailed(error.message);
  }

  if (config.label.name !== '') {
    core.info('Labeling newly created / reopened issue');
    try {  
      await getLabel(octokit, config.issue.owner, config.issue.repository, config.label.name);
      core.info('Label exists, continue');
    }catch (error) {
      core.info('Label does not exist, creating...');
      try {
        await createLabel(octokit, config.issue.owner, config.issue.repository, config.label.name, config.label.description, config.label.color);
      }catch (error) {
        core.setFailed(error.message);
      }
    }
    
    try {
      await addLabelToIssue(octokit, config.issue.owner, config.issue.repository, config.issue.number, [ config.label.name ]);
    } catch (error) {
      core.setFailed(error.message);
    }
  }
}

function extractProjectId(response) {
  if (response.user && response.user.projectNext && response.user.projectNext.id) {
    return response.user.projectNext.id;
  } else if (response.organization && response.organization.projectNext && response.organization.projectNext.id) {
    return response.organization.projectNext.id;
  }
  return undefined;
}

async function getProjectId(client, token, owner, number, type) {
  if (type === 'user') {
    return client.graphql(`
      query getUserProjectId ($user:String!, $number:Int!) {
          user(login: $user){
            projectNext(number: $number) {
              id
            }
          }
        
      }`,
      {
        user: owner,
        number: number,
        headers: {
          authorization: `token ` + token,
        },
    });
  } else if (type === 'org') {
    return client.graphql(`
      query getUserProjectId ($org:String!, $number:Int!) {
          organization(login: $org){
            projectNext(number: $number) {
              id
            }
        }
      }`,
      {
        org: owner,
        number: number,
        headers: {
          authorization: `token ` + token,
        },
    });
  } 
  
  return undefined

}


async function addIssueToProject(client, token, projectId, issueId) {
  return client.graphql(`
    mutation addProjectNextItemMutation ($projectId:ID!, $contentId:ID!) {
      addProjectNextItem(input: {projectId: $projectId, contentId: $contentId}) {
        projectNextItem {
          id
        }
      }
    }`,
    {
      projectId: projectId,
      contentId: issueId,
      headers: {
        authorization: `token ` + token,
      },
  });
}

async function getLabel(client, owner, repository, name) {
  return client.request('GET /repos/{owner}/{repo}/labels/{name}', {
    owner: owner,
    repo: repository,
    name: name
  });
}

async function createLabel(client, owner, repository, name, description, color) {
  return client.request('POST /repos/{owner}/{repo}/labels', {
    owner: owner,
    repo: repository,
    name: name,
    description: description,
    color: color,
  });
}

async function addLabelToIssue(client, owner, repository, issueNumber, labels) {
  return client.rest.issues.addLabels({
    owner: owner,
    repo: repository,
    issue_number: issueNumber,
    labels: labels
  });
}

run();
