<?php

function rsearch($folder, $pattern_array) {
    $return = array();
    $iti = new RecursiveDirectoryIterator($folder);
    foreach(new RecursiveIteratorIterator($iti) as $file){
        if (in_array(strtolower(array_pop(explode('.', $file))), $pattern_array)){
            $return[] = $file;
        }
    }
    return $return;
}

#$images = glob("*.{jpg,jpeg,png,bmp}", GLOB_BRACE);
#$images = rglob("*.{jpg,jpeg,png,bmp}");
$images = rsearch('.', array('jpg','jpeg','png','bmp'));
natcasesort($images);

$olddir = dirname($images[1]);

foreach (array_reverse($images) as $image) {
    if ($olddir != dirname($image))
        echo "<hr><h3>".dirname($image)."</h3><hr>";
    echo '<a href="'.$image.'"><img src="'.$image.'" height="200" title="'.$image.'"></a>'."&nbsp;&nbsp;";
    $olddir = dirname($image);
}

?>