import api, { route, storage } from '@forge/api';

const exampleContent = `"We ran the test, the app went bust, Turns out it's powered by pixie dust!" by ChatGPT 4o. `.repeat(100);

const getIssueProperty = async (issueIdOrKey, propertyKey) => {
  const response = await api.asApp().requestJira(route`/rest/api/3/issue/${issueIdOrKey}/properties/${propertyKey}`, {
    headers: { 'Accept': 'application/json' }
  });
  await response.json();

  console.log(`getIssueProperty response: ${response.status} ${response.statusText}`);
}

const setIssueProperty = async (issueIdOrKey, propertyKey) => {
  const response = await api.asApp().requestJira(route`/rest/api/3/issue/${issueIdOrKey}/properties/${propertyKey}`, {
    method: 'PUT',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content: exampleContent })
  });

  console.log(`setIssueProperty response: ${response.status} ${response.statusText}`);
}

const getStorageEntity = async (_issueIdOrKey, propertyKey) => {
  const response = await storage.get(propertyKey);

  console.log(`getStorageEntity response: ${response}`);
}

const setStorageEntity = async (_issueIdOrKey, propertyKey) => {
  const response = await storage.set(propertyKey, { content: exampleContent });

  console.log(`setStorageEntity response: ${response}`);
}

exports.runAsync = async (request) => {
  const check = request.queryParameters.check[0]; // 'checkSetIssueProperty' | 'checkGetIssueProperty' | 'checkSetStorageEntity' | 'checkGetStorageEntity'
  const issueIdOrKey = request.queryParameters.issueIdOrKey[0]; // 'TS-1'
  const propertyKey = request.queryParameters.propertyKey[0]; // 'test-property'
  const repetitions = Number(request.queryParameters.repetitions[0]); // '10'

  let checkingFunction;
  switch (check) {
    case 'checkSetIssueProperty':
      checkingFunction = setIssueProperty;
      break;
    case 'checkGetIssueProperty':
      checkingFunction = getIssueProperty;
      break;
    case 'checkSetStorageEntity':
      checkingFunction = setStorageEntity;
      break;
    case 'checkGetStorageEntity':
      checkingFunction = getStorageEntity;
      break;
    default:
      return { statusCode: 400 }
  }

  const totalStartTime = performance.now();
  const checkTimeArr = [];
  for (let i = 0; i < repetitions; i++) {
    const startTime = performance.now();
    await checkingFunction(issueIdOrKey, propertyKey);
    checkTimeArr.push(Math.round(performance.now() - startTime));
  }
  const totalTime = Math.round(performance.now() - totalStartTime)
  const average = Math.round(checkTimeArr.reduce((a, b) => a + b) / checkTimeArr.length);

  return {
    body: JSON.stringify({ check, repetitions, average, totalTime, checkTimeArr }),
    headers: { 'Content-Type': ['application/json'] },
    statusCode: 200,
  }
};
