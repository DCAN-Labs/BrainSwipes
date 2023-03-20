img_dir=swipes-img

for img in `ls ${img_dir}/*.gif`; do
    echo "${img}"
    ./es2sfs_img_converter.py -i ${img} -o ${img_dir}
done