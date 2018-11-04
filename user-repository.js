
/**
 * ユーザーを表します。
 *
 * @param {string} name 名称
 * @param {string} email Eメールアドレス
 * @param {string[]} aliases 別名
 */
var User = function (name, email, aliases) {
  this.name = name;
  this.email = email;
  this.aliases = (aliases) ? aliases.split(',') : [];
  this.aliases.push(this.name.replace(/\s+/g, ""));
};

/**
 * 渡されたwordsに一致するかを判断します。
 *
 * @param {string[]} words 抽出条件文字列
 * @returns true:一致、false:不一致
 */
User.prototype.matchByKeyword = function (words) {
  if (words == null || words.length == 0) return false;
  for (var i = 0; i < words.length; i++) {
    if (this.name.indexOf(words[i]) != -1 || this.email.indexOf(words[i]) != -1 || this.aliases.indexOf(words[i]) != -1)
      return true;
  }
  return false;
}


/**
 * グループを表します。
 *
 * @param {string} name グループ名
 * @param {User[]} users ユーザー情報
 * @param {string[]} aliases 別名
 */
var Group = function (name, users, aliases) {
  this.name = name;
  this.users = users;
  this.aliases = (aliases) ? aliases.split(',') : [];
  this.aliases.push(this.name.replace(/\s+/g, ""));
}


/**
 * 渡されたwordsに一致するかを判断します。
 *
 * @param {string[]} words 抽出条件文字列
 * @returns true:一致、false:不一致
 */
Group.prototype.matchByKeyword = function (words) {
  if (words == null || words.length == 0) return false;
  for (var i = 0; i < words.length; i++) {
    if (this.name.indexOf(words[i]) != -1 || this.aliases.indexOf(words[i]) != -1)
      return true;
  }
  return false;
}


/**
 * 渡されたwordsに一致するユーザー情報を抽出します。
 * 1件もヒットしなかった場合、空の配列を返します。
 *
 * @param {string[]} words 抽出条件文字列
 * @returns 抽出結果、もしくは空配列
 */
Group.prototype.getUsersByKeyword = function (words) {
  var result = [];
  if (words == null || words.length == 0) return result;
  this.users.forEach(function (user) {
    if (user.matchByKeyword(keyword)) result.push(user);
  });
  return result;
}

// Repository Class.
/**
 * ユーザー情報へのアクセスを提供します。
 *
 */
var UserRepository = function () {
  var groups = [];
  {
    var users = [];
    users.push(new User("松本 宏紀", "hiroki.matsumoto@eample.com", "マツモト,マツモト"));
    users.push(new User("山田 太郎", "foo@exampe.com", "やーまだー"));
    groups.push(new Group("札幌基盤", users));
  }
  this.groups = groups;
};

/**
 * 指定された文言に一致するユーザー情報を抽出します。
 * グループ抽出条件に一致するグループが存在した場合、そのグループに所属するユーザーを全て返します。
 * 
 * グループ抽出条件、もしくはユーザー抽出条件どちらかを必ず指定する必要があります。
 * @param {*} groupWords - グループ抽出条件
 * @param {*} personWords - ユーザー抽出条件
 * @returns {User[]} 抽出結果、もしくは空配列
 */
UserRepository.prototype.searchByKeyword = function (groupWords, personWords) {
  var result = [];
  var isHit = false;

  // assertion
  if (groupWords == null || personWords == null) return result;
  if (groupWords.length == 0 && personWords.length == 0) return result;

  var distinctEmails = []; //重複チェック用
  // STEP1. maching by group
  this.groups.forEach(function (group) {
    if (group.matchByKeyword(groupWords)) {
      isHit = true;
      for (var i = 0; i < group.users.length; i++) {
        if (distinctEmails.indexOf(group.users[i].email) != -1)
          continue;

        distinctEmails.push(group.users[i].email);
        result.push(group.users[i]);
      }
    }
  });
  if (isHit) return result;

  // STEP2. maching by user
  this.groups.forEach(function (group) {
    group.users.forEach(function (user) {
      if (user.matchByKeyword(personWords)) {
        if (distinctEmails.indexOf(user.email) != -1)
          return;
        distinctEmails.push(user.email);
        result.push(user);
      }
    });
  });

  return result;
}
