img_dir="$1"

for img in `ls ${img_dir}/*.gif`; do
    echo "${img}"
    ./es2sfs_img_converter.py -i ${img} -o ${img_dir}
done

# EXAMPLE:
# ./bulk_es2sfs.sh swipes-img