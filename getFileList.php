<?php
echo getFileList("./assets");

function getFileList($path){
  $ret = "";
  if(is_dir($path)){
    foreach(glob("$path/*") as $file){
      $result = getFileList($file);
      if($ret === "")
        $ret = $result;
      else
        $ret .= "\n$result";
    }
    return $ret;
  }else{
    return $path;
  }
}