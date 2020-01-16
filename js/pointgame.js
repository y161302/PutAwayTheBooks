enchant(); // おまじない
alert("Debug: ver.3");
var rand = function(n){ // よく使う [0-n) ランダム
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
LIMIT = 15 // ゲームオーバーとなる積立冊数
LAMBDA = 25; // LAMBDAフレームに一人出現
SPEED = 1.0; // 人が歩いてくる速度
COUNTER_Y = 360; // ゴールとなるカウンターの表示座標
LANE = 3; // レーン数
DISTLIMIT = 20; // タッチ判定となる距離
BLACKRATE = 0.05; // 黒い本の出現率

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
           "./img/BlackPanelA.png",
           "./img/BlackPanelA40.png",
           "./img/LEVELUPA.png",
           "./img/otetsukiA.png",
           "./img/GameOverA.png",
           "./img/WarnningPanelA.png"];
 
window.onload = function() { 
  core = new Core(WIDTH, HEIGHT); // ゲーム本体を準備すると同時に、表示される領域の大きさを設定しています。
  core.fps = 15; // frames（フレーム）per（毎）second（秒）：ゲームの進行スピードを設定しています。
  //core.preload("./img/BookBlackA.png", "./img/BookBlueA.png", "./img/BookGreenA.png", "./img/BookRedA.png", "./img/BookWhiteA.png", "./img/BookYellowA.png", "./img/Counter.png", "./img/Human1A.png", "./img/Human2A.png", "./img/tokei.png");
  core.preload(PRELOAD);
  core.lane = LANE; // レーン数
 
  core.onload = function() { // ゲームの準備が整ったらメインの処理を実行します。
    ////////// ウィンドウ設定（iOS対応用） //////////
    var baseW = WIDTH;
    var baseH = HEIGHT;
    var iOSW = 0;
    var iOSH = 0;
    var ua = navigator.userAgent.toLowerCase();
    var isiOS = (ua.indexOf("iphone") > -1) || (ua.indexOf("ipod") > -1) || (ua.indexOf("ipad") > -1);
    if(isiOS){
      iOSW = document.documentElement.clientWidth;
      iOSH = document.documentElement.clientHeight;
    }
    window.addEventListener("resize", updateMetaViewport, false);
    window.addEventListener("orientationchange", updateMetaViewport, false);
    var ev = document.createEvent("UIEvent");
    ev.initEvent("resize", true, true)
      window.dispatchEvent(ev);
    function updateMetaViewport(){
      var ua = navigator.userAgent.toLowerCase();
      var viewportContent;
      var w = window.outerWidth;
      var h = window.outerHeight;
      if(isiOS){
        w = iOSW;
        h = iOSH;
      }
      if(w < baseW){
        console.log("initial-scale=" + w/WIDTH);
        viewportContent = "width=" + WIDTH + ",initial-scale=" + w/WIDTH + ",user-scalable=no,shrink-to-fit=no";
      }else{
        viewportContent = "width=device-width,initial-scale=1.0,user-scalable=no,shrink-to-fit=no";
      }
      if(h < baseH){
        viewportContent = "height=" + HEIGHT + "," + viewportContent;
      }else{
        viewportContent = "height=device-height," + viewportContent;
      }
      document.querySelector("meta[name='viewport']").setAttribute("content", viewportContent);
    }

    ////////// シーン管理 //////////
    var SceneManager = Class.create({
    change: function(sceneName){
      this.now = sceneName.toLowerCase();
      switch(sceneName.toLowerCase()){
      case "title":
        //core.replaceScene(new TitleScene());
        break;
      case "ready":
        //core.replaceScene(new ReadyScene());
      case "game":
        core.replaceScene(new GameScene());
        break;
      case "pause":
        //core.pushScene(new PauseScene());
        break;
      case "resume":
        if(this.now == "pause")
          //core.popScene();
        break;
      case "result":
        core.replaceScene(new ResultScene());
        break;
      }
    }
    });

    ////////// フェードイン、フェードアウトありのシーンの定義 //////////
    var FadeScene = Class.create(Scene, {
    initialize: function(){
      Scene.call(this);

      // フェードパネル
      this.fadePanel = new Sprite(WIDTH, HEIGHT);
      this.fadePanel.image = core.assets['./img/BlackPanelA.png'];
      this.fadePanel.visible = false;
      this.fadePanel.delta = 0;
      this.FRAME = 20;

      // フェードパネルの上下のグループ
      this.onFadePanel = new Group();
      this.underFadePanel = new Group();

      // 要素の追加
      Scene.prototype.addChild.call(this, this.underFadePanel);
      Scene.prototype.addChild.call(this, this.fadePanel);
      Scene.prototype.addChild.call(this, this.onFadePanel);
      
      this.doFadeIn = function(callback){
        this.fadePanel.frame = 0;
        this.fadePanel.delta = 1;
        this.fadePanel.visible = true;
        this.callback = callback;
      };
      this.finishFadeIn = function(){
        this.fadePanel.frame = this.FRAME - 1;
        this.fadePanel.delta = 0;
        this.fadePanel.visible = false;
        if(this.callback){
          this.callback();
          this.callback = undefined;
        }
      };
      this.doFadeOut = function(callback){
        this.fadePanel.frame = this.FRAME - 1;
        this.fadePanel.delta = -1;
        this.fadePanel.visible = true;
        this.callback = callback;
      };
      this.finishFadeOut = function(){
        this.fadePanel.frame = 0;
        this.fadePanel.delta = 0;
        if(this.callback){
          this.callback();
          this.callback = undefined;
        }
      };
      this.fadePanel.addEventListener("enterframe", () => {
        this.fadePanel.frame += this.fadePanel.delta;
        if(this.fadePanel.frame < 0){ // fadeOut 完了
          this.finishFadeOut();
        }else if(this.fadePanel.frame >= this.FRAME){ // fadeIn 完了
          this.finishFadeIn();
        }
      });
    },
    addChild: function(node){ // Override
      this.underFadePanel.addChild(node);
    },
    addChildOnFadePanel: function(node){
      this.onFadePanel.addChild(node);
    },
    removeChild: function(node){ // Override
      this.underFadePanel.removeChild(node);
      this.onFadePanel.removeChild(node);
      Scene.prototype.removeChild.call(this, node);
    }
    });

    ////////// ゲームシーン  //////////
    var GameScene = Class.create(FadeScene, {
    initialize: function(){
      FadeScene.call(this);
      this.doFadeIn();
      core.point = 0;
      this.finished = false;
      
      //------ グループの生成
      var grpBook = new Group();
      var grpHuman = new Group();
      var grpLvUp = new Group();
      var grpLane = new Group();
      this.lane = grpLane.childNodes; // レーンの参照を簡単にする

      //------ オブジェクト生成
      for(var i=0; i<core.lane; i++){
        var lane = new Lane(i);
        lane.registBook(grpBook);
        lane.registHuman(grpHuman);
        lane.registLvUp(grpLvUp);
        grpLane.addChild(lane);
      }
      var counter = new Counter(); // カウンター
      var ptLabel = new PointLabel(); // ポイント表示用ラベル
      var ottk = new Otetsuki(); // お手付きの文字
      var bp = new BlackPanel(); // お手付きと同時に暗くするやつ
      var gameover = new GameOverSprite(); // ゲームオーバーのやつ
      var warnning = new WarnningPanel(); // 危険な時のエフェクト

      //------ オブジェクトのrootSceneへの追加
      this.addChild(grpLane);
      this.addChild(grpHuman);
      this.addChild(counter);
      this.addChild(grpBook);
      this.addChild(grpLvUp);
      this.addChild(ptLabel);
      this.addChild(bp);
      this.addChild(ottk);
      this.addChild(warnning);
      this.addChildOnFadePanel(gameover);

      this.touches = [];
      this.touchNum = 0;
      //------ タッチ入力（開始）
      this.addEventListener("touchstart", function(e) {
        var id = parseInt(e.x * core.lane / WIDTH);
        this.touchNum++;
        e.id = id;
        e.count = core.fps; // １秒間は待ってくれる
        // タッチが有効であるときは記録する
        if(!this.untouchable && e.y >= COUNTER_Y && !this.touches[id]){
          this.lane[id].touched();
          if(this.lane[id].books.childNodes.length){
            e.book = this.lane[id].books.lastChild;
            this.touches[id] = e;
          }else{ // お手付き！
            this.untouchable = WAITTIME;
            ottk.visible = true;
            bp.visible = true;
          }
        }
      });
      //------ タッチ入力（終了）
      this.addEventListener("touchend", function(e){
        this.touchNum--;
        if(e.y < COUNTER_Y){ // カウンターより上で離された時
          var black = {};
          black.distX = WIDTH;
          // X 座標が一番近い黒い本のタッチ記録があった時、その本を片付けたことにする
          this.touches.forEach(item=>{
            if(item){
              if(item.book.color == Book.Color.indexOf("Black")){
                var d = Math.abs(e.x - item.x);
                if(d < black.distX){
                  black.distX = d;
                  black.book = item.book;
                  black.id = item.id;
                }
              }
            }
          });
          if(black.book){
            this.lane[black.id].removeBook(black.book);
            this.touches[black.id] = undefined;
          }
        }else{ // カウンターより下で離された時
          var id = parseInt(e.x * core.lane / WIDTH);
          // タッチされたレーンに基づき、黒い本でないタッチ記録があれば、その本を片付けたことにする。
          if(this.touches[id]){
            // 黒い本でないことと、タッチ開始位置から 20px 以内であることが条件
            if(this.getDistance(this.touches[id], e) < DISTLIMIT && this.touches[id].book.color != Book.Color.indexOf("Black")){
              this.lane[id].removeBook(this.touches[id].book);
            }
          }
        }
        if(this.touchNum == 0){
          for(var i=0; i<core.lane; i++){
            this.touches[i] = undefined;
          }
        }
      });
      /*
      this.addEventListener("touchstart", (e)=>{
        if(!this.untouchable){
          var id = parseInt(e.x * core.lane / WIDTH);
          var book = this.lane[id].touched();
          if(book){
            // 本が回収された
            core.point++;
          }else{
            // 空のテーブルから本を回収しようとした
            this.untouchable = WAITTIME;
            bp.visible = true;
            ottk.visible = true;
          }
        }
      });
       */

      //------ フレーム毎の処理（全体処理）
      this.addEventListener("enterframe", ()=>{
        if(!this.finished){ // this.finished: false
          // タッチした本の有効時間の減少
          for(var i=0; i<core.lane; i++){
            if(this.touches[i]){
              this.touches[i].count--;
              if(this.touches[i].count == 0)
                this.touches[i] = undefined;
            }
          }
          
          // タッチ無効時間の減少処理
          if(this.untouchable > 0){
            this.untouchable--;
          }else{
            bp.visible = false;
            ottk.visible = false;
            this.untouchable = 0;
          }

          // 危ない時の周りに出る赤いやつ
          warnning.visible = false;
          for(var i=0; i<core.lane; i++){
            warnning.visible |= this.lane[i].warnning;
          }
          
          // リミット到達時の処理
          if(!this.isGameOver){ // ゲームオーバー処理がされてないとき
            // リミット到達したレーンがあるか調べる
            var GameOverFlg = false;
            for(var i=0; i<core.lane; i++){
              GameOverFlg |= (this.lane[i].getBookNum() >= LIMIT);
            }
            // リミット到達したレーンがあるとき
            if(GameOverFlg){
              this.isGameOver = true;
              gameover.visible = true;
              this.doFadeOut(()=>{this.finished = true;});
              this.untouchable = 100;
            }
          }
        }else{ // this.finished: true;
          manager.change("result");
        }
      });

      // ゲーム実行開始前の処理
      this.doFadeIn();
    },
    getClosest: function(e, id){
      var closest;
      var distance = 0;
      if(this.touches[id].length){
        this.touches.foreach(item=>{
          var d = this.getDistance(d, item);
          if(d < distance){
            distance = d;
            closest = item;
          }
        });
      }
      return closest;
    },
    getDistance: function(e, f){
      return Math.sqrt(Math.pow(e.x - f.x, 2) + Math.pow(e.y - f.y, 2));
    }
    });

    ////////// リザルトシーン //////////
    var ResultScene = Class.create(FadeScene, {
    initialize: function(){
      FadeScene.call(this);

      // オブジェクトの生成
      var gameover = new GameOverSprite();
      gameover.visible = true;
      gameover.defaultY = gameover.y;
      var label1 = new Label();
      label1.font = "24px Arial";
      label1.text = "あなたは";
      label1.x = 20;
      label1.y = 200;
      label1.visible = false;
      var label2 = new Label();
      label2.font = "24px Arial";
      label2.text = "片付けた！";
      label2.x = 320;
      label2.y = 360;
      label2.visible = false;
      var ptLabel = new Label();
      ptLabel.font = "48px Century Gothic";
      ptLabel.text = "    冊";
      ptLabel.x = 160;
      ptLabel.y = 260;
      ptLabel.visible = false;
      ptLabel.random = false;
      ptLabel.addEventListener("enterframe", ()=>{
        if(ptLabel.random){
          ptLabel.text = (rand(core.point)) + " 冊";
        }
      });

      // オブジェクトの追加
      this.addChildOnFadePanel(gameover);
      this.addChild(label1);
      this.addChild(ptLabel);
      this.addChild(label2);

      // フェードインの実行
      this.doFadeIn();

      // タイムラインの設定
      /* skipが上手くいかないのでやめる
      gameover.tl.moveTo(gameover.x, 20, 20).then(()=>{
        gameover.finished = true;
      });
      label1.tl.repeat(()=>{
        if(this.finish){
          label1.visible = true;
          label1.finished = true;
        }
      }, 30).and().delay(30).then(()=>{
        label1.visible = true;
        label1.finished = true;
      });
      label2.tl.repeat(()=>{
        if(this.finish){
          label2.visible = true;
          label2.finished = true;
        }
      }, 30).and().delay(30).then(()=>{
        label2.visible = true;
        label2.finished = true;
      });
      ptLabel.tl.repeat(()=>{
        if(this.finish){
          ptLabel.visible = true;
          ptLabel.text = core.point + " 冊";
          ptLabel.finished = true;
        }
      }, 60).and().delay(30).then(()=>{
        ptLabel.visible = true;
        ptLabel.random = true;
      }).delay(30).then(()=>{
        ptLabel.random = false;
        ptLabel.text = core.point + " 冊";
        ptLabel.finished = true;
      });
        */
      
      // フレーム毎の処理
      this.addEventListener("enterframe", ()=>{
        if(this.age <= 30 && !this.finished){
          gameover.y = gameover.defaultY * (30 - this.age) / 30;
        }
        if(this.age == 30 && !this.finished){
          label1.visible = true;
          label2.visible = true;
          ptLabel.visible = true;
          ptLabel.random = true;
        }
        if(this.age == 60 && !this.finished){
          ptLabel.random = false;
          ptLabel.text = core.point + " 冊";
        }
        if(this.age > 60 && this.age <= 90 && !this.finished){
          // ボタンをちょっとずつ見せてく
        }
      });
      
      // タッチイベントの処理
      this.addEventListener("touchstart", ()=>{
        if(!this.finished){ // 表示がすべて終わってないとき
          this.finished = true;
          // 表示をすべて終わらせる
          gameover.y = 0;
          label1.visible = true;
          label2.visible = true;
          ptLabel.visible = true;
          ptLabel.random = false;
          ptLabel.text = core.point + " 冊";
          this.finishFadeIn();
          //ボタンを表示
          
        }else{
          // 各ボタンの処理をここに書こうかしら
        }
      });
    }
    });
    
    ////////// クラスの定義 //////////
    //------ レーンクラス
    var Lane = Class.create(Sprite, {
    initialize: function(laneNumber){
      Sprite.call(this, 0, 0);
      this.id = laneNumber;
      this.x = WIDTH / core.lane * laneNumber;
      
      // グループの生成
      this.books = new Group();
      this.bookframes = new Group();
      this.humans = new Group();
      
      // パラメーター設定
      this.WAITTIME = WAITTIME;
      this.SPEED = SPEED;
      this.LAMBDA = LAMBDA;
      this.BLACKRATE = BLACKRATE;
      this.Level = 1;
      this.touchNum = 0;
      
      // 本枠の生成
      for(var i=0; i<LIMIT; i++){
        this.bookframes.addChild(new BookFrame(this, i));
      }

      // レベルアップの生成
      this.lvup = new LvUp();

      // 危ない時の奴
      this.warnning = false;
      
      // フレーム毎の処理
      this.addEventListener("enterframe", ()=>{
        // 人の出現（生成）
        if(core.frame % this.LAMBDA == 0){
          this.numberOfAppear = rand(this.LAMBDA);
        }
        if(core.frame % this.LAMBDA == this.numberOfAppear){
          this.humans.addChild(new Human(this, this.SPEED, this.getHumanNum()));
        }
        this.warnning = (this.books.childNodes.length > LIMIT * 0.8) || (this.books.childNodes.length >= LIMIT - 2);
      });
    },
    getBookNum: function(){
      return this.books.childNodes.length;
    },
    addBook: function(){
      var n = rand(parseInt((this.Level - 1) / 4)) + 1;
      for(i=0; i<n; i++){
        if(Math.random() < this.BLACKRATE)
          this.books.addChild(new Book(this, 0, this.getBookNum()));
        else
          this.books.addChild(new Book(this, rand(5)+1, this.getBookNum()));
      }
    },
    popBook: function(){
      var ret = this.books.lastChild;
      this.books.removeChild(ret);
      return ret;
    },
    removeBook: function(book){
      this.books.removeChild(book);
      core.point++;
    },
    getHumanNum: function(){
      return this.humans.childNodes.length;
    },
    shiftHuman: function(){
      var ret = this.humans.firstChild;
      this.humans.removeChild(ret);
      return ret;
    },
    touched: function(){
      this.touchNum++;
      if(this.touchNum >= 4 + this.Level)
        this.levelUp();
    },
    levelUp: function(){
      this.lvup.start();
      this.touchNum = 0;
      this.Level++;
      if(this.Level >= 10){
        this.WAITTIME = 5;
        this.LAMBDA = 10;
        this.SPEED = 2;
      }else{
        this.WAITTIME = WAITTIME - (this.Level - 1) * 1.5;
        this.LAMBDA = LAMBDA - (this.Level - 1) * 1.5
        this.SPEED = 1 + (this.Level - 1) / 10;
      }
    },
    registBook: function(grpBook){
      grpBook.addChild(this.books);
      grpBook.addChild(this.bookframes);
    },
    registHuman: function(grpHuman){
      grpHuman.addChild(this.humans);
    },
    registLvUp: function(grpLvUp){
      grpLvUp.addChild(this.lvup);
    }
    });

    //------ 本クラス
    var Book = Class.create(Sprite, {
    initialize: function(lane, colorNum, index) {
      Sprite.call(this, 50, 80);
      this.image = core.assets[`./img/Book${Book.Color[colorNum]}A.png`];
      this.color = colorNum;
      this.x = (lane.id * 2 + 1) * WIDTH / (core.lane * 2) - this.width / 2 + index * (lane.id - (core.lane - 1) / 2) * Book.PILE.X;
      this.y = COUNTER_Y + 40 - index * Book.PILE.Y;
      this.time = TAKENTIME;
      this.addEventListener("enterframe", ()=>{
        var idx = lane.books.childNodes.indexOf(this);
        this.x = (lane.id * 2 + 1) * WIDTH / (core.lane * 2) - this.width / 2 + idx * (lane.id - (core.lane - 1) / 2) * Book.PILE.X;
        this.y = COUNTER_Y + 40 - idx * Book.PILE.Y;
      });
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
      this.y = COUNTER_Y + 40 - index * Book.PILE.Y;
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
      this.x = (lane.id * 2 + 1) * WIDTH / (core.lane * 2) - this.width / 2 - (lane.id - (core.lane - 1) / 2) * (COUNTER_Y - this.y) / 10;
      this.c = 0;
      this.addEventListener("enterframe", ()=>{
        if(this.y < COUNTER_Y - this.height / 2){
          if(this.y < COUNTER_Y - this.height / 2 - 30 * lane.humans.childNodes.indexOf(this)){
            this.y += (COUNTER_Y + this.height / 2) / (5 * core.fps) * lane.SPEED;
            this.x = (lane.id * 2 + 1) * WIDTH / (core.lane * 2) - this.width / 2 - (lane.id - (core.lane - 1) / 2) * (COUNTER_Y - this.y) / 10;
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
      this.visible = false;
      this.addEventListener("enterframe", ()=>{
        if(this.visible){
          this.frame++;
          this.y -= 5;
          if(this.frame >= 20){
            this.visible = false;
          }
        }
      });
    },
    start: function(){
      this.y = 100;
      this.frame = 0;
      this.visible = true;
    }
    });

    //------ カウンター画像クラス
    var Counter = Class.create(Sprite, {
    initialize: function(){
      Sprite.call(this, WIDTH, 264);
      this.image = core.assets['./img/Counter.png'];
      this.x = 0;
      this.y = COUNTER_Y;
    }
    });

    //------ ブラックパネルクラス（画面自体を暗くするやつ）
    var BlackPanel = Class.create(Sprite, {
    initialize: function(){
      Sprite.call(this, WIDTH, HEIGHT);
      this.image = core.assets['./img/BlackPanelA40.png'];
    }
    });

    //------ 時計オブジェクト
    /* 使ってない
    var tokei = new Sprite(128, 128);
    tokei.image = core.assets['./img/tokei.png'];
    tokei.x = WIDTH - tokei.width*2;
    tokei.y = 0;
    tokei.scaleX = 0;
    tokei.scaleY = 0;
      */

    //------ ポイント表示用クラス
    var PointLabel = Class.create(Label, {
    initialize: function(){
      Label.call(this);
      this.font = '36px Comic Sans MS';
      this.text = '0 pt.';
      // ポイント文字の横幅を取得する関数
      this.canvas = document.getElementsByTagName('canvas')[0];
      if(this.canvas){
        this.context2d = this.canvas.getContext('2d');
        this.context2d.font = this.font;
        this.getWidth = (str) => this.context2d.measureText(str);
      }else{
        this.getWidth = (str) => str.length * 10;
      }
      this.x = WIDTH / 2 - this.getWidth(this.text).width / 2;
      this.y = 560;
      core.point = 0;
      this.addEventListener("enterframe", ()=>{
        // canvas設定用
        if(this.canvas == undefined){
          this.canvas = document.getElementsByTagName('canvas')[0];
          if(this.canvas){
            this.context2d = this.canvas.getContext('2d');
            this.context2d.font = this.font;
            this.getWidth = (str) => this.context2d.measureText(str);
          }
        }
        this.text = core.point + " 冊";
        this.x = WIDTH / 2 - this.getWidth(this.text).width / 2;
      });
    }
    });

    //------ お手付き表示クラス
    var Otetsuki = Class.create(Sprite, {
    initialize: function(){
      Sprite.call(this, 262, 67);
      this.image = core.assets['./img/otetsukiA.png'];
      this.x = (WIDTH - this.width) / 2;
      this.y = 420;
      this.visible = false;
    }
    });

    //------ ゲームオーバー表示クラス
    var GameOverSprite = Class.create(Sprite, {
    initialize: function(){
      Sprite.call(this, 456, 80);
      this.image = core.assets['./img/GameOverA.png'];
      this.y = (HEIGHT - this.height) / 2;
      this.x = (WIDTH - this.width) / 2;
      this.visible = false;
    }
    });

    //------ 危険な時のエフェクト表示クラス
    var WarnningPanel = Class.create(Sprite, {
    initialize: function(){
      Sprite.call(this, WIDTH, HEIGHT);
      this.image = core.assets['./img/WarnningPanelA.png'];
      this.FRAME = 15;
      this.frame = this.FRAME - 1;
      this.delta = -1;
      this.visible = false;
      this.addEventListener("enterframe", ()=>{
        if(this.frame == 0){
          this.delta = 1;
        }else if(this.frame == this.FRAME - 1){
          this.delta = -1;
        }
        this.frame += this.delta;
      });
    }
    });
    
    //------ ブラックパネルオブジェクト
    /*
    bp = new Sprite(WIDTH, HEIGHT);
    bp.image = core.assets['./img/BlackPanelA.png'];
    bp.x = 0;
    bp.y = 0;
    bp.visible = false;
      */

    ////////// 本と人のレーンごとの格納配列の用意 //////////
    /* Laneクラス実装により廃止
    var books = [];
    var humans = [];
    for(var i=0; i<core.lane; i++){
      books[i] = [];
      humans[i] = [];
    }
      */
    

    /*
    ////////// キーボード入力の登録 //////////
    core.keybind('B'.charCodeAt(0), 'b');
    core.keybind('H'.charCodeAt(0), 'h');

    ////////// キーボード入力の処理 //////////
    this.addEventListener('enterframe', ()=>{
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

    // シーンを切り替える
    //core.replaceScene(new GameScene());
    //new GameScene();
    //new ResultScene();
    var manager = new SceneManager();
    manager.change("game");
  }
  core.start(); // ゲームをスタートさせます
  console.log("started game.");
};