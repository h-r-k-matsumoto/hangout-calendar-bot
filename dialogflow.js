
/**
 *　Dialogflow解析結果
 *
 * @param {boolean} isDetect true:success、false:failure
 * @param {string} message isDetect = falseの場合にユーザーに表示すべきメッセージ。
 * @param {string[]} groups カレンダーイベント抽出条件：グループ名
 * @param {string[]} persons カレンダーイベント抽出条件：ユーザー名
 * @param {Date} startDate カレンダーイベント抽出条件：開始日時
 * @param {Date} endDate カレンダーイベント抽出条件：終了日時
 * @param {boolean} isNow true:現在の予定を抽出、false:それ以外
 */
var ResultIntent = function (isDetect, message, groups, persons, startDate, endDate, isNow) {
  this.isDetect = isDetect;
  this.message = message;
  this.groups = groups || [];
  this.persons = persons || [];
  this.startDate = startDate;
  this.endDate = endDate;
  this.isNow = isNow;
}


/**
 * Dialogflowを表します。
 *
 * @param {string} id - セッションID
 * @param {string} email - 呼び出したユーザーを特定するためのemailアドレス
 */
var Dialogflow = function (id, email) {
  this.id = id.replace(/\//g, '-');
  this.email = email;
}

/**
 * DialogflowのdetectIntent APIを呼び出します。
 * https://dialogflow.com/docs/reference/api-v2/rest/v2/projects.agent.sessions/detectIntent
 * @param {string} input - ユーザーメッセージ。例：今日の僕の予定は？
 * @returns {ResultIntent} - ResultIntentオブジェクト 
 */
Dialogflow.prototype.detectIntent = function (input) {
  var cache = CacheService.getUserCache();
  var scriptProperties = PropertiesService.getScriptProperties();

  var dfUrlFormat = scriptProperties.getProperty('DF_URL_FORMAT');

  var body = {
    queryInput: {
      text: {
        text: input,
        languageCode: "ja"
      }
    },
    queryParams: {
      timeZone: "Asia/Tokyo"
    }
  };
  var options = {
    'method': 'POST',
    'contentType': 'application/json; charset=utf-8',
    'headers': {
      'Authorization': 'Bearer ' + getAccessToken()
    },
    'payload': JSON.stringify(body)
  };
  var response = UrlFetchApp.fetch(Utilities.formatString(dfUrlFormat, this.id), options);
  var results = JSON.parse(response.getContentText());

  if (!results.queryResult.fulfillmentText || !results.queryResult.parameters) {
    return new ResultIntent(false, [], []);
  }

  var sysDate = new Date();
  var startDate = null;
  var endDate = null;
  var isNow = false;
  //Transfer TIME
  switch (results.queryResult.parameters.TIME) {
    case '今':
      startDate = new Date(sysDate.getYear(), sysDate.getMonth(), sysDate.getDate(), sysDate.getHours(), sysDate.getMinutes() - 30, 0);
      endDate = new Date(sysDate.getYear(), sysDate.getMonth(), sysDate.getDate(), sysDate.getHours(), sysDate.getMinutes() + 30, 0);
      isNow = true;
      break;
    case '今日':
      startDate = new Date(sysDate.getYear(), sysDate.getMonth(), sysDate.getDate(), 0, 0, 0);
      endDate = new Date(sysDate.getYear(), sysDate.getMonth(), sysDate.getDate(), 23, 59, 59);
      break;
    case '明日':
      startDate = new Date(sysDate.getYear(), sysDate.getMonth(), sysDate.getDate() + 1, 0, 0, 0);
      endDate = new Date(sysDate.getYear(), sysDate.getMonth(), sysDate.getDate() + 1, 23, 59, 59);
      break;
    case '昨日':
      startDate = new Date(sysDate.getYear(), sysDate.getMonth(), sysDate.getDate() - 1, 0, 0, 0);
      endDate = new Date(sysDate.getYear(), sysDate.getMonth(), sysDate.getDate() - 1, 23, 59, 59);
      break;
    default:
      break;
  }

  var persons = results.queryResult.parameters.PERSON || [];
  var groups = results.queryResult.parameters.GROUP || [];

  //TRANSFER PERSONS
  for (var i = 0; i < persons.length; i++) {
    if (persons[i] == '自分') { //一人称
      persons[i] = this.email;
      break;
    }
  }

  var isDetect = true;
  var message = '';
  if (results.queryResult.fulfillmentText == '') {
    //FIXME:もうちょい真面目に作る必要ある。
    isDetect = false;
    message = 'ごめん。良くわからなかったよ。';
  } else if (groups.length == 0 && persons.length == 0) {
    isDetect = false;
    message = 'ごめん。ユーザー名、グループ名が分からなかったよ。'
  } else if (startDate == null) {
    isDetect = false;
    message = 'ごめん。いつの予定が対象なのか分からなかったよ。'
  }
  return new ResultIntent(isDetect,message, groups, persons, startDate, endDate, isNow);
}


/**
 * Dialogflowを使うためのTokenを生成。
 *
 * @returns {string} OAuth2 token.
 */
function getAccessToken() {
  var jsonKey = JSON.parse(PropertiesService.getScriptProperties().getProperty("GOOGLE_APPLICATION_CREDENTIALS"));
  var serverToken = new GSApp.init(jsonKey.private_key, ["https://www.googleapis.com/auth/cloud-platform"], jsonKey.client_email);
  var tokens = serverToken.addUser(jsonKey.client_email).requestToken().getTokens();
  return tokens[jsonKey.client_email].token;
}

