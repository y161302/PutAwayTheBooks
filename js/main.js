enchant(); // おまじない
var rand = function(n){
  return Math.floor(Math.random() * n);
};
 
window.onload = function() {
  
  // 行の終わりには、;（セミコロン）を付けます。
 
  var game = new Game(480, 640); // ゲーム本体を準備すると同時に、表示される領域の大きさを設定しています。
  game.fps = 15; // frames（フレーム）per（毎）second（秒）：ゲームの進行スピードを設定しています。
  game.preload("./img/BookBlackA.png", "./img/BookBlueA.png", "./img/BookGreenA.png", "./img/BookRedA.png", "./img/BookWhiteA.png", "./img/BookYellowA.png", "./img/Counter.png", "./img/Human1A.png", "./img/Human2A.png"); // pre（前）-load（読み込み）：ゲームに使う素材をあらかじめ読み込んでおきます。
 
  game.onload = function() { // ゲームの準備が整ったらメインの処理を実行します。
    /********** 表示位置 **********/
    var baseW = 500;
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
        console.log("initial-scale=" + w/480);
        viewportContent = "width=480,initial-scale=" + w/480 + ",user-scalable=no,shrink-to-fit=no";
      }else{
        viewportContent = "width=device-width,initial-scale=1.0,user-scalable=no,shrink-to-fit=no";
      }
      document.querySelector("meta[name='viewport']").setAttribute("content", viewportContent);
    }
/*
    var left = ( window.innerWidth - ( game.width * game.scale ) ) / 2;
    $('#enchant-stage').css({
      "position":"absolute",
      "left":left+"px"
      });
    game._pageX = left;
*/

    /********** グループの生成 **********/
    var grpBook = new Group();
    var grpHuman = new Group();

    /********** 各オブジェクトの生成 **********/
    // 本オブジェクト
    var Book = Class.create(Sprite, {
    initialize: function(colorNum) {
      Sprite.call(this, 25, 40);
      switch(colorNum){
      case Book.WHITE: this.image = game.assets['./img/BookWhiteA.png']; break;
      case Book.RED: this.image = game.assets['./img/BookRedA.png']; break;
      case Book.BLUE: this.image = game.assets['./img/BookBlueA.png']; break;
      case Book.YELLOW: this.image = game.assets['./img/BookYellowA.png']; break;
      case Book.GREEN: this.image = game.assets['./img/BookGreenA.png']; break;
      case Book.BLACK: default: this.image = game.assets['./img/BookBlackA.png']; break;
      }
      this.y = 340;
      grpBook.addChild(this);
    }
    });
    Book.BLACK = 0;
    Book.WHITE = 1;
    Book.RED = 2;
    Book.BLUE = 3;
    Book.YELLOW = 4;
    Book.GREEN = 5;
    
    // 人オブジェクト
    var Human = Class.create(Sprite, {
    initialize: function(){
      //console.log('./img/Human' + (rand(2) + 1) + 'A.png');
      Sprite.call(this, 45, 90);
      this.image = game.assets['./img/Human' + (rand(2) + 1) + 'A.png'];
      grpHuman.addChild(this);
    }
    });
    
    // カウンターオブジェクト
    var counter = new Sprite(480, 264);
    counter.image = game.assets['./img/Counter.png'];
    counter.x = 0;
    counter.y = 300;

    /********** ルートシーンへの追加 **********/
    game.rootScene.addChild(grpHuman);
    game.rootScene.addChild(counter);
    game.rootScene.addChild(grpBook);

    /********** キーボード入力の登録 **********/
    game.keybind('B'.charCodeAt(0), 'b');
    game.keybind('H'.charCodeAt(0), 'h');

    /********** キーボード入力の処理 **********/
    game.rootScene.addEventListener('enterframe', ()=>{
      if(game.input.b){
        var b = new Book(rand(5));
        b.x = (rand(3) + 1) * 480 / 4;
        grpBook.addChild(b);
        console.log("added book ({$b.x}, {$b.y})");
      }
      if(game.input.h){
        var h = new Human();
        h.x = (rand(3) + 1) * 480 / 4;
        h.y = 0;
        grpHuman.addChild(h);
        console.log("added human");
      }
    });

    alert("読み込み完了");
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