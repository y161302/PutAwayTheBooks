fileload();

async function fileload(){
  await getFileList("./assetsFileList.txt")
    .then(filelist=>{
      PRELOAD = filelist;
    });
  prm.FILELOAD_ONLOAD = true;
}

function getFileList(url){
  return new Promise(resolve=>{
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "text";
    xhr.onload = ()=>{
      resolve(xhr.responseText.split("\n"));
    };
    xhr.send("");
  });
}