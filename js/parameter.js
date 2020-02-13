////////// 描画パラメータ ////////// このパラメータは基本的には変更しないでください。
WIDTH = 480; // core canvas width (px)
HEIGHT = 640; // core canvas height (px)
COUNTER_Y = HEIGHT * 0.55; // ゴールとなるカウンターの表示座標
HUMANHEIGHT = 150; // 人の描画上の縦幅
FPS = 15; // １秒当たりの描画フレーム数

////////// ファイルパスパラメータ ////////// このパラメータは、ファイル構成を変更したときに更新してください。
HumanDir = "assets/image/human/";
PartsDir = "assets/image/parts/";
AudioDir = "assets/audio/";

////////// ゲームパラメータ― ////////// このパラメータは変更して大丈夫です。
// 人が本を置いて立ち去るまでの初期時間
WAITTIME = 20;

// ゲームオーバーとなる積立冊数
LIMIT = 15;

// 人の初期出現率 (１人 ／ LAMBDA フレーム)
LAMBDA = 25;

// 人が歩いてくる初期速度
SPEED = 1.0;

// レーン数
LANE = 3;

// タッチ判定となる指の移動距離 この距離以内ならOK
DISTLIMIT = 30;

// タッチ継続判定となる１フレームの移動距離
DISTMOVE = 50;

// 黒い本を返した判定とする縦の距離 この距離より上で離せばOK
DISTBLACK = 60;

// レアキャラ（図書館キャラ）の出現率（％）
RARERATE = 3;

// 黒い本の出現率 0 ～ 1 の実数
BLACKRATE = 0.05;

// リザルト画面で「やめる」を選択した際の遷移先 URL
BACK_URL = "http://www2.city.tahara.aichi.jp/section/library/info/200123game.html";

// リザルト画面でツイッター共有する際のツイートに載せる URL
TWEET_URL = "http://www2.city.tahara.aichi.jp/section/library/info/200123game.html";

// リザルト画面でツイッター共有する際のツイートに載せるメッセージ
// （「あなたは n 冊片付けました！」の続きに載せるメッセージです。）
TWEET_MSG = "みんなも挑戦してね！";

/**************** 人の画像に関するデータ *****************
  以下の様式に従って、人の画像を追加する際は設定をして下さい。
  
  1) HumanSetting.push({ とします。
     丸括弧開始および中括弧開始 ({ を忘れずに。
       school1A.png ～ school16A.png の場合 school とします。
  2) 各設定値を 設定名:設定値, という形で指定します。
     最後の行のコロン,はあってもなくてもかまいません。
     行頭の空白（インデント）は見た目をわかりやすくするためにあるので、そろえたほうがいいでしょう。
       name: "school", は共通ファイル名です。大文字小文字を正確に（コピペが楽です）。
       frames: [1, 2, 3, 2], は描画順の設定です。単一画像の場合は [1] として下さい。
       width: 32, は画像の１フレームの切り取りサイズの幅です。
       height: 48, は画像の１フレームの切り取りサイズの高さです。
       num: 16, は同じ名前のファイル数です。school は16個あるので16です。
  3) 最後に }); と記述して中括弧と丸括弧を閉じます。
     セミコロン;は必ずつけてください。

  既存の設定を参考にお願いします。
 *********************************************************/
HumanSetting = [];

HumanSetting.push({
  name: "school",
  frames: [0, 1, 2, 1],
  width: 32,
  height: 48,
  num: 16
});

HumanSetting.push({
  name: "SchoolGirl",
  frames: [0, 1, 2, 3, 4, 3, 2, 1],
  width: 40,
  height: 100,
  num: 1
});

/**************** ここより上に設定を記述してください *****************/

// 人ファイルの合計数を計算 
HumanNum = HumanSetting.map(s=>{return s.num;}).reduce((p,c)=>{return p+c;});
