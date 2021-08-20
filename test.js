const got = require('got');

got('https://github.com/legodude17/extractor/releases/latest', {
  followRedirect: false,
})
  .then((res) => console.log(res))
  .catch(console.error);
