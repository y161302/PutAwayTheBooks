fileload();

function fileload(){
  getFileList("./getFileList.php")
    .then(filelist=>{
      PRELOAD = filelist;
      prm.FILELOAD_ONLOAD = true;
    });
}

function getFileList(url){
  return new Promise(resolve=>{
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "text";
    xhr.onload = ()=>{
      resolve(xhr.responseText.replace(/\r/g, "\n").replace(/\n\n/g, "\n").split("\n").filter(value=>value!==""));
    };
    xhr.send("");
  });
}