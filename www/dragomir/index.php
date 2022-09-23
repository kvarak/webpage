<?php


$images = glob("*.{jpg,jpeg,png,bmp}", GLOB_BRACE);
#$images=array_reverse($images);
natcasesort($images);

foreach ($images as $image) {
	echo '<a href="'.$image.'"><img src="'.$image.'" height="400" title="'.$image.'"></a>'."&nbsp;&nbsp;";
}

?>