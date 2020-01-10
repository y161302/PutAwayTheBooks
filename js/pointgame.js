enchant(); // おまじない
var rand = function(n){
  return Math.floor(Math.random() * n);
};

////////// ゲームパラメータ― //////////
WIDTH = 480; // core canvas width (px)
HEIGHT = 640; // core canvas height (px)
WAITTIME = 20; // 人が本を置いて立ち去るまでの時間（難易度指標の一つ）
TAKENTIME = 30; // 一番上の本がほかの人に取られるまでの時間（難易度指標の一つ）
OVERTIME = 60; // ゲームオーバーとなる時間
TIMERTIME = 5; // 時計が揺れ始める時間（ゲームオーバーの〇秒前）
AFTERTIME = 30; // 後半戦の区切り時間
LIMIT = 15; // ゲームオーバーとなる積立冊数
LAMBDA = 25; // フレームに対する人の出現率（最大100％）
SPEED = 1.0; // 人が歩いてくる速度

////////// プリロード一覧 //////////
PRELOAD = ["./img/BookBlackA.png",
           "./img/BookBlueA.png",
           "./img/BookGreenA.png",
           "./img/BookRedA.png",
           "./img/BookWhiteA.png",
           "./img/BookYellowA.png",
           "./img/Counter.png",
           "./img/Human1A.png",
           "./img/Human2A.png",
           "./img/tokei.png",
           "./img/BookFrameA.png",
           "./img/BookFrameDotA.png",
           "./img/BookFrameLimitA.png",
           "./img/BlackPanelA50.png",
           "./img/LEVELUPA.png"];
 
window.onload = function() { 
  core = new Core(WIDTH, HEIGHT); // ゲーム本体を準備すると同時に、表示される領域の大きさを設定しています。
  core.fps = 15; // frames（フレーム）per（毎）second（秒）：ゲームの進行スピードを設定しています。
  //core.preload("./img/BookBlackA.png", "./img/BookBlueA.png", "./img/BookGreenA.png", "./img/BookRedA.png", "./img/BookWhiteA.png", "./img/BookYellowA.png", "./img/Counter.png", "./img/Human1A.png", "./img/Human2A.png", "./img/tokei.png");
  core.preload(PRELOAD);
  core.lane = 3; // レーン数
  core.point = 0; // ポイント
 
  core.onload = function() { // ゲームの準備が整ったらメインの処理を実行します。
    ////////// ウィンドウ設定（iOS対応用） //////////
    var baseW = WIDTH;
    var iOSW = 0;
    var ua = navigator.userAgent.toLowerCase();
    var isiOS = (ua.indexOf("iphone") > -1) || (ua.indexOf("ipod") > -1) || (ua.indexOf("ipad") > -1);
    if(isiOS){
      iOSW = document.documentElement.clientWidth;
    }
    window.addEventListener("resize", updateMetaViewport, false);
    window.addEventListener("orientationchange", updateMetaViewport, false);
    var ev = document.createEvent("UIEvent");
    ev.initEvent("resize", true, true)
      window.dispatchEvent(ev);
    function updateMetaViewport(){
      var ua = navigator.userAgent.toLowerCase();
      var isiOS = (ua.indexOf("iphone") > -1) || (ua.indexOf("ipod") > -1) || (ua.indexOf("ipad") > -1);
      var viewportContent;
      var w = window.outerWidth;
      console.log(w, document.documentElement.clientWidth, isiOS);
      if(isiOS){
        w = iOSW;
      }
      if(w < baseW){
        console.log("initial-scale=" + w/WIDTH);
        viewportContent = "width=WIDTH,initial-scale=" + w/WIDTH + ",user-scalable=no,shrink-to-fit=no";
      }else{
        viewportContent = "width=device-width,initial-scale=1.0,user-scalable=no,shrink-to-fit=no";
      }
      document.querySelector("meta[name='viewport']").setAttribute("content", viewportContent);
    }

    ////////// グループの生成 //////////
    var grpBook = new Group();
    var grpHuman = new Group();
    var grpLvUp = new Group();

    ////////// クラスの定義 //////////
    //------ レーンクラス
    var Lane = Class.create(Sprite, {
    initialize: function(laneNumber){
      Sprite.call(this, 0, 0);
      this.id = laneNumber;
      // グループ定義と追加
      this.books = new Group();
      grpBook.addChild(this.books);
      this.bookframes = new Group();
      grpBook.addChild(this.bookframes);
      this.humans = new Group();
      grpHuman.addChild(this.humans);
      // パラメーター
      this.WAITTIME = WAITTIME;
      this.SPEED = SPEED;
      this.LAMBDA = LAMBDA;
      this.Level = 1;
      this.popNum = 0;
      // 本枠の生成
      for(var i=0; i<LIMIT; i++){
        this.bookframes.addChild(new BookFrame(this, i));
      }
      // フレーム毎の処理
      this.addEventListener("enterframe", ()=>{
        // 人の出現（生成）
        if(core.frame % this.LAMBDA == 0){
          this.numberOfAppear = rand(this.LAMBDA);
        }
        if(core.frame % this.LAMBDA == this.numberOfAppear){
          this.humans.addChild(new Human(this, this.SPEED, this.getHumanNum()));
        }
      });
    },
    getBookNum: function(){
      return this.books.childNodes.length;
    },
    addBook: function(){
      var n = rand(parseInt((this.Level - 1) / 4)) + 1;
      for(i=0; i<n; i++){
        this.books.addChild(new Book(this, rand(5)+1, this.getBookNum()));
      }
    },
    popBook: function(){
      var ret = this.books.lastChild;
      this.books.removeChild(ret);
      this.popNum++;
      if(this.popNum >= 4 + this.Level)
        this.levelUp();
      return ret;
    },
    getHumanNum: function(){
      return this.humans.childNodes.length;
    },
    shiftHuman: function(){
      var ret = this.humans.firstChild;
      this.humans.removeChild(ret);
      return ret;
    },
    levelUp: function(){
      new LvUp(); // LEVEL UP 画像の出現
      this.popNum = 0;
      this.Level++;
      if(this.Level >= 10){
        this.WAITTIME = 5;
        this.LAMBDA = 10;
        this.SPEED = 2;
      }else{
        this.WAITTIME = 20 - (this.Level - 1) * 1.5;
        this.LAMBDA = 25 - (this.Level - 1) * 1.5
        this.SPEED = 1 + (this.Level - 1) / 10;
      }
      console.log(this.id, "Lv. " + this.Level);
    }
    });

    //------ 本クラス
    var Book = Class.create(Sprite, {
    initialize: function(lane, colorNum, index) {
      Sprite.call(this, 50, 80);
      this.image = core.assets[`./img/Book${Book.Color[colorNum]}A.png`];
      this.color = colorNum;
      this.x = (lane.id * 2 + 1) * WIDTH / (core.lane * 2) - this.width / 2 + index * (lane.id - (core.lane - 1) / 2) * Book.PILE.X;
      this.y = 400 - index * Book.PILE.Y;
      this.time = TAKENTIME;
    }
    });
    Book.Color = ["Black", "White", "Red", "Blue", "Yellow", "Green"];
    Book.PILE = {X: 1, Y: 9}; // 描画時に重なって見えるようにずらす幅

    //------ 本枠クラス
    var BookFrame = Class.create(Sprite, {
    initialize: function(lane, index){
      Sprite.call(this, 50, 80);
      this.image = (index == LIMIT - 1) ? core.assets["./img/BookFrameLimitA.png"] : core.assets["./img/BookFrameA.png"];
      this.x = (lane.id * 2 + 1) * WIDTH / (core.lane * 2) - this.width / 2 + index * (lane.id - (core.lane - 1) / 2) * Book.PILE.X
      this.y = 400 - index * Book.PILE.Y;
      // フレーム毎の処理
      this.addEventListener("enterframe", ()=>{
        if(index < lane.getBookNum()) this.visible = false;
        else this.visible = true;
      });
    }
    });
    
    //------ 人クラス
    var Human = Class.create(Sprite, {
    initialize: function(lane, speed, index){
      //console.log('./img/Human' + (rand(2) + 1) + 'A.png');
      Sprite.call(this, 66, 174);
      this.image = core.assets['./img/Human' + (rand(2) + 1) + 'A.png'];
      this.y = -this.height;
      this.x = (lane.id * 2 + 1) * WIDTH / (core.lane * 2) - this.width / 2 - (lane.id - (core.lane - 1) / 2) * (counter.y - this.y) / 10;
      this.c = 0;
      this.addEventListener("enterframe", ()=>{
        if(this.y < counter.y - this.height / 2){
          if(this.y < counter.y - this.height / 2 - 30 * lane.humans.childNodes.indexOf(this)){
            this.y += (counter.y + this.height / 2) / (5 * core.fps) * lane.SPEED;
            this.x = (lane.id * 2 + 1) * WIDTH / (core.lane * 2) - this.width / 2 - (lane.id - (core.lane - 1) / 2) * (counter.y - this.y) / 10;
          }
        }else{
          if(this.c == 0){
            var n = rand(parseInt(lane.Level / 2)) + 1;
            for(var i=0; i<n; i++){
              lane.addBook();
            }
          }
          this.c++;
          if(this.c > lane.WAITTIME){
            lane.shiftHuman();
          }
        }
      });
    }
    });

    //------ レベルアップ画像クラス
    var LvUp = Class.create(Sprite, {
    initialize: function(){
      Sprite.call(this, WIDTH, 75);
      this.image = core.assets['./img/LEVELUPA.png'];
      this.frame = 0;
      this.x = 0;
      this.y = 100;
      this.addEventListener("enterframe", ()=>{
        this.frame++;
        this.y -= 5;
        if(this.frame >= 20)
          grpLvUp.removeChild(this);
      });
      grpLvUp.addChild(this);
    }
    });

    ////////// オブジェクトの生成 //////////
    //------ カウンターオブジェクト
    var counter = new Sprite(WIDTH, 264);
    counter.image = core.assets['./img/Counter.png'];
    counter.x = 0;
    counter.y = 360;

    //------ 時計オブジェクト
    var tokei = new Sprite(128, 128);
    tokei.image = core.assets['./img/tokei.png'];
    tokei.x = WIDTH - tokei.width*2;
    tokei.y = 0;
    tokei.scaleX = 0;
    tokei.scaleY = 0;

    //------ レーンオブジェクト
    var LaneArray = [];
    for(var i=0; i<core.lane; i++){
      LaneArray.push(new Lane(i));
      // どうせループ回すならrootSceneに追加しちゃお
      core.rootScene.addChild(LaneArray[i]);
    }

    //------ ブラックパネルオブジェクト
    var bp = new Sprite(WIDTH, HEIGHT);
    bp.image = core.assets['./img/BlackPanelA50.png'];
    bp.x = 0;
    bp.y = 0;
    bp.visible = false;

    ////////// オブジェクトのrootSceneへの追加 //////////
    core.rootScene.addChild(grpHuman);
    core.rootScene.addChild(counter);
    core.rootScene.addChild(grpBook);
    core.rootScene.addChild(grpLvUp);
    core.rootScene.addChild(tokei);
    core.rootScene.addChild(bp);

    ////////// 本と人のレーンごとの格納配列の用意 //////////
    /* Laneクラス実装により廃止
    var books = [];
    var humans = [];
    for(var i=0; i<core.lane; i++){
      books[i] = [];
      humans[i] = [];
    }
      */
    
    ////////// タッチ入力 //////////
    this.rootScene.addEventListener("touchstart", function(e) {
      console.log("touched.");
      if(!core.untouchable){
        var lane = LaneArray[parseInt(e.x * core.lane / WIDTH)];
        var book = lane.popBook();
        console.log(book);
        if(book){
          // 本が回収された
          core.point++;
        }else{
          // 空のテーブルから本を回収しようとした
          core.untouchable = WAITTIME;
          navigator.vibrate(50);
          bp.visible = true;
        }
      }
      console.log("POINT: " + core.point);
    });

    ////////// フレーム毎の処理（全体処理） //////////
    this.rootScene.addEventListener("enterframe", ()=>{
      //------ タッチ無効時間の減少処理
      if(core.untouchable > 0){
        core.untouchable--;
      }else{
        bp.visible = false;
        core.untouchable = 0;
      }
      
      //------ 人の発生をランダムにしてみた
      /* Laneクラス実装により削除
      if(rand(100) < LAMBDA){ 
        var lane = rand(core.lane);
        humans[lane].push(new Human(lane));
      }
        */

      //------ 指定時間後終了するようにしてみた
      /* 仕様変更
      if(core.frame >= OVERTIME * core.fps){
        core.stop();
      }
        */

      //------ 指定時間ちょっと前に時計を揺らしてみた
      /* 仕様変更
      if(core.frame >= (OVERTIME - TIMERTIME) * core.fps){
        tokei.frame = core.frame;
        tokei.scaleX = 1;
        tokei.scaleY = 1;
      }
        */

      //------ 指定時間後を区別してみた
      if(!core.after && core.frame >= AFTERTIME * core.fps){
        core.after = true;
      }

      //------ GAME OVER 時の挙動 ( リミット到達時の挙動 より前に記述する必要あり）
      if(core.isGameOver){
        alert("GAME OVER...");
        core.stop();
      }
      
      //------ リミット到達時の挙動
      var GameOverFlg = false;
      for(var i=0; i<core.lane; i++){
        GameOverFlg |= (LaneArray[i].getBookNum() >= LIMIT);
      }
      if(GameOverFlg){
        core.isGameOver = true;
      }
    });

    ////////// デバッグ出力（フレーム毎） //////////
    this.rootScene.addEventListener("enterframe", ()=>{
      //console.log(books[0].length, books[1].length, books[2].length);
    });
    
    /*
    ////////// キーボード入力の登録 //////////
    core.keybind('B'.charCodeAt(0), 'b');
    core.keybind('H'.charCodeAt(0), 'h');

    ////////// キーボード入力の処理 //////////
    core.rootScene.addEventListener('enterframe', ()=>{
      if(core.input.b){
        var b = new Book(rand(5));
        b.x = (rand(core.lane) * 2 + 1) * WIDTH / (core.lane * 2) - b.width / 2;
        grpBook.addChild(b);
        console.log("added book ({$b.x}, {$b.y})");
      }
      if(core.input.h){
        var h = new Human();
        h.x = (rand(core.lane) * 2 + 1) * WIDTH / (core.lane * 2) - h.width / 2;
        h.y = 0;
        grpHuman.addChild(h);
        console.log("added human");
      }
    });
      */

    //alert("読み込み完了");
    /*
        var kuma = new Sprite(32, 32);  // くまというスプライト(操作可能な画像)を準備すると同時に、スプライトの表示される領域の大きさを設定しています。
        kuma.image = core.assets['./img/chara1.png']; // くまにあらかじめロードしておいた画像を適用します。
        kuma.x = 100; // くまの横位置を設定します。
        kuma.y = 120; // くまの縦位置を設定します。
        core.rootScene.addChild(kuma); // ゲームのシーンにくまを表示させます。
        core.rootScene.backgroundColor  = '#7ecef4'; // ゲームの動作部分の背景色を設定しています。
     */
  }
  core.start(); // ゲームをスタートさせます
  console.log("started game.");
};