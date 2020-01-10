enchant(); // おまじない
var rand = function(n){
  return Math.floor(Math.random() * n);
};

////////// ゲームパラメーター //////////
WIDTH = 480; // game canvas width (px)
HEIGHT = 640; // game canvas height (px)
WAITTIME = 20; // 人が本を置いて立ち去るまでの時間（難易度指標の一つ）
TAKENTIME = 30; // 一番上の本がほかの人に取られるまでの時間（難易度指標の一つ）
OVERTIME = 60; // ゲームオーバーとなる時間
TIMERTIME = 5; // 時計が揺れ始める時間（ゲームオーバーの〇秒前）
LAMBDA = 7; // フレームに対する人の出現率（最大100％）
SPEED = 7; // 人が歩いてくる速度
 
window.onload = function() { 
  var game = new Game(WIDTH, HEIGHT); // ゲーム本体を準備すると同時に、表示される領域の大きさを設定しています。
  game.fps = 15; // frames（フレーム）per（毎）second（秒）：ゲームの進行スピードを設定しています。
  game.preload("./img/BookBlackA.png", "./img/BookBlueA.png", "./img/BookGreenA.png", "./img/BookRedA.png", "./img/BookWhiteA.png", "./img/BookYellowA.png", "./img/Counter.png", "./img/Human1A.png", "./img/Human2A.png", "./img/tokei.png", "./img/PauseBG.png", "./img/ResumeButton.png", "./img/EndButton.png");
  game.lane = 3; // レーン数
  game.point = 0; // ポイント

  ////////// ポーズシーンの生成 //////////
  var createPauseScene = Class.create(Scene, {
  initialize: function(){
    Scene.call();

    var grpButton = new Group();
    
    var bg = new Sprite(WIDTH, HEIGHT);
    bg.image = game.assets['./img/PauseBG.png'];

    var buttonPanel = new Sprite(WIDTH, HEIGHT/2);
    buttonPanel.image = game.assets['./img/ButtonPanel.png'];
    buttonPanel.x = 0;
    buttonPanel.y = HEIGHT/4;
    grpButton.addChild(buttonPanel);

    var resumeButton = new Sprite(80, 40);
    resumeButton.image = game.assets['./img/ResumeButton.png'];
    grpButton.addChild(resumeButton);

    var endButton = new Sprite(80, 40);
    endButton.image = game.assets['./img/EndButton.png'];
    grpButton.addChild(endButton);
    
    scene.addChild(bg);
    scene.addChild(grpButton);
    return scene;
  }

  ////////// ゲームオーバーシーンの生成 //////////
  
 
  game.onload = function() { // ゲームの準備が整ったらメインの処理を実行します。
    ////////// 表示位置 //////////
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

    ////////// 各オブジェクトの生成 //////////
    //------ カウンターオブジェクト
    var counter = new Sprite(WIDTH, 264);
    counter.image = game.assets['./img/Counter.png'];
    counter.x = 0;
    counter.y = 360;

    //------ 時計オブジェクト
    var tokei = new Sprite(128, 128);
    tokei.image = game.assets['./img/tokei.png'];
    tokei.x = WIDTH - tokei.width*2;
    tokei.y = 0;
    tokei.scaleX = 0;
    tokei.scaleY = 0;
    
    //------ 本オブジェクト
    var Book = Class.create(Sprite, {
    initialize: function(lane, colorNum, index) {
      Sprite.call(this, 50, 80);
      switch(colorNum){
      case Book.WHITE: this.image = game.assets['./img/BookWhiteA.png']; break;
      case Book.RED: this.image = game.assets['./img/BookRedA.png']; break;
      case Book.BLUE: this.image = game.assets['./img/BookBlueA.png']; break;
      case Book.YELLOW: this.image = game.assets['./img/BookYellowA.png']; break;
      case Book.GREEN: this.image = game.assets['./img/BookGreenA.png']; break;
      case Book.BLACK: default: this.image = game.assets['./img/BookBlackA.png']; break;
      }
      this.color = colorNum;
      this.x = (lane * 2 + 1) * WIDTH / (game.lane * 2) - this.width / 2 + index * (lane - 1) * Book.PILE.X;
      this.y = 400 - index * Book.PILE.Y;
      this.time = TAKENTIME;
      grpBook.addChild(this);
      // フレーム毎の処理
      this.addEventListener("enterframe", ()=>{
        if(index == books[lane].length - 1){
          if(this.time <= 0){
            grpBook.removeChild(this);
            books[lane].pop();
          }else{
            this.time--;
          }
        }else{
          this.time = TAKENTIME;
        }
      });
    }
    });
    Book.BLACK = 0;
    Book.WHITE = 1;
    Book.RED = 2;
    Book.BLUE = 3;
    Book.YELLOW = 4;
    Book.GREEN = 5;
    Book.PILE = {X: 1, Y: 9}; // 表示上の移動距離
    
    //------ 人オブジェクト
    var Human = Class.create(Sprite, {
    initialize: function(lane){
      //console.log('./img/Human' + (rand(2) + 1) + 'A.png');
      Sprite.call(this, 66, 174);
      this.image = game.assets['./img/Human' + (rand(2) + 1) + 'A.png'];
      this.y = -this.height;
      this.x = (lane * 2 + 1) * WIDTH / (game.lane * 2) - this.width / 2 - (lane - 1) * (counter.y - this.y) / 10;
      this.c = 0;
      grpHuman.addChild(this);
      // フレーム毎の処理
      this.addEventListener("enterframe", ()=>{
        if(this.y < counter.y - this.height / 2){
          if(this.y < counter.y - this.height / 2 - 30 * humans[lane].indexOf(this)){
            this.y += SPEED;
            this.x = (lane * 2 + 1) * WIDTH / (game.lane * 2) - this.width / 2 - (lane - 1) * (counter.y - this.y) / 10;
          }
        }else{
          if(this.c == 0){
            books[lane].push(new Book(lane, rand(6), books[lane].length));
          }
          this.c++;
          if(this.c > WAITTIME){
            grpHuman.removeChild(this);
            humans[lane].shift();
          }
        }
      });
    }
    });

    ////////// オブジェクトのrootSceneへの追加 //////////
    game.rootScene.addChild(grpHuman);
    game.rootScene.addChild(counter);
    game.rootScene.addChild(grpBook);
    game.rootScene.addChild(tokei);

    ////////// 本と人のレーンごとの格納配列の用意 //////////
    var books = [];
    var humans = [];
    for(i=0; i<game.lane; i++){
      books[i] = [];
      humans[i] = [];
    }
    
    ////////// タッチ入力 //////////
    this.rootScene.addEventListener("touchstart", function(e) {
      if(e.y < HEIGHT/2){
        game.pause();
      }else{
        var lane = parseInt(e.x * game.lane / WIDTH);
        if(lane < 0) lane = 0; // 下の境界
        if(lane >= game.lane) lane = game.lane-1; // 上の境界
        var b = books[lane].pop();
        if(b){
          grpBook.removeChild(b);
          if(b.color == Book.BLACK){
            if(game.point > 0)
              game.point--;
          }else{
            game.point++;
          }
        }
        console.log("POINT: " + game.point);
      }
    });
    
    ////////// フレーム毎の処理（全体処理） //////////
    this.rootScene.addEventListener("enterframe", ()=>{
      //------ 人の発生をランダムにしてみた
      if(rand(100) < LAMBDA){
        var lane = rand(game.lane);
        humans[lane].push(new Human(lane));
      }

      //------ 指定時間後終了するようにしてみた
      if(game.frame >= OVERTIME * game.fps){
        game.stop();
      }

      //------ 指定時間ちょっと前に時計を揺らしてみた
      if(game.frame >= (OVERTIME - TIMERTIME) * game.fps){
        tokei.frame = game.frame;
        tokei.scaleX = 1;
        tokei.scaleY = 1;
      }

      console.log(game.frame, tokei.age);
    });

    ////////// デバッグ出力（フレーム毎） //////////
    this.rootScene.addEventListener("enterframe", ()=>{
      //console.log(books[0].length, books[1].length, books[2].length);
    });
    
    /*
    ////////// キーボード入力の登録 //////////
    game.keybind('B'.charCodeAt(0), 'b');
    game.keybind('H'.charCodeAt(0), 'h');

    ////////// キーボード入力の処理 //////////
    game.rootScene.addEventListener('enterframe', ()=>{
      if(game.input.b){
        var b = new Book(rand(5));
        b.x = (rand(game.lane) * 2 + 1) * WIDTH / (game.lane * 2) - b.width / 2;
        grpBook.addChild(b);
        console.log("added book ({$b.x}, {$b.y})");
      }
      if(game.input.h){
        var h = new Human();
        h.x = (rand(game.lane) * 2 + 1) * WIDTH / (game.lane * 2) - h.width / 2;
        h.y = 0;
        grpHuman.addChild(h);
        console.log("added human");
      }
    });
      */

    //alert("読み込み完了");
    /*
        var kuma = new Sprite(32, 32);  // くまというスプライト(操作可能な画像)を準備すると同時に、スプライトの表示される領域の大きさを設定しています。
        kuma.image = game.assets['./img/chara1.png']; // くまにあらかじめロードしておいた画像を適用します。
        kuma.x = 100; // くまの横位置を設定します。
        kuma.y = 120; // くまの縦位置を設定します。
        game.rootScene.addChild(kuma); // ゲームのシーンにくまを表示させます。
        game.rootScene.backgroundColor  = '#7ecef4'; // ゲームの動作部分の背景色を設定しています。
     */
  }
  game.start(); // ゲームをスタートさせます
  // このようにスラッシュ2つで書き始めた行は「コメント」扱いとなります。
  // プログラム中のメモとして活用しましょう。
  /* また、このようにスラッシュと米印を使うと、
        複数行に渡ってコメントを書くことができます。 */
};