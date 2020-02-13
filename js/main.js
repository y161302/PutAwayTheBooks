enchant(); // おまじない
var rand = function(n){ // よく使う [0-n) ランダム
  return Math.floor(Math.random() * n);
};
alert("ver 1");
var d = window.open().document;
d.head.appendChild(d.createElement("style")).innerText = 'span { margin: 2px; } span::after { content: "\\A"; white-space: pre;}';
console.log = function(){Array.from(arguments).forEach(a=>d.body.appendChild(d.createElement("span")).innerText=a)};
window.onerror = (e)=>console.log(e);

// パラメータファイル読み込み
var xhr = new XMLHttpRequest();
xhr.open("GET", "./js/parameter.js", true);
xhr.responseType = "text";
xhr.onload = ()=>{
  var src = document.head.appendChild(document.createElement("script"));
  src.textContent = xhr.responseText + "prm.PARAMETER_ONLOAD = true;";
};
xhr.send("");

// フラグがすべて建ったら main() を実行 //
var b = true;
var id = setInterval(()=>{
  if(prm.WINDOW_ONLOAD && prm.ENCHANT_JS_ONLOAD && prm.FILELOAD_ONLOAD && prm.PARAMETER_ONLOAD){
    if(b) main();
    b = false;
    clearInterval(id);
  }
}, 1);

function main() {
  var stage = document.getElementById("enchant-stage");
  core = new Core(WIDTH, HEIGHT); // ゲーム本体を準備すると同時に、表示される領域の大きさを設定しています。
  core.fps = FPS; // frames（フレーム）per（毎）second（秒）：ゲームの進行スピードを設定しています。
  core.preload(PRELOAD);
 
  core.onload = function() { // ゲームの準備が整ったらメインの処理を実行します。
    ////////// ウィンドウ設定（iOS対応用） ////////// 同時にinitial-scale < 1.0 のときにタップ座標がずれる分の計算
    pointingMarginTop = 0;
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
        pointingMarginTop = (document.documentElement.clientHeight - window.parent.screen.height) / 2;
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
    

    // 画面中央に表示
    moveStageToCenter(core);

    ////////// シーン管理 //////////
    var SceneManager = Class.create({
    change: function(sceneName){
      this.now = sceneName.toLowerCase();
      var style = stage.style;
      switch(sceneName.toLowerCase()){
      case "title":
        core.replaceScene(new TitleScene());
        style.background = "url('assets/image/background/bg_title" + (rand(2)+1) + ".png')";
        break;
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
        style.background = "url('assets/image/background/bg_result1.png')";
        break;
      }
    }
    });

    ////////// フェードイン、フェードアウトありのシーンの定義 //////////
    var FadeScene = Class.create(Scene, {
    initialize: function(){
      Scene.call(this);

      // フェードパネル
      fp = new ScaleSprite(WIDTH, HEIGHT);
      fp.image = core.assets['assets/image/parts/BlackPanelA.png'];
      fp.visible = false;

      // フェードパネルの上下のグループ
      this.onFadePanel = new Group();
      this.underFadePanel = new Group();

      // 要素の追加
      Scene.prototype.addChild.call(this, this.underFadePanel);
      Scene.prototype.addChild.call(this, fp);
      Scene.prototype.addChild.call(this, this.onFadePanel);

      // 透過度に関する奴ら
      fp.max = 20;
      fp.count = 0;
      fp.delta = 0;
      
      this.doFadeIn = function(callback){
        fp.opacity = 1;
        fp.count = fp.max;
        fp.delta = -1;
        fp.visible = true;
        this.callback = callback;
      };
      this.finishFadeIn = function(){
        fp.opacity = 0;
        fp.delta = 0;
        fp.visible = false;
        if(this.callback){
          this.callback();
          this.callback = undefined;
        }
      };
      this.doFadeOut = function(callback){
        fp.opacity = 0;
        fp.count = 0;
        fp.delta = 1;
        fp.visible = true;
        this.callback = callback;
      };
      this.finishFadeOut = function(){
        fp.opacity = 1;
        fp.delta = 0;
        if(this.callback){
          this.callback();
          this.callback = undefined;
        }
      };
      fp.addEventListener("enterframe", () => {
        if(fp.delta){
          fp.count += fp.delta;
          fp.opacity = fp.count / fp.max;
          if(fp.count >= fp.max){ // fadeOut 完了
            this.finishFadeOut();
          }else if(fp.count <= 0){ // fadeIn 完了
            this.finishFadeIn();
          }
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
      core.blackCount = 3; // スワイプヘルパーを表示する回数
      this.finished = false;
      
      //------ グループの生成
      var grpBook = new Group();
      var grpHuman = new Group();
      var grpLvUp = new Group();
      var grpLane = new Group();
      this.lane = grpLane.childNodes; // レーンの参照を簡単にする

      //------ オブジェクト生成
      for(var i=0; i<LANE; i++){
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
        var id = parseInt(e.x * LANE / WIDTH);
        this.touchNum++;
        e.id = id;
        e.count = core.fps; // １秒間は待ってくれる
        e.book = this.lane[id].books.lastChild;
        // タッチが有効であるときは記録する
        if(!this.untouchable && !this.touches[id]){
          if(e.book === undefined){ // 本がないとき
            if(e.y >= COUNTER_Y){ // お手付き！
              this.untouchable = WAITTIME;
              ottk.visible = true;
              bp.visible = true;
            }
          }else{ // 本があるとき
            if(e.y >= COUNTER_Y || e.y >= e.book.y){ // カウンターおよび本より画面的に下なら
              this.lane[id].touched();
              e.start = {x: e.x, y: e.y};
              this.touches[id] = e;
            }
          }
        }
      });
      //------ タッチ入力（移動）
      this.addEventListener("touchmove", function(e){
        var id = parseInt(e.x * LANE / WIDTH);
        var near = parseInt(e.x * LANE * 2 / WIDTH);
        // 一定距離内に有効なタッチ記録があれば、同じ指とみなす
        if(this.touches[id]){
          if(this.getDistance(this.touches[id], e) < DISTMOVE){ // 一定距離内なら
            if(this.getDistance(this.touches[id].start, e) < DISTLIMIT || this.touches[id].book.color == Book.Color.indexOf("Black")){ // タッチ開始位置からの距離が一定距離内または黒い本なら
              // 指位置の更新
              this.touches[id].x = e.x;
              this.touches[id].y = e.y;
            }else{ // タッチ開始位置からの距離が一定距離内でないかつ黒い本でなければ
              // 消す
              this.touches[id] = undefined;
              this.touchNum--;
            }
          }else{ // 一定距離より離れてる場合の処理（どれか一つのタッチ記録を消す）
            this.touchNum--;
            // 隣のレーンのタッチ記録を見てどのタッチ記録を消すのか決めて消す
            if(id * 2 == near && id > 0){ // レーン左半分のとき
              if(this.touches[id - 1]){ // 左側にタッチ記録があれば
                if(this.getDistance(this.touches[id - 1], e) < DISTMOVE){ // 一定距離内なら左側を消す
                  this.touches[id - 1] = undefined;
                }else{ // 一定距離内でなければ近い方を消す
                  if(this.getDistance(this.touches[id], e) < this.getDistance(this.touches[id - 1], e)){
                    this.touches[id - 1] = undefined;
                  }else{
                    this.touches[id] = undefined;
                  }
                }
              }else{ // 左側にタッチ記録がなければ e のレーンのを消す
                this.touches[id] = undefined;
              }
            }else if(id * 2 + 1 == near && id > 0){ // レーン右半分のときも同じ
              if(this.touches[id + 1]){
                if(this.getDistance(this.touches[id + 1], e) < DISTMOVE){
                  this.touches[id + 1] = undefined;
                }else{
                  if(this.getDistance(this.touches[id], e) < this.getDistance(this.touches[id + 1], e)){
                    this.touches[id + 1] = undefined;
                  }else{
                    this.touches[id] = undefined;
                  }
                }
              }else{
                this.touches[id] = undefined;
              }
            }
          }
        }else{ // タッチ記録が該当レーンにない時
          if(id * 2 == near && id > 0){ // レーン左半分のとき
            if(this.touches[id - 1]){ // 左側のレーンにタッチ記録があれば
              if(this.getDistance(this.touches[id - 1], e) < DISTMOVE && this.getDistance(this.touches[id - 1].start, e) < DISTLIMIT){ // 一定距離内およびタッチ開始位置からの距離が一定距離内なら設定を移す
                this.touches[id] = this.touches[id - 1];
                this.touches[id].x = e.x;
                this.touches[id].y = e.y;
              }else{ // 一定距離内でなければ消す
                this.touches[id - 1] = undefined;
                this.touchNum--;
              }
            }
          }else if(id * 2 + 1 == near && id < LANE - 1){ // レーン右半分のときも同じ
            if(this.touches[id + 1]){
              if(this.getDistance(this.touches[id + 1], e) < DISTMOVE && this.getDistance(this.touches[id + 1].start, e) < DISTLIMIT){
                this.touches[id] = this.touches[id + 1];
                this.touches[id].x = e.x;
                this.touches[id].y = e.y;
              }else{
                this.touches[id + 1] = undefined;
                this.touchNum--;
              }
            }
          }
        }
      });
      //------ タッチ入力（終了）
      this.addEventListener("touchend", function(e){
        this.touchNum--;
        var id = parseInt(e.x * LANE / WIDTH);
        console.log("lane: " + id, touches[id]);
        if(this.touches[id]){
          var touch = this.touches[id];
          // タッチ開始した時の本が黒のとき
          if(touch.book.color == Book.Color.indexOf("Black")){
            if(touch.start.y - e.y > DISTBLACK){ // 指定の縦の距離より上で離しているなら片付ける
              this.lane[touch.id].removeBook(touch.book);
            }
          }else{ // タッチ開始した時の本が黒以外のとき
            if(this.getDistance(touch.start, e) < DISTLIMIT){ // タッチ開始位置からの距離が一定距離内なら片付ける
              this.lane[touch.id].removeBook(touch.book);
            }
          }
          this.touches[id] = undefined;
        }
        if(this.touchNum <= 0){
          for(var i=0; i<LANE; i++){
            this.touches[i] = undefined;
          }
          this.touchNum == 0;
        }
      });

      //------ フレーム毎の処理（全体処理）
      this.addEventListener("enterframe", ()=>{
        if(!this.finished){ // this.finished: false
          // タッチした本の有効時間の減少
          for(var i=0; i<LANE; i++){
            if(this.touches[i]){
              this.touches[i].count--;
              if(this.touches[i].count == 0){
                this.touches[i] = undefined;
                this.touchNum--;
              }
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
          for(var i=0; i<LANE; i++){
            warnning.visible |= this.lane[i].warnning;
          }
          
          // リミット到達時の処理
          if(!this.isGameOver){ // ゲームオーバー処理がされてないとき
            // リミット到達したレーンがあるか調べる
            var GameOverFlg = false;
            for(var i=0; i<LANE; i++){
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
    getDistance: function(e, f){
      return Math.sqrt(Math.pow(e.x - f.x, 2) + Math.pow(e.y - f.y, 2));
    }
    });

    ////////// リザルトシーン //////////
    var ResultScene = Class.create(FadeScene, {
    initialize: function(){
      FadeScene.call(this);

      // やめるボタンを押したときの動作
      var ended = ()=>{
        this.doFadeOut(()=>{
          window.close();
        });
      };

      // つづけるボタンを押したときの動作
      var resumed = ()=>{
        this.doFadeOut(()=>{
          manager.change("title");
        });
      };

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
      label2.y = WIDTH - 20 - getTextWidth(label2.text, label2.font);
      label2.visible = false;
      var ptLabel = new PointLabel();
      ptLabel.font = "48px Century Gothic";
      ptLabel.y = 260;
      ptLabel.visible = false;
      ptLabel.random = false;
      var tweet = new TweetButton();
      var resume = new ResumeButton(resumed);
      resume.opacity = 0;
      var end = new EndButton(ended);
      end.opacity = 0;

      // オブジェクトの追加
      this.addChildOnFadePanel(gameover);
      this.addChild(label1);
      this.addChild(ptLabel);
      this.addChild(label2);
      this.addChild(tweet);
      this.addChild(resume);
      this.addChild(end);

      // フェードインの実行
      this.doFadeIn();
      
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
          ptLabel.x = (WIDTH - getTextWidth(ptLabel.text, ptLabel.font)) / 2;
        }
        if(this.age > 60 && this.age <= 90 && !this.finished){
          resume.opacity = (this.age - 60) / 30;
          end.opacity = (this.age - 60) / 30;
        }
        if(this.age == 90 && !this.finished){
          tweet.visible = true;
        }
      });
      
      // タッチイベントの処理
      this.addEventListener("touchstart", (e)=>{
        if(!this.finished){ // 表示がすべて終わってないとき
          this.finished = true;
          
          // 表示をすべて終わらせる
          this.finishFadeIn();
          gameover.y = 0;
          label1.visible = true;
          label2.visible = true;
          ptLabel.visible = true;
          ptLabel.random = false;
          ptLabel.text = core.point + " 冊";
          ptLabel.x = (WIDTH - getTextWidth(ptLabel.text, ptLabel.font)) / 2;
          
          //ボタンを表示
          tweet.visible = true;
          resume.opacity = 1.0;
          end.opacity = 1.0;
        }else{
          // 各ボタンの処理をここに書こうかしら
        }
      });
    }
    });

    ////////// タイトルシーン //////////
    var TitleScene = Class.create(FadeScene, {
    initialize: function(){
      FadeScene.call(this);
      this.enable = false;

      // スタートボタンが押された時の関数
      started = ()=>{
        this.doFadeOut(()=>{
          manager.change("game");
        });
      };

      // オブジェクトの生成
      var logo = new TitleLogo();
      var book = new TitleBook();
      var nanobie = new Nanobie();
      var start = new StartButton(started);

      // オブジェクトの追加
      this.addChild(logo);
      this.addChild(book);
      this.addChild(nanobie);
      this.addChild(start);

      // すべての子要素に対して有効とする奴
      enabling = function(node, enable){
        if(node){
          node.enable = enable;
          if(node.childNodes){
            node.childNodes.forEach(child=>{
              if(node !== child && child.enable != enable)
                enabling(child);
            });
          }
        }
      };

      // ランダムな時間ごとに吹き出しを表示
      this.addEventListener("enterframe", ()=>{
        if(!this.sbCount){
          this.sbCount = rand(20) + 20;
          this.sb = new SpeechBubble();
          this.addChild(this.sb);
        }
        if(this.underFadePanel.childNodes.indexOf(this.sb) == -1){
          this.sbCount--;
        }
      });
      
      // フェードインの実行
      this.doFadeIn(()=>{enabling(this, true);});
    },
    addChild: function(node){ // Override
      if(node){
        node.enable = this.enable;
        FadeScene.prototype.addChild.call(this, node);
      }
    },
    letsGame: function(){
      this.doFadeOut(()=>{
        manager.change("game");
      });
    }
    });

    ////////// オブジェクトのクラスの定義 //////////
    //------ スケール問題解消のスプライト
    var ScaleSprite = Class.create(Sprite, {
    initialize: function(w, h){
      Sprite.call(this, w, h);
    },
    setX: function(x){
      this.x = x - this.width * (1 - this.scaleX) / 2;
    },
    setY: function(y){
      this.y = y - this.height * (1 - this.scaleY) / 2;
    },
    getSetX: function(x){
      return x - this.width * (1 - this.scaleX) / 2;
    },
    getSetY: function(y){
      return y - this.height * (1 - this.scaleY) / 2;
    }
    });
    
    //------ レーンクラス
    var Lane = Class.create(ScaleSprite, {
    initialize: function(laneNumber){
      ScaleSprite.call(this, 0, 0);
      this.id = laneNumber;
      this.x = WIDTH / LANE * laneNumber;
      
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
          this.humans.insertBefore(new Human(this, this.SPEED, this.getHumanNum()), this.humans.firstChild);
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
    popHuman: function(){
      var ret = this.humans.lastChild;
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
        this.LAMBDA = LAMBDA - (this.Level - 1) * 1.5;
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
    var Book = Class.create(ScaleSprite, {
    initialize: function(lane, colorNum, index) {
      ScaleSprite.call(this, 50, 80);
      this.image = core.assets[`assets/image/parts/Book${Book.Color[colorNum]}A.png`];
      this.color = colorNum;
      this.x = (lane.id * 2 + 1) * WIDTH / (LANE * 2) - this.width / 2 + index * (lane.id - (LANE - 1) / 2) * Book.PILE.X;
      this.y = COUNTER_Y + 40 - index * Book.PILE.Y;
      this.addEventListener("enterframe", ()=>{
        var idx = lane.books.childNodes.indexOf(this);
        this.x = (lane.id * 2 + 1) * WIDTH / (LANE * 2) - this.width / 2 + idx * (lane.id - (LANE - 1) / 2) * Book.PILE.X;
        this.y = COUNTER_Y + 40 - idx * Book.PILE.Y;
      });
      if(colorNum == Book.Color.indexOf("Black") && core.blackCount > 0){
        lane.scene.addChild(new SwipeHelper(lane, this));
        core.blackCount--;
      }
    }
    });
    Book.Color = ["Black", "White", "Red", "Blue", "Yellow", "Green"];
    Book.PILE = {X: 1, Y: 9}; // 描画時に重なって見えるようにずらす幅

    //------ スワイプヘルパー
    var SwipeHelper = Class.create(ScaleSprite, {
    initialize: function(lane, book){
      var image = core.assets['assets/image/parts/SwipeHelperA.png'];
      ScaleSprite.call(this, image.width, image.height);
      this.image = image;
      this.setX(book.x + (book.width - this.width) / 2);
      this.setY(book.y - this.height - 10);
      this.tl.moveBy(0, -50, core.fps - 1).and().fadeOut(core.fps - 1)
             .moveBy(0, 50, 1).and().show().loop();
      this.addEventListener("enterframe", ()=>{
        if(lane.books.lastChild != book){
          this.visible = false;
        }else{
          this.visible = true;
        }
      });
    }
    });

    //------ 本枠クラス
    var BookFrame = Class.create(ScaleSprite, {
    initialize: function(lane, index){
      ScaleSprite.call(this, 50, 80);
      this.image = (index == LIMIT - 1) ? core.assets["assets/image/parts/BookFrameLimitA.png"] : core.assets["assets/image/parts/BookFrameA.png"];
      this.x = (lane.id * 2 + 1) * WIDTH / (LANE * 2) - this.width / 2 + index * (lane.id - (LANE - 1) / 2) * Book.PILE.X
      this.y = COUNTER_Y + 40 - index * Book.PILE.Y;
      // フレーム毎の処理
      this.addEventListener("enterframe", ()=>{
        if(index < lane.getBookNum()) this.visible = false;
        else this.visible = true;
      });
    }
    });
    
    //------ 人クラス
    var Human = Class.create(ScaleSprite, {
    initialize: function(lane, speed, index){
      //console.log('./img/Human' + (rand(2) + 1) + 'A.png');
      this.SPEED = lane.SPEED;
      var goalY = COUNTER_Y - HUMANHEIGHT * 0.4;
      var image;
      var frameLoop;
      // RareRate に収まっていればレアキャラが出てくる
      if(rand(100) < RARERATE){
        // 図書館キャラの動きの定義
        var n = rand(4);
        image = core.assets['assets/image/rarehuman/guest_' + n + 'A.png'];
        frameLoop = [1];
        ScaleSprite.call(this, image.width, image.height);
      }else{
        var n = rand(HumanNum);
        var setting;
        HumanSetting.forEach(s=>{if(0<=n&&n<s.num) setting=s; n-=s.num;});
        image = core.assets['assets/image/human/' + setting.name + (rand(setting.num) + 1) + 'A.png'];
        frameLoop = setting.frames;
        ScaleSprite.call(this, setting.width, setting.height);
      }
      this.image = image;
      // 高さを HumanHeight にそろえる
      var scale = HUMANHEIGHT / this.height; 
      this.scaleY = scale;
      this.scaleX = scale;
      // 描画座標計算用の数値設定
      var offsetY = - HUMANHEIGHT; // ちょうど画面から見えない上部をずらす前のＹ座標とする
      var setY = offsetY; // 初期Ｙ座標はオフセットそのまま
      this.setY(setY); // ScaleSprite.setY()
      var offsetX = (lane.id * 2 + 1) * WIDTH / (LANE * 2) - this.width * scale / 2; // レーンの中心Ｘ座標をずらす前のＸ座標とする
      var setX = offsetX - (lane.id - (LANE - 1) / 2) * ((COUNTER_Y - 60) - setY) / 10; // 初期Ｘ座標は少し中心寄り
      this.setX(setX); // ScaleSprite.setX()
      // 動きの設定用
      this.c = 0;
      this.moveAge = 0;
      // フレーム毎の処理
      this.addEventListener("enterframe", ()=>{
        // 動かす
        this.frame = frameLoop[parseInt(this.age / 2) % frameLoop.length];
        if(setY < goalY){ // ゴールにたどり着いてなければ
          if(setY < goalY - 80 * (lane.getHumanNum() - lane.humans.childNodes.indexOf(this) - 1)){
            // 行列を形成する必要がない時はスピードに合わせて動かす。
            setY = offsetY + (COUNTER_Y + HUMANHEIGHT / 2) / (5 * core.fps) * this.SPEED * this.moveAge;
            this.setY(setY);
            setX = offsetX - (lane.id - (LANE - 1) / 2) * (goalY - setY) / 8;
            this.setX(setX);
            this.moveAge++;
          }
        }else{ // ゴールにたどり着いたとき
          if(this.c == 0){ // たどり着いた瞬間の処理
            var n = rand(parseInt(lane.Level / 2)) + 1;
            for(var i=0; i<n; i++){
              lane.addBook();
            }
          }
          this.c++;
          if(this.c > lane.WAITTIME){ // 一定時間たったら消える
            lane.popHuman();
          }
        }
      });
    }
    });

    //------ レベルアップ画像クラス
    var LvUp = Class.create(ScaleSprite, {
    initialize: function(){
      ScaleSprite.call(this, WIDTH, 75);
      this.image = core.assets['assets/image/parts/LEVELUPA.png'];
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
    var Counter = Class.create(ScaleSprite, {
    initialize: function(){
      ScaleSprite.call(this, WIDTH, 264);
      this.image = core.assets['assets/image/parts/Counter.png'];
      this.x = 0;
      this.y = COUNTER_Y;
    }
    });

    //------ ブラックパネルクラス（画面自体を暗くするやつ）
    var BlackPanel = Class.create(ScaleSprite, {
    initialize: function(){
      ScaleSprite.call(this, WIDTH, HEIGHT);
      this.image = core.assets['assets/image/parts/BlackPanelA.png'];
      this.opacity = 0.4;
    }
    });

    //------ ポイント表示用クラス
    var PointLabel = Class.create(Label, {
    initialize: function(){
      Label.call(this);
      this.font = '36px Comic Sans MS';
      this.text = '0 冊';
      // ポイント文字の横幅を取得する関数
      this.x = (WIDTH - getTextWidth(this.text, this.font)) / 2;
      this.y = 560;
      this.addEventListener("enterframe", ()=>{
        if(this.random)
          this.text = rand(core.point) + " 冊";
        else
          this.text = core.point + " 冊";
        this.x = (WIDTH - getTextWidth(this.text, this.font)) / 2;
      });
    }
    });

    //------ お手付き表示クラス
    var Otetsuki = Class.create(ScaleSprite, {
    initialize: function(){
      ScaleSprite.call(this, 262, 67);
      this.image = core.assets['assets/image/parts/OtetsukiA.png'];
      this.x = (WIDTH - this.width) / 2;
      this.y = 420;
      this.visible = false;
    }
    });

    //------ ゲームオーバー表示クラス
    var GameOverSprite = Class.create(ScaleSprite, {
    initialize: function(){
      ScaleSprite.call(this, 456, 80);
      this.image = core.assets['assets/image/parts/GameOverA.png'];
      this.y = (HEIGHT - this.height) / 2;
      this.x = (WIDTH - this.width) / 2;
      this.visible = false;
    }
    });

    //------ 危険な時のエフェクト表示クラス
    var WarnningPanel = Class.create(ScaleSprite, {
    initialize: function(){
      ScaleSprite.call(this, WIDTH, HEIGHT);
      this.image = core.assets['assets/image/parts/WarnningPanelA.png'];
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

    //------ タイトルロゴ
    var TitleLogo = Class.create(ScaleSprite, {
    initialize: function(){
      var image = core.assets['assets/image/parts/title_title.png'];
      ScaleSprite.call(this, image.width, image.height);
      this.image = image;
    }
    });

    //------ タイトルに表示する本
    var TitleBook = Class.create(ScaleSprite, {
    initialize: function(){
      var image = core.assets['assets/image/parts/title_book.png'];
      ScaleSprite.call(this, image.width, image.height);
      this.image = image;
      this.y = 160;
    }
    });

    //------ タイトルに表示するなのビィ
    var Nanobie = Class.create(ScaleSprite, {
    initialize: function(){
      var image = core.assets['assets/image/rarehuman/guest_2A.png'];
      ScaleSprite.call(this, image.width, image.height);
      this.image = image;
      var scale = 240 / this.height;
      this.scaleX = scale;
      this.scaleY = scale;
      this.setX(300);
      this.setY(100);
      this.tl.moveBy(0, 100, parseInt(core.fps * 1.5), enchant.Easing.SIN_EASEINOUT)
             .moveBy(0, -100, parseInt(core.fps * 1.5), enchant.Easing.SIN_EASEINOUT)
             .loop();
      this.rotatable = false;
      var rotateFrame = parseInt(core.fps / 5);
      this.addEventListener("touchstart", (e)=>{
        this.rotatable = true;
      });
      this.addEventListener("enterframe", ()=>{
        if(this.rotatable){
          if(!this.rotateAge){
            this.rotateAge = rotateFrame * 2;
          }
          if(this.rotateAge > rotateFrame){
            // 前半
            this.rotate(- parseInt(30 / rotateFrame));
          }else{
            // 後半
            this.rotate(+ parseInt(30 / rotateFrame));
          }
          this.rotateAge--;
          if(this.rotateAge == 0)
            this.rotatable = false;
        }
      });
    }
    });

    //------ タイトルに表示するなのビィの吹き出し
    var SpeechBubble = Class.create(ScaleSprite, {
    initialize: function(){
      var image = core.assets['assets/image/parts/SpeechBubble' + (rand(3) + 1) + 'A.png'];
      ScaleSprite.call(this, image.width, image.height);
      this.image = image;
      var w = 300;
      var scale = w / image.width;
      var h = image.height * scale;
      this.scaleX = 0;
      this.scaleY = 0;
      this.setX(w);
      this.setY(120 + h);

      var moveFrame = parseInt(core.fps / 3);
      this.tl.moveBy(-w/2, -h/2, moveFrame).and().scaleTo(scale, moveFrame)
             .delay(parseInt(core.fps * 2.5))
             .moveBy(w/2, h/2, moveFrame).and().scaleTo(0, moveFrame)
             .removeFromScene();
    }
    });

    //------はじめるボタン
    var StartButton = Class.create(ScaleSprite, {
    initialize: function(start){
      var image = core.assets["assets/image/parts/StartImageA.png"];
      ScaleSprite.call(this, image.width, image.height);
      this.image = image;
      this.start = start;
      var w = 300;
      var scale = w / image.width;
      var h = image.height * scale;
      this.scaleX = scale;
      this.scaleY = scale;
      this.setX(WIDTH / 2 - this.width * scale / 2);
      this.setY(520);
      this.addEventListener("touchstart", (e)=>{
        var x = e.x - this.width * (1 - scale) / 2 - this.x;
        var y = e.y - this.height * (1 - scale) / 2 - this.y;
        this.touching = true;
        this.opacity = 0.8;
      });
      this.addEventListener("touchmove", (e)=>{
        if(this.touching){
          var x = e.x - this.width * (1 - scale) / 2 - this.x;
          var y = e.y - this.height * (1 - scale) / 2 - this.y;
          if(x < 0 || x > w || y < 0 || y > h){
            this.touching = false;
            this.opacity = 1.0;
          }
        }
      });
      this.addEventListener("touchend", (e)=>{
        if(this.touching){
          var x = e.x - this.width * (1 - scale) / 2 - this.x;
          var y = e.y - this.height * (1 - scale) / 2 - this.y;
          this.touching = false;
          this.tl.hide().delay(parseInt(core.fps * 0.15)).show().delay(parseInt(core.fps * 0.15)).loop();
          this.start();
        }
      });
    }
    });

    //------ つづけるボタン
    var ResumeButton = Class.create(ScaleSprite, {
    initialize: function(resume){
      image = core.assets['assets/image/parts/ResumeImageA.png'];
      ScaleSprite.call(this, image.width, image.height);
      this.image = image;
      this.resume = resume;

      var w = 200;
      var scale = w / image.width;
      var h = image.height * scale;
      this.scaleX = scale;
      this.scaleY = scale;
      this.setX(WIDTH * 1 / 4 - this.width * scale / 2);
      this.setY(540);
      this.addEventListener("touchstart", (e)=>{
        var x = e.x - this.width * (1 - scale) / 2 - this.x;
        var y = e.y - this.height * (1 - scale) / 2 - this.y;
        this.touching = true;
        this.opacity = 0.8;
      });
      this.addEventListener("touchmove", (e)=>{
        if(this.touching){
          var x = e.x - this.width * (1 - scale) / 2 - this.x;
          var y = e.y - this.height * (1 - scale) / 2 - this.y;
          if(x < 0 || x > w || y < 0 || y > h){
            this.touching = false;
            this.opacity = 1.0;
          }
        }
      });
      this.addEventListener("touchend", (e)=>{
        if(this.touching){
          var x = e.x - this.width * (1 - scale) / 2 - this.x;
          var y = e.y - this.height * (1 - scale) / 2 - this.y;
          this.touching = false;
          this.tl.hide().delay(parseInt(core.fps * 0.15)).show().delay(parseInt(core.fps * 0.15)).loop();
          this.resume();
        }
      });
    }
    });

    //------ やめるボタン
    var EndButton = Class.create(ScaleSprite, {
    initialize: function(end){
      image = core.assets['assets/image/parts/EndImageA.png'];
      ScaleSprite.call(this, image.width, image.height);
      this.image = image;
      this.end = end;

      var w = 200;
      var scale = w / image.width;
      var h = image.height * scale;
      this.scaleX = scale;
      this.scaleY = scale;
      this.setX(WIDTH * 3 / 4 - this.width * scale / 2);
      this.setY(540);
      this.addEventListener("touchstart", (e)=>{
        var x = e.x - this.width * (1 - scale) / 2 - this.x;
        var y = e.y - this.height * (1 - scale) / 2 - this.y;
        this.touching = true;
        this.opacity = 0.8
      });
      this.addEventListener("touchmove", (e)=>{
        if(this.touching){
          var x = e.x - this.width * (1 - scale) / 2 - this.x;
          var y = e.y - this.height * (1 - scale) / 2 - this.y;
          if(x < 0 || x > w || y < 0 || y > h){
            this.touching = false;
            this.opacity = 1.0;
          }
        }
      });
      this.addEventListener("touchend", (e)=>{
        if(this.touching){
          var x = e.x - this.width * (1 - scale) / 2 - this.x;
          var y = e.y - this.height * (1 - scale) / 2 - this.y;
          this.touching = false;
          this.tl.hide().delay(parseInt(core.fps * 0.15)).show().delay(parseInt(core.fps * 0.15)).loop();
          this.end();
        }
      });
    }
    });

    //------ ツイートボタン
    var TweetButton = Class.create(ScaleSprite, {
    initialize: function(){
      var image = core.assets["assets/image/parts/Twitter_Social_Icon_Circle_Color.png"];
      ScaleSprite.call(this, image.width, image.height);
      this.image = image;
      var size = 80;
      var scale = size / this.height;
      this.scaleX = scale;
      this.scaleY = scale;
      this.setX((WIDTH - this.width * this.scaleX) / 2);
      this.setY(400);
      this.visible = false;

      // タップしたらツイート画面を別タブで開く
      this.addEventListener("touchstart", (e)=>{
        var x = e.x - this.width * (1 - scale) / 2 - this.x;
        var y = e.y - this.height * (1 - scale) / 2 - this.y;
        // 正確にロゴの上をタッチした時
        if(Math.pow(x - size/2, 2) + Math.pow(y - size/2, 2) < Math.pow(size/2, 2)){
          openTweetPage();
        }
      });
    }
    });

    // 実質のスタート
    var manager = new SceneManager();
    manager.change("title");

    // canvas の context2D から得られる文字の横幅を得る関数
    function getTextWidth(str, font){
      if(!core.context2d){
        return str.length * 24;
      }else{
        core.context2d.font = font;
        var measure = core.context2d.measureText(str);
        return measure.width;
      }
    };

    // canvas が追加され次第 context2D を取得する
    core.currentScene.addEventListener("enterframe", ()=>{
      if(!core.canvas){
        core.canvas = document.getElementsByTagName("canvas")[0];
        if(core.canvas){
          core.context2d = core.canvas.getContext('2d');
          console.log("set context2d: ", core.context2d);
        }
      }
    });
  }
  core.start(); // ゲームをスタートさせます
  console.log("started game.");
};

////////// ツイートページを開くやつ //////////
var openTweetPage = function(){
  var message = "ミニゲーム『本を片付けて！』| 田原市図書館\n"
                + core.point + " 冊 片付けました！\n"
                + TWEET_MSG + "\n"
                + TWEET_URL + " #田原市図書館";

  var ua = navigator.userAgent.toLowerCase();
  var isAndroid = ua.indexOf('android') !== -1;
  var isiOS = (ua.indexOf("iphone") > -1) || (ua.indexOf("ipod") > -1) || (ua.indexOf("ipad") > -1);
  

  var iframe = document.body.appendChild(document.createElement("iframe"));
  iframe.style.display = "none";
  if(isiOS){
    iframe.src = 'twitter://post?message=' + message;
  }else if(isAndroid){
    iframe.src = 'intent://post?message=' + message + '#Intent;scheme=twitter;package=com.twitter.android;end;';
  }
  iframe.parentNode.removeChild(iframe);
  setTimeout(function(){
    location.href = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(message);
  }, 0);
};