/***************************************
  ユーザーデータ
  .score.best: 自己ベスト
  .score.prev: 前回のスコア
  .volume.BGM: BGM の音量
  .volume.SE:  効果音の音量

  コンストラクタを実行するとローカルストレージから読み出す(なければ作る）
  .exportUserData() を実行するとローカルストレージに現在の設定を保存できる
 ***************************************/
class UserDataUtil {
  constructor() { // read UserData from localStorage
    if(localStorage["pabUserData"]){
      this.data = JSON.parse(localStorage["pabUserData"]);
    }else{
      this.data = this.createUserData();
      if(window.prm && !window.prm.PARAMETER_LOADED){
        var id = setInterval(()=>{
          var b = true;
          if(b && prm.PARAMETER_LOADED){
            b = false;
            this.volumeBGM = VOLUME_BGM;
            this.volumeSE = VOLUME_SE;
            clearInterval(id);
          }
        }, 1);
      }
    }
  }

  /********** ユーザーデータを作る **********/
  createUserData(){
    return {
    volume: {BGM: window.VOLUME_BGM, SE: window.VOLUME_SE},
    score: {best: 0, prev: 0},
    };
  }

  /********** ユーザーデータを保存する **********/
  exportUserData(){
    localStorage["pabUserData"] = JSON.stringify(this.data);
    console.log("update UserData to localStorage.");
  }

  /********** スコアのゲッターとセッター **********/
  set best(score){
    this.data.score.best = score;
  }
  get best(){
    return this.data.score.best;
  }

  set prev(score){
    this.data.score.prev = score;
  }
  get prev(){
    return this.data.score.prev;
  }

  set score(score){
    if(score.best){
      this.best = score.best;
    }
    if(score.prev){
      this.prev = score.prev;
    }
  }
  get score(){
    return this.data.score;
  }

  /********** 音量のゲッターとセッター **********/
  set BGM(volume){
    this.data.volume.BGM = volume;
  }
  get BGM(){
    return this.data.volume.BGM;
  }

  set bgm(volume){
    this.BGM = volume;
  }
  get bgm(){
    return this.BGM;
  }

  set SE(volume){
    this.data.volume.SE = volume;
  }
  get SE(){
    return this.data.volume.SE;
  }

  set se(volume){
    this.SE = volume;
  }
  get se(){
    return this.SE;
  }

  set volume(volume){
    if(volume.BGM){
      this.BGM = volume.BGM;
    }
    if(volume.SE){
      this.SE = volume.SE;
    }
  }
  get volume(){
    return this.data.volume;
  }
}