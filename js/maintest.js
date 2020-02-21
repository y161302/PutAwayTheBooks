enchant(); // おまじない
var rand = function(n){ // よく使う [0-n) ランダム
  return Math.floor(Math.random() * n);
};

alert("ver. D");

// フラグがすべて建ったら main() を実行 //
var b = true;
var id = setInterval(()=>{
  if(window.prm){ 
    // 大体のフラグは html 内で onload="java..." ってしてる。ないやつは .js ファイル内にあるはず
    if(b && prm.WINDOW_ONLOAD && prm.ENCHANT_JS_ONLOAD && prm.FILELOAD_ONLOAD && prm.PARAMETER_ONLOAD && prm.USERDATAUTIL_ONLOAD){
      setTimeout(main, 1);
      b = false;
      clearInterval(id);
    }
  }
}, 1);

function main() {
  var stage = document.getElementById("enchant-stage");
  core = new Core(WIDTH, HEIGHT); // ゲーム本体を準備すると同時に、表示される領域の大きさを設定しています。
  core.fps = FPS; // frames（フレーム）per（毎）second（秒）：ゲームの進行スピードを設定しています。
  core.preload(PRELOAD);
  core.UserData = new UserDataUtil();
  
  core.onload = function() { // ゲームの準備が整ったらメインの処理を実行します。
    // canvas が追加され次第 context2D を取得する
    var timerID = setInterval(()=>{
      if(!core.canvas){
        core.canvas = document.getElementsByTagName("canvas")[0];
        if(core.canvas){
          core.context2d = core.canvas.getContext("2d");
          console.log("set context2d: ", core.context2d);
          clearInterval(timerID);
        }
      }
    }, 1);
    
    ////////// ウィンドウ設定（iOS対応用） //////////
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

    ////////// 音量設定を含めた音声再生するやつ //////////
    core.play = url => {
      if(url.indexOf(AudioBGMDir) >= 0){
        core.bgm = core.assets[url].clone();
        core.bgm.play();
        core.bgm.volume = VOLUME_BGM / 100;
      }else if(url.indexOf(AudioSEDir) >= 0){
        core.se = core.assets[url].clone();
        core.se.play();
        core.se.volume = VOLUME_SE / 100;
      }
    };
    core.setVolumeBGM = vol => {
      if(core.bgm)
        core.bgm.volume = vol * VOLUME_BGM / 100;
    };

    ////////// 距離を測るやつ //////////
    function getDistance(e, f){
      return Math.sqrt(Math.pow(e.x - f.x, 2) + Math.pow(e.y - f.y, 2));
    };

    ////////// canvas の context2D から得られる文字の横幅を得る関数 //////////
    function getTextSize(str, font){
      var temp = document.createElement("span");
      temp.style.font = font;
      var size = parseInt(temp.style.fontSize.replace(/[^0-9]/g, ""));
      if(!core.context2d){
        return {width: str.length * size / 2, height: size};
      }else{
        core.context2d.font = font;
        return {width: core.context2d.measureText(str).width, height: size};
      }
    };

    ////////// シーン管理 //////////
    var SceneManager = Class.create({
    change: function(sceneName){
      this.now = sceneName.toLowerCase();
      var style = stage.style;
      switch(sceneName.toLowerCase()){
      case "title":
        core.replaceScene(new TitleScene());
        style.background = "url('" + BackgroundDir + "bg_title" + (rand(2)+1) + ".png')";
        break;
      case "game":
        core.level = 1;
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
        style.background = "url('" + BackgroundDir + "bg_result1.png')";
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
      fp.image = core.assets[PartsDir + "BlackPanelA.png"];
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
        if(core.bgm) core.bgm.play();
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
        if(core.bgm){
          core.bgm.stop();
          core.bgm = undefined;
        }
        if(this.callback){
          this.callback();
          this.callback = undefined;
        }
      };
      fp.addEventListener("enterframe", () => {
        if(fp.delta){
          fp.count += fp.delta;
          fp.opacity = fp.count / fp.max;
          core.setVolumeBGM(1 - fp.opacity);
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

      // 音楽流してみるか enterframeで音楽最後まで行ったら最初からするようにしてる
      core.play(AudioBGMDir + "game1.mp3");

      this.touches = [];
      this.touchNum = 0;
      //------ タッチ入力（開始）
      this.addEventListener("touchstart", function(e) {
        var touch = {};
        var id = parseInt(e.x * LANE / WIDTH);
        touch.id = id;
        touch.count = core.fps; // １秒間は待ってくれる
        touch.book = this.lane[id].books.lastChild;
        touch.x = e.x;
        touch.y = e.y;
        // タッチが有効であるときは記録する
        if(!this.untouchable && !this.touches[id]){
          if(touch.book === undefined){ // 本がないとき
            if(e.y >= COUNTER_Y){ // お手付き！
              this.untouchable = WAITTIME;
              ottk.visible = true;
              bp.visible = true;
              core.play(AudioSEDir + "ottk.mp3");
            }
          }else{ // 本があるとき
            if(e.y >= COUNTER_Y || e.y >= touch.book.y){ // カウンターおよび本より画面的に下なら
              this.lane[id].touched();
              touch.start = {x: e.x, y: e.y};
              this.touches[id] = touch;
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
          if(getDistance(this.touches[id], e) < DISTMOVE){ // 一定距離内なら
            if(getDistance(this.touches[id].start, e) < DISTLIMIT || this.touches[id].book.color == Book.Color.indexOf("Black")){ // タッチ開始位置からの距離が一定距離内または黒い本なら
              // 指位置の更新
              this.touches[id].x = e.x;
              this.touches[id].y = e.y;
            }else{ // タッチ開始位置からの距離が一定距離内でないかつ黒い本でなければ
              // 消す
              this.touches[id] = undefined;
            }
          }else{ // 一定距離より離れてる場合の処理（どれか一つのタッチ記録を消す）
            // 隣のレーンのタッチ記録を見てどのタッチ記録を消すのか決めて消す
            if(id * 2 == near && id > 0){ // レーン左半分のとき
              if(this.touches[id - 1]){ // 左側にタッチ記録があれば
                if(getDistance(this.touches[id - 1], e) < DISTMOVE){ // 一定距離内なら左側を消す
                  this.touches[id - 1] = undefined;
                }else{ // 一定距離内でなければ近い方を消す
                  if(getDistance(this.touches[id], e) < getDistance(this.touches[id - 1], e)){
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
                if(getDistance(this.touches[id + 1], e) < DISTMOVE){
                  this.touches[id + 1] = undefined;
                }else{
                  if(getDistance(this.touches[id], e) < getDistance(this.touches[id + 1], e)){
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
              if(getDistance(this.touches[id - 1], e) < DISTMOVE // 一定距離内およびタッチ開始位置からの距離が一定距離内（黒以外）なら設定を移す
                 && (getDistance(this.touches[id - 1].start, e) < DISTLIMIT
                     || this.touches[id - 1].book.color == Book.Color.indexOf("Black"))){
                this.touches[id] = this.touches[id - 1];
                this.touches[id].x = e.x;
                this.touches[id].y = e.y;
              }else{ // 一定距離内でなければ消す
                this.touches[id - 1] = undefined;
              }
            }
          }else if(id * 2 + 1 == near && id < LANE - 1){ // レーン右半分のときも同じ
            if(this.touches[id + 1]){
              if(getDistance(this.touches[id + 1], e) < DISTMOVE // 一定距離内およびタッチ開始位置からの距離が一定距離内（黒以外）なら設定を移す
                 && (getDistance(this.touches[id + 1].start, e) < DISTLIMIT
                     || this.touches[id + 1].book.color == Book.Color.indexOf("Black"))){
                this.touches[id] = this.touches[id + 1];
                this.touches[id].x = e.x;
                this.touches[id].y = e.y;
              }else{
                this.touches[id + 1] = undefined;
              }
            }
          }
        }
      });
      //------ タッチ入力（終了）
      this.addEventListener("touchend", function(e){
        var id = parseInt(e.x * LANE / WIDTH);
        if(this.touches[id]){
          var touch = this.touches[id];
          // タッチ開始した時の本が黒のとき
          if(touch.book.color == Book.Color.indexOf("Black")){
            if(touch.start.y - e.y > DISTBLACK){ // 指定の縦の距離より上で離しているなら片付ける
              this.lane[touch.id].removeBook(touch.book);
            }
          }else{ // タッチ開始した時の本が黒以外のとき
            if(getDistance(touch.start, e) < DISTLIMIT){ // タッチ開始位置からの距離が一定距離内なら片付ける
              this.lane[touch.id].removeBook(touch.book);
            }
          }
          this.touches[id] = undefined;
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
              // ゲームオーバー音を鳴らそう
              core.play(AudioSEDir + "gameOver.mp3");
              
              this.isGameOver = true;
              gameover.visible = true;
              this.doFadeOut(()=>{this.finished = true;});
              this.untouchable = 100;
            }
          }
        }else{ // this.finished: true;
          manager.change("result");
        }

        // 音楽のループ
        if(core.bgm.currentTime >= 104){
          core.bgm.pause();
          core.bgm.currentTime = 0;
          core.bgm.play();
        }
      });

      // ゲーム実行開始前の処理
      this.doFadeIn();
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
        core.play(AudioSEDir + "pageEnd.mp3");
      };

      // つづけるボタンを押したときの動作
      var resumed = ()=>{
        this.doFadeOut(()=>{
          manager.change("title");
        });
        core.play(AudioSEDir + "pageResume.mp3");
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
      label2.y = WIDTH - 20 - getTextSize(label2.text, label2.font).width;
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

      var best = new BestLabel();

      var rank = new RankLabel(core.point);

      // オブジェクトの追加
      this.addChildOnFadePanel(gameover);
      this.addChild(label1);
      this.addChild(ptLabel);
      this.addChild(label2);
      this.addChild(tweet);
      this.addChild(resume);
      this.addChild(end);
      this.addChild(best);

      // 音楽鳴らすぜぇ
      core.play(AudioBGMDir + "result1.mp3");

      // スコアの保存と前回のスコアの取得
      this.pointPrev = core.UserData.prev;
      core.UserData.prev = core.point;
      if(core.UserData.best < core.point){ // 自己ベスト
        this.best = true;
        core.UserData.best = core.point;
      }
      core.UserData.exportUserData();

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
          best.show();
        }
        if(this.age == 60 && !this.finished){
          ptLabel.random = false;
          ptLabel.text = core.point + " 冊";
          ptLabel.x = (WIDTH - getTextSize(ptLabel.text, ptLabel.font).width) / 2;
          rank.show();
        }
        if(this.age > 60 && this.age <= 90 && !this.finished){
          resume.opacity = (this.age - 60) / 30;
          end.opacity = (this.age - 60) / 30;
        }
        if(this.age == 90 && !this.finished){
          tweet.visible = true;
          this.finished = true;
          best.finish();
          rank.finish();
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
          ptLabel.x = (WIDTH - getTextSize(ptLabel.text, ptLabel.font).width) / 2;
          
          //ボタンを表示
          tweet.visible = true;
          resume.opacity = 1.0;
          end.opacity = 1.0;
          best.finish();
          rank.finish();
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
        core.play(AudioSEDir + "gameStart.mp3");
      };

      // オブジェクトの生成
      var logo = new TitleLogo();
      var book = new TitleBook();
      var nanobee = new Nanobee();
      var start = new StartButton(started);
      var volPanel = new VolumeSettingPanel();
      var volIcon = new VolumeIcon(function(){volPanel.visible = true;});
      var sb = new SpeechBubble();
      var that = this;

      // オブジェクトの追加
      this.addChild(logo);
      this.addChild(book);
      this.addChild(nanobee);
      this.addChild(start);
      sb.addToParent(function(node){that.insertBefore(node, start)});
      this.addChild(volIcon);
      this.addChild(volPanel);

      // 音楽流すぜ
      core.play(AudioBGMDir + "title1.mp3");

      // すべての子要素に対して有効とする奴
      var enabling = function(node, enable){
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
          sb.show(rand(SpeechBubbleNum));
        }else if(!sb.visible){
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
    X: {
      get(){
        if(this._xx === undefined)
          return this.x;
        else
          return this._xx;
      },
      set(x){
        this.x = x - this.width * (1 - this.scaleX) / 2;
        this._xx = x;
      }
    },
    Y: {
      get(){
        if(this._yy === undefined)
          return this.y;
        else
          return this._yy;
      },
      set(y){
        
        this.y = y - this.height * (1 - this.scaleY) / 2;
        this._yy = y;
      }
    },
    getXbyX: function(X){
      return X - this.width * (1 - this.scaleX) / 2;
    },
    getYbyY: function(Y){
      return Y - this.height * (1 - this.scaleY) / 2;
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
        var l = parseInt(this.LAMBDA);
        if(core.frame % l == 0){
          this.numberOfAppear = rand(l);
        }
        if(core.frame % l == this.numberOfAppear){
          this.humans.insertBefore(new Human(this, this.SPEED, this.getHumanNum()), this.humans.firstChild);
        }
        this.warnning = (this.books.childNodes.length > LIMIT * 0.7) || (this.books.childNodes.length >= LIMIT - 3);
      });
    },
    getBookNum: function(){
      return this.books.childNodes.length;
    },
    addBook: function(){
      var n = parseInt(((this.Level - 1) % 10) / 2) - rand(5) + 1;
      if(n < 1) n = 1;
      if(core.level > 30) n = rand(4) + 3; // ３～６冊
      for(var i=0; i<n; i++){
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
      if(book.color == Book.Color.indexOf("Black"))
        core.play(AudioSEDir + "bookBlack.mp3");
      else
        core.play(AudioSEDir + "bookRemove.mp3");
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
      if(this.touchNum >= (4 + parseInt(this.Level / 5)))
        this.levelUp();
    },
    levelUp: function(){
      this.Level++;
      if(core.level < this.Level){
        core.play(AudioSEDir + "LvUp.mp3");
        this.lvup.start();
        core.level = this.Level;
        console.log("Lv. " + core.level);
      }
      this.touchNum = 0;
      if(this.Level > 30){
        this.WAITTIME = 5;
        this.LAMBDA = 10;
        this.SPEED = 3;
      }else{
        var offset = parseInt((this.Level - 1) / 10);
        var value = (((this.Level - 1) % 10) * (offset + 1)) / 30; // Lv.1 - 30 が 30 段階になるように（上がり方はのこぎり状）
        this.WAITTIME = WAITTIME - (WAITTIME - 10) * value;
        this.LAMBDA = LAMBDA - (LAMBDA - 15) * value;
        this.SPEED = SPEED + value * 1.5;
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
      this.image = core.assets[`${PartsDir}Book${Book.Color[colorNum]}A.png`];
      this.color = colorNum;
      this.x = (lane.id * 2 + 1) * WIDTH / (LANE * 2) - this.width / 2 + index * (lane.id - (LANE - 1) / 2) * Book.PILE.X;
      this.y = COUNTER_Y + 40 - index * Book.PILE.Y;
      this.addEventListener("enterframe", ()=>{
        var idx = lane.books.childNodes.indexOf(this);
        this.x = (lane.id * 2 + 1) * WIDTH / (LANE * 2) - this.width / 2 + idx * (lane.id - (LANE - 1) / 2) * Book.PILE.X;
        this.y = COUNTER_Y + 40 - idx * Book.PILE.Y;
      });
      if(colorNum == Book.Color.indexOf("Black")){
        lane.scene.addChild(new SwipeHelper(lane, this));
      }
    }
    });
    Book.Color = ["Black", "White", "Red", "Blue", "Yellow", "Green"];
    Book.PILE = {X: 1, Y: 9}; // 描画時に重なって見えるようにずらす幅

    //------ スワイプヘルパー
    var SwipeHelper = Class.create(ScaleSprite, {
    initialize: function(lane, book){
      var image = core.assets[PartsDir + "SwipeHelperA.png"];
      ScaleSprite.call(this, image.width, image.height);
      this.image = image;
      this.X = book.x + (book.width - this.width) / 2;
      this.Y = book.y - this.height - 10;
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
      this.image = (index == LIMIT - 1) ? core.assets[PartsDir + "BookFrameLimitA.png"] : core.assets[PartsDir + "BookFrameA.png"];
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
      //console.log("./img/Human" + (rand(2) + 1) + "A.png");
      this.SPEED = lane.SPEED;
      var goalY = COUNTER_Y - HUMANHEIGHT * 0.4;
      var image;
      var frameLoop;
      // RareRate に収まっていればレアキャラが出てくる
      if(rand(100) < RARERATE){
        // 図書館キャラの動きの定義
        var n = rand(4);
        image = core.assets[RareDir + "guest_" + n + "A.png"];
        frameLoop = [1];
        ScaleSprite.call(this, image.width, image.height);
      }else{
        var n = rand(HumanNum);
        var setting;
        HumanSetting.forEach(s=>{if(0<=n&&n<s.num) setting=s; n-=s.num;});
        image = core.assets[HumanDir + setting.name + (rand(setting.num) + 1) + "A.png"];
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
      this.Y = setY; // ScaleSprite.Y()
      var offsetX = (lane.id * 2 + 1) * WIDTH / (LANE * 2) - this.width * scale / 2; // レーンの中心Ｘ座標をずらす前のＸ座標とする
      var setX = offsetX - (lane.id - (LANE - 1) / 2) * ((COUNTER_Y - 60) - setY) / 10; // 初期Ｘ座標は少し中心寄り
      this.X = setX; // ScaleSprite.X()
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
            this.Y = setY;
            setX = offsetX - (lane.id - (LANE - 1) / 2) * (goalY - setY) / 8;
            this.X = setX;
            this.moveAge++;
          }
        }else{ // ゴールにたどり着いたとき
          if(this.c == 0){ // たどり着いた瞬間の処理
            lane.addBook();
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
      this.image = core.assets[PartsDir + "LEVELUPA.png"];
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
      this.image = core.assets[PartsDir + "Counter.png"];
      this.x = 0;
      this.y = COUNTER_Y;
    }
    });

    //------ ブラックパネルクラス（画面自体を暗くするやつ）
    var BlackPanel = Class.create(ScaleSprite, {
    initialize: function(){
      ScaleSprite.call(this, WIDTH, HEIGHT);
      this.image = core.assets[PartsDir + "BlackPanelA.png"];
      this.opacity = 0.4;
    }
    });

    //------ ポイント表示用クラス
    var PointLabel = Class.create(Label, {
    initialize: function(){
      Label.call(this);
      this.font = "36px Comic Sans MS";
      this.text = "0 冊";
      // ポイント文字の横幅を取得する関数
      this.x = (WIDTH - getTextSize(this.text, this.font).width) / 2;
      this.y = 560;
      this.addEventListener("enterframe", ()=>{
        if(this.random)
          this.text = rand(core.point) + " 冊";
        else
          this.text = core.point + " 冊";
        this.x = (WIDTH - getTextSize(this.text, this.font).width) / 2;
      });
    }
    });

    //------ お手付き表示クラス
    var Otetsuki = Class.create(ScaleSprite, {
    initialize: function(){
      ScaleSprite.call(this, 262, 67);
      this.image = core.assets[PartsDir + "OtetsukiA.png"];
      this.x = (WIDTH - this.width) / 2;
      this.y = 420;
      this.visible = false;
    }
    });

    //------ ゲームオーバー表示クラス
    var GameOverSprite = Class.create(ScaleSprite, {
    initialize: function(){
      ScaleSprite.call(this, 456, 80);
      this.image = core.assets[PartsDir + "GameOverA.png"];
      this.y = (HEIGHT - this.height) / 2;
      this.x = (WIDTH - this.width) / 2;
      this.visible = false;
    }
    });

    //------ 危険な時のエフェクト表示クラス
    var WarnningPanel = Class.create(ScaleSprite, {
    initialize: function(){
      ScaleSprite.call(this, WIDTH, HEIGHT);
      this.image = core.assets[PartsDir + "WarnningPanelA.png"];
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
      var image = core.assets[PartsDir + "title_title.png"];
      ScaleSprite.call(this, image.width, image.height);
      this.image = image;
    }
    });

    //------ タイトルに表示する本
    var TitleBook = Class.create(ScaleSprite, {
    initialize: function(){
      var image = core.assets[PartsDir + "title_book.png"];
      ScaleSprite.call(this, image.width, image.height);
      this.image = image;
      this.y = 160;
    }
    });

    //------ タイトルに表示するなのビィ
    var Nanobee = Class.create(ScaleSprite, {
    initialize: function(){
      var image = core.assets[RareDir + "guest_2A.png"];
      ScaleSprite.call(this, image.width, image.height);
      this.image = image;
      var scale = 240 / this.height;
      this.scaleX = scale;
      this.scaleY = scale;
      this.X = 300;
      this.Y = 100;
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
    var SpeechBubble = Class.create({
    initialize: function(){
      this.sbs = [];
      for(var i=0; i<SpeechBubbleNum; i++){
        var image = core.assets[PartsDir + "SpeechBubble" + (i+1) + "A.png"];
        var sb = new ScaleSprite(image.width, image.height);
        sb.image = image;
        sb.w = 300;
        sb.scale = sb.w / image.width;
        sb.h = image.height * sb.scale;
        sb.scaleX = 0;
        sb.scaleY = 0;
        sb.X = sb.w;
        sb.Y = 120 + sb.h;
        sb.visible = false;
        this.sbs.push(sb);
      }
    },
    addToParent: function(addFunc){
      this.sbs.forEach(addFunc);
    },
    show: function(num){
      var sb = this.sbs[num];
      sb.visible = true;
      this.visible = true;
      var moveFrame = parseInt(FPS / 3);
      sb.tl.moveBy(-sb.w/2, -sb.h/2, moveFrame).and().scaleTo(sb.scale, moveFrame)
           .delay(parseInt(FPS * 2.5))
           .moveBy(sb.w/2, sb.h/2, moveFrame).and().scaleTo(0, moveFrame)
             .then(function(){sb.visible = false; this.visible = false; sb.tl.clear();});
    }
    });

    //------はじめるボタン
    var StartButton = Class.create(ScaleSprite, {
    initialize: function(start){
      var image = core.assets[PartsDir + "StartImageA.png"];
      ScaleSprite.call(this, image.width, image.height);
      this.image = image;
      this.start = start;
      var w = 300;
      var scale = w / image.width;
      var h = image.height * scale;
      this.scaleX = scale;
      this.scaleY = scale;
      this.X = WIDTH / 2 - this.width * scale / 2;
      this.Y = 520;
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
      image = core.assets[PartsDir + "ResumeImageA.png"];
      ScaleSprite.call(this, image.width, image.height);
      this.image = image;
      this.resume = resume;

      var w = 200;
      var scale = w / image.width;
      var h = image.height * scale;
      this.scaleX = scale;
      this.scaleY = scale;
      this.X = WIDTH * 1 / 4 - this.width * scale / 2;
      this.Y = 540;
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
      image = core.assets[PartsDir + "EndImageA.png"];
      ScaleSprite.call(this, image.width, image.height);
      this.image = image;
      this.end = end;

      var w = 200;
      var scale = w / image.width;
      var h = image.height * scale;
      this.scaleX = scale;
      this.scaleY = scale;
      this.X = WIDTH * 3 / 4 - this.width * scale / 2;
      this.Y = 540;
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

    // 自己ベスト！の表示
    var BestLabel = Class.create(ScaleSprite, {
    initialize: function(){
      // 画像設定とか
      var image = core.assets[PartsDir + "best.png"];
      ScaleSprite.call(this, image.width, image.height);
      this.image = image;

      // 場所とかの設定
      var w = WIDTH / 2;
      this.scaleX = w / image.width;
      this.scaleY = w / image.width;
      this.X = 0;
      this.Y = 340;

      // 最初は見えない
      this.opacity = 0;
    },
    show: function(){
      // ちかちかさせる
      this.tl.delay(parseInt(FPS / 5)).show()
             .delay(parseInt(FPS / 5)).hide().loop();
    },
    finish: function(){
      // ちかちかを終えて固定する
      this.tl.clear();
      this.opacity = 1;
    }
    });

    // ランクの表示
    var RankLabel = Class.create(ScaleSprite, {
    initialize: function(score){
      // ランクを測る
      var rank = parseInt(score/200);
      if(rank > 4) rank = 4;

      // 画像設定とか
      var image = core.assets[PartsDir + "rank" + rank + ".png"];
      ScaleSprite.call(this, image.width, image.height);
      this.image = image;

      // 最初は見えない小ささ
      this.scaleX = 0;
      this.scaleY = 0;

      // 初期位置は画面中央 (スケールが０のため画面中央指定で大丈夫）
      this.X = WIDTH / 2;
      this.Y = HEIGHT / 2;

      // 傾きを最終の傾きにしておく
      this.rotate(35);

      // 透明度まっくす
      this.opacity = 0;
    },
    show: function(){
      // 全体的に中心の座標に従って動く
      this.tl.tween({ // 画面中央で拡大しながら回転
        scaleX: WIDTH / this.width,
        scaleY: WIDTH / this.width,
        rotation: this.rotation + 2880,
        opacity: 1,
        time: FPS * 2,
      }).tween({ // 目的地（画面右上のほう）へ[横幅がWIDTHの1/3]まで縮小しながら移動
        scaleX: (WIDTH * 1/3) / this.width,
        scaleY: (WIDTH * 1/3) / this.width,
        X: (WIDTH + WIDTH/2 - WIDTH/3) / 2,
        Y: 200 - this.height * this.scaleY / 2,
        time: FPS,
        easing: Easing.SIN_EASEIN,
      }).tween({ // 目的地で[横幅がWIDTHの1/2]まで拡大
        scaleX: (WIDTH * 1/2) / this.width,
        scaleY: (WIDTH * 1/2) / this.width,
        time: parseInt(FPS / 4);
        easing: Easing.SIN_EASEOUT,
      });
    },
    finish: function(){
      this.tl.clear();
      var scale = (WIDTH * 1/3) / this.width;
      this.scaleX = scale;
      this.scaleY = scale;
      this.X = (WIDTH + WIDTH/2 - WIDTH/3) / 2;
      this.Y = 200 - this.height * scale / 2;
    }
    });

    // 音量設定パネルを開くためのアイコン
    var VolumeIcon = Class.create(ScaleSprite, {
    initialize: function(PanelOpenFunc){
      var image = core.assets[PartsDir + "VolumeIcon.png"];
      ScaleSprite.call(this, image.width, image.height);
      var scale = 50 / image.width;
      this.image = image;
      this.scaleX = scale;
      this.scaleY = scale;
      var x = 10;
      var y = 580;
      this.X = x;
      this.Y = y;
      var that = this;
      this.addEventListener("touchstart", function(e){
        // アイコン上をタッチしたら少しだけ透過
        if(!this.touch &&
           e.x >= x && e.x < x + that.width * that.scaleX &&
           e.y >= y && e.y < y + that.height * that.scaleY){
          that.opacity = 0.6;
          that.touch = e;
        }
      });
      this.addEventListener("touchmove", function(e){
        // アイコン上から外れたら元に戻す
        if(e.x < x || e.x >= x + that.width * that.scaleX ||
           e.y < y || e.y >= y + that.height * that.scaleY){
          that.opacity = 1;
          that.touch = undefined;
        }
      });
      this.addEventListener("touchend", function(e){
        // アイコン上で離したらタッチしたことにする
        if(that.touch &&
           e.x >= x && e.x < x + that.width * that.scaleX &&
           e.y >= y && e.y < y + that.height * that.scaleY){
          that.opacity = 1;
          that.touch = undefined;
          PanelOpenFunc();
        }
      });
    }
    });

    //------ 音量設定パネル
    var VolumeSettingPanel = Class.create(Group, {
    initialize: function(){
      Group.call(this);
      this.x = 0;
      this.y = 0;
      this._visible = true;

      // シークバー表示位置
      var barX = 80;

      // 背景を暗くする
      var bp = new Sprite(WIDTH, HEIGHT);
      bp.image = core.assets[PartsDir + "BlackPanelA.png"];
      bp.opacity = 0.6;

      // 背景画像
      var image = core.assets[PartsDir + "1819.png"];
      var scale = WIDTH / image.width;
      var bgp = new ScaleSprite(image.width, image.height);
      bgp.image = image;
      bgp.scaleX = scale;
      bgp.scaleY = scale;
      bgp.X = 0;
      bgp.Y = (HEIGHT - image.height * scale) / 2;

      // BGM 音量設定のラベル
      var bgmLabel = new Label();
      bgmLabel.font = "32px sans serif";
      bgmLabel.text = "BGM の音量"
      bgmLabel.x = barX - 20;
      bgmLabel.y = bgp.Y + 60;

      // BGM 音量設定のシークバー
      var bgmSeekBar = new SeekBar(barX, bgp.Y + 100, WIDTH - barX * 2, 40, (value)=>{
        core.UserData.bgm = value;
        VOLUME_BGM = value;
        core.setVolumeBGM(1);
      });
      bgmSeekBar.value = (core.UserData.BGM || VOLUME_BGM);

      // 効果音の音量設定のラベル
      var seLabel = new Label();
      seLabel.font = "32px sans serif";
      seLabel.text = "効果音の音量"
      seLabel.x = barX - 20;
      seLabel.y = bgp.Y + 160;

      // 効果音の音量性のシークバー
      var seSeekBar = new SeekBar(barX, bgp.Y + 200, WIDTH - barX * 2, 40, (value)=>{
        core.UserData.se = value;
        VOLUME_SE = value;
      });
      seSeekBar.value = (core.UserData.se || VOLUME_SE);

      // x ボタン
      var closeButton = new Label();
      closeButton.font = "24px sans serif";
      closeButton.text = "x";
      closeButton.size = getTextSize(closeButton.text, closeButton.font);
      closeButton.x = (WIDTH - closeButton.size.width) / 2;
      closeButton.y = bgp.Y + 280;
      
      // 部品の追加
      this.addChild(bp);
      this.addChild(bgp);
      this.addChild(bgmLabel);
      this.addChild(bgmSeekBar);
      this.addChild(seLabel);
      this.addChild(seSeekBar);
      this.addChild(closeButton);

      // 部品を追加したので非表示設定
      this.visible = false;

      // x ボタンが押されたら保存して消す
      var that = this;
      this.addEventListener("touchstart", function(e){
        if(e.x >= closeButton.x &&
           e.x < closeButton.x + closeButton.size.width &&
           e.y >= closeButton.y &&
           e.y < closeButton.y + closeButton.size.height){
          that.visible = false;
          core.UserData.exportUserData();
        }
      });
    },
    visible: {
      get(){
        return this._visible;
      }, set(value){
        this._visible = value;
        this.childNodes.forEach(node=>{node.visible = value;});
      }
    }
    });

    //------ シークバー
    var SeekBar = Class.create(Group, {
    initialize: function(x, y, w, h, targetfunc){
      Group.call(this);
      this.x = x;
      this.y = y;
      this.w = w; // 単純に数値保持のため
      this.h = h; // 同上
      this.barW = 0.7 * this.w;
      this.targetFunc = targetfunc; // 値が変わった時に設定する関数

      // シークバーのバー
      var image = core.assets[PartsDir + "SeekBar.png"];
      var bar = new ScaleSprite(image.width, image.height);
      bar.image = image;
      bar.scaleX = this.barW / image.width; // w = シークバー＋数値 なので横幅は７割にする
      bar.scaleY = h / image.height / 6; // h = シークバー＋ポインター なので縦幅は 1/6 にする
      bar.X = 0;
      bar.Y = (h + h/6) / 2;

      // 数値表示用ラベル this.text を変更すると座標が設定される
      this.label = new Label();
      this.label.font = (h * 0.6) + "px sans-serif";

      // シークポインタ用なのビィ
      image = core.assets[RareDir + "guest_2A.png"];
      var pointer = new ScaleSprite(image.width, image.height);
      pointer.image = image;
      var scale = h / image.height;
      pointer.scaleX = scale;
      pointer.scaleY = scale;
      pointer.X = - pointer.width * pointer.scaleX / 2;
      pointer.Y = 0;
      pointer.rotate = -30;
      pointer.tl.rotateTo(0, parseInt(FPS/4), enchant.Easing.SIN_EASEIN)
                .rotateTo(30, parseInt(FPS/4), enchant.Easing.SIN_EASEOUT)
                .rotateTo(0, parseInt(FPS/4), enchant.Easing.SIN_EASEIN)
                .rotateTo(-30, parseInt(FPS/4), enchant.Easing.SIN_EASEOUT).loop();
      this.pointer = pointer;

      // 要素を追加
      this.addChild(bar);
      this.addChild(pointer);
      this.addChild(this.label);

      // タッチ操作で動かすリスナー
      var that = this;
      var offsetX = 0;
      var offsetValue = 0;
      var pointerX = 0;
      this.touchable = undefined;
      this.addEventListener("touchstart", function(e){
        if(e.x > x + pointer.X - 10 &&
           e.x < x + pointer.X + pointer.width * pointer.scaleY + 10 &&
           e.y > y + pointer.Y - 10 &&
           e.y < y + pointer.Y + pointer.height * pointer.scaleY + 10 &&
           that.touchable === undefined){
          that.touchable = e;
          offsetX = e.x;
          offsetValue = that.value;
        }
      });
      this.addEventListener("touchmove", function(e){
        if(that.touchable && getDistance(e, that.touchable) < DISTMOVE){
          that.touchable.x = e.x;
          that.touchable.y = e.y;
          that.value = offsetValue + parseInt((e.x - offsetX) / that.barW * 100);
        }else{
          that.touchable = undefined;
        }
      });
      this.addEventListener("touchend", function(e){
        if(that.touchable){
          if(getDistance(e, that.touchable) > DISTMOVE){
            e = that.touchable;
          }
          that.value = offsetValue + parseInt((e.x - offsetX) * 100 / that.barW);
          setTimeout(function(){
            var tempSE = core.assets[AudioSEDir + "LvUp.mp3"].clone();
            tempSE.play();
            tempSE.volume = that.value / 100;
          }, 1);
        }
        that.touchable = undefined;
      });
    },
    value: {
      set(value){
        if(typeof(value) === typeof(""))
          var value = parseInt(value.replace(/[^0-9]/g, ""));
        // 数値を [0-100] に丸める
        if(isNaN(value) || value < 0) value = 0;
        else if(value>100){
          value = 100;
        }

        this._value = value;

        // ラベルに数値をセットする
        this.label.text = value + "";
        var size = getTextSize(this.label.text, this.label.font);
        this.label.x = this.barW + ((this.w - this.barW) - size.width) / 2;
        this.label.y = (this.h - size.height) / 2;

        // ポインターを動かす
        this.pointer.X = (- this.pointer.width * this.pointer.scaleX / 2) + this.barW * value / 100;
        
        // targetFunc があれば実行
        if(this.targetFunc) this.targetFunc(value);
      },
      get(){
        return this._value;
      }
    }
    });

    //------ ツイートボタン
    var TweetButton = Class.create(ScaleSprite, {
    initialize: function(){
      var image = core.assets[PartsDir + "Twitter_Social_Icon_Circle_Color.png"];
      ScaleSprite.call(this, image.width, image.height);
      this.image = image;
      var size = 80;
      var scale = size / this.height;
      this.scaleX = scale;
      this.scaleY = scale;
      this.X = (WIDTH - this.width * this.scaleX) / 2;
      this.Y = 400;
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
  var isAndroid = ua.indexOf("android") !== -1;
  var isiOS = (ua.indexOf("iphone") > -1) || (ua.indexOf("ipod") > -1) || (ua.indexOf("ipad") > -1);
  

  var iframe = document.body.appendChild(document.createElement("iframe"));
  iframe.style.display = "none";
  if(isiOS){
    iframe.src = "twitter://post?message=" + message;
  }else if(isAndroid){
    iframe.src = "intent://post?message=" + message + "#Intent;scheme=twitter;package=com.twitter.android;end;";
  }
  iframe.parentNode.removeChild(iframe);
  setTimeout(function(){
    location.href = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(message);
  }, 0);
};