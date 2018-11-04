/**
 * Hangout chatイベント受信。
 * https://developers.google.com/hangouts/chat/reference/message-formats/events#event_fields
 * @param {Object} event
 */
function onMessage(event) {
  if (!event.message.argumentText)
    return;

  //TODO: 将来的に、Dialogflowで連続した会話を成立させるセッションID。  
  var sessionId = (event.message.thread ? event.message.thread.name : event.message.sender.name);

  // 入力情報解析
  var dialogflow = new Dialogflow(sessionId, event.message.sender.email);
  var resultIntent = dialogflow.detectIntent(event.message.argumentText);

  //受け入れ確認
  //解析不可
  if (!resultIntent.isDetect) {
    return { text: resultIntent.message };
  }

  var userRepository = new UserRepository();
  var users = userRepository.searchByKeyword(resultIntent.groups, resultIntent.persons);
  var startDate = resultIntent.startDate;
  var endDate = resultIntent.endDate;

  if (users.length == 0) {
    var words = [];
    Array.prototype.push.apply(words, resultIntent.groups);
    Array.prototype.push.apply(words, resultIntent.persons);
    return { text: Utilities.formatString("ごめん。%sは知らないんだ。もし登録が必要なら管理者さんに聞いてみて？", words.join(', ')) };
  }

  var response = {
    "cards": [
    ]
  };
  users.forEach(function (user) {
    var calendar = CalendarApp.getCalendarById(user.email);
    var events = calendar.getEvents(startDate, endDate);
    var events = events.filter(function (e) {
      var title = e.getTitle();
      return title.indexOf('〆') == -1 && title.indexOf('TODO') == -1
    });
    if (resultIntent.isNow) {
      response.cards.push(createResponseWidgetsForNow(user, events));
    } else {
      response.cards.push(createResponseWidgets(user, events));
    }
  });

  return response;
}


/**
 * そのユーザーが、今会議中かどうかをアイコンで表示します。
 * https://developers.google.com/hangouts/chat/reference/message-formats/cards
 * @param {User} user
 * @param {Object} events - CalendarEvent
 * @returns  sections情報
 */
function createResponseWidgetsForNow(user, events) {
  var content = "";
  var label = '<font color="#606060"> [ 予定無し ] </font>';
  var result = {
    sections: []
  };
  if (events.length > 0) {
    var now = new Date();
    var labelStatus = 0;//0:予定無し,3:会議中
    for (var i = 0; i < events.length; i++) {
      var event = events[i];
      if (event.getStartTime() <= now && now < event.getEndTime())
        labelStatus = 3;

      var item = Utilities.formatDate(event.getStartTime(), "JST", "HH:mm") +
        "～" +
        Utilities.formatDate(event.getEndTime(), "JST", "HH:mm") +
        ':';
      if (event.getTitle() == null || event.getTitle() == '')
        item += ': 非公開予定っぽい';
      else
        item += event.getTitle();

      var section = {
        widgets: [{
          textParagraph: {
            text: item
          }
        }]
      };
      result.sections.push(section);
    }
  }
  var label = '予定無し';
  var imageUrl = 'https://raw.githubusercontent.com/h-r-k-matsumoto/hangout-calendar-bot/master/images/mark-01.png';
  switch (labelStatus) {
    case 1:
      label = '会議直前！';
      imageUrl = 'https://raw.githubusercontent.com/h-r-k-matsumoto/hangout-calendar-bot/master/images/mark-03.png';
      break;
    case 2:
      label = '会議中かも？';
      imageUrl = 'https://raw.githubusercontent.com/h-r-k-matsumoto/hangout-calendar-bot/master/images/mark-03.png';
      break;
    case 3:
      label = '会議中';
      imageUrl = 'https://raw.githubusercontent.com/h-r-k-matsumoto/hangout-calendar-bot/master/images/mark-02.png';
      break;
    default: label = '予定無し';
  }
  result.header = {
    title: "<b>" + user.name + "</b>",
    subtitle: label,
    imageUrl: imageUrl,
    imageStyle: "IMAGE"
  };
  return result;
}

/**
 * 対象のユーザーのイベント一覧を返します。
 * https://developers.google.com/hangouts/chat/reference/message-formats/cards
 *
 * @param {User} user
 * @param {Object} events
 * @returns sections情報
 */
function createResponseWidgets(user, events) {
  var content = "";
  var result = {
    sections: [{
      widgets: []
    }]
  };
  if (events.length > 0) {
    for (var i = 0; i < events.length; i++) {
      var event = events[i];
      var item = Utilities.formatDate(event.getStartTime(), "JST", "HH:mm") +
        "～" +
        Utilities.formatDate(event.getEndTime(), "JST", "HH:mm") +
        ':';
      if (event.getTitle() == null || event.getTitle() == '')
        item += ': 非公開予定っぽい';
      else
        item += event.getTitle();

      content += item + "<br>";
    }
  }else{
    cntent = "予定無し";
  }
  var widget = {
    textParagraph: {
      text: '<b>' + user.name + '</b><br>' + content
    }
  };
  result.sections[0].widgets.push(widget);

  return result;
}


function getCalendarEvent(users, b) {
  var calendar = CalendarApp.getCalendarById(user.email);
  var events = calendar.getEventsForDay(systemDate);
}

/**
 * デバッグ実行用。
 *
 */
function debug() {
  var message = '僕の明日の予定は？';
  event = {
    message: {
      text: message,
      argumentText: message,
      thread: {
        name: 'spaces/AAAAAAAAAAA/threads/BBBBBBBBBBB'
      }
    }
  }
  onMessage(event);
}
